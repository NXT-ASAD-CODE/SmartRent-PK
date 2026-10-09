const crypto = require("crypto");
const Payment = require("../models/Payment");
const Rental = require("../models/Rental");
const Fine = require("../models/Fine");
const rentalService = require("./rentalService");
const expiryService = require("./expiryService");
const {
  ROLES,
  RENTAL_STATUS,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  FINE_STATUS,
} = require("../config/constants");

const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

// ---------------------------------------------------------------
// Provider interface. A real provider (JazzCash, Easypaisa, etc.)
// will implement the same two functions and replace the mock.
// ---------------------------------------------------------------
const mockProvider = {
  createCharge: ({ amount }) => {
    const providerReference = `MOCK-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    return {
      providerReference,
      qrPayload: `smartrent-mock://pay?ref=${providerReference}&amount=${amount}`,
      instructions: "SANDBOX: no real money is charged. Call /api/payments/verify to complete.",
    };
  },

  // In a real provider this is a server-to-server call.
  // The mock lets testers choose the outcome with `simulate`.
  verifyCharge: ({ simulate }) => ({ paid: simulate !== "fail" }),
};

const getProvider = () => {
  const mode = process.env.PAYMENT_MODE || "mock";
  if (mode !== "mock") {
    throw httpError(501, "Payment provider is not configured");
  }
  return mockProvider;
};

// ---------------------------------------------------------------

exports.createPayment = async ({ userId, rentalId }) => {
  const provider = getProvider();

  const rental = await Rental.findById(rentalId);
  if (!rental) throw httpError(404, "Rental not found");
  if (String(rental.user) !== String(userId)) {
    throw httpError(403, "You cannot pay for this rental");
  }
  if (rental.status !== RENTAL_STATUS.PENDING_PAYMENT) {
    throw httpError(409, "This rental is not awaiting payment");
  }

  // Reuse an open payment instead of creating duplicates
  const open = await Payment.findOne({
    rental: rentalId,
    type: PAYMENT_TYPE.RENTAL,
    status: PAYMENT_STATUS.PENDING,
  });
  if (open) return { payment: open, reused: true };

  const charge = provider.createCharge({ amount: rental.price });

  try {
    const payment = await Payment.create({
      rental: rental._id,
      user: userId,
      amount: rental.price,
      type: PAYMENT_TYPE.RENTAL,
      providerReference: charge.providerReference,
      notes: charge.instructions,
    });
    return { payment, reused: false, charge };
  } catch (err) {
    // Two simultaneous requests: the unique index let only one through
    if (err.code === 11000) {
      const existing = await Payment.findOne({
        rental: rentalId,
        type: PAYMENT_TYPE.RENTAL,
        status: PAYMENT_STATUS.PENDING,
      });
      if (existing) return { payment: existing, reused: true };
    }
    throw err;
  }
};

exports.createFinePayment = async ({ userId, fineId }) => {
  const provider = getProvider();

  const fine = await Fine.findById(fineId);
  if (!fine) throw httpError(404, "Fine not found");
  if (String(fine.user) !== String(userId)) {
    throw httpError(403, "You cannot pay this fine");
  }
  if (fine.status !== FINE_STATUS.PENDING) {
    throw httpError(409, "This fine has already been paid");
  }

  const open = await Payment.findOne({
    rental: fine.rental,
    type: PAYMENT_TYPE.FINE,
    status: PAYMENT_STATUS.PENDING,
  });
  if (open) return { payment: open, reused: true };

  const charge = provider.createCharge({ amount: fine.amount });

  try {
    const payment = await Payment.create({
      rental: fine.rental,
      user: userId,
      amount: fine.amount,
      type: PAYMENT_TYPE.FINE,
      providerReference: charge.providerReference,
      notes: charge.instructions,
    });
    return { payment, reused: false, charge };
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Payment.findOne({
        rental: fine.rental,
        type: PAYMENT_TYPE.FINE,
        status: PAYMENT_STATUS.PENDING,
      });
      if (existing) return { payment: existing, reused: true };
    }
    throw err;
  }
};

exports.verifyPayment = async ({ user, paymentId, simulate }) => {
  const provider = getProvider();

  const payment = await Payment.findById(paymentId);
  if (!payment) throw httpError(404, "Payment not found");

  const isOwner = String(payment.user) === String(user._id);
  if (!isOwner && user.role !== ROLES.ADMIN) {
    throw httpError(403, "You cannot verify this payment");
  }

  // Idempotent: verifying a paid payment again is harmless
  if (payment.status === PAYMENT_STATUS.PAID) {
    const rental = await Rental.findById(payment.rental);
    if (payment.type === PAYMENT_TYPE.FINE) {
      // Safe to repeat: finishes settlement if an earlier call was interrupted
      const { fine, releaseCode, expiresAt } = await expiryService.settleFinePayment(payment);
      return { payment, rental, verified: true, fine, releaseCode, releaseCodeExpiresAt: expiresAt };
    }
    return { payment, rental, verified: true };
  }
  if (payment.status !== PAYMENT_STATUS.PENDING) {
    throw httpError(409, `Payment is ${payment.status} and cannot be verified`);
  }

  const result = provider.verifyCharge({ simulate });

  if (!result.paid) {
    const failed = await Payment.findOneAndUpdate(
      { _id: payment._id, status: PAYMENT_STATUS.PENDING },
      { status: PAYMENT_STATUS.FAILED },
      { returnDocument: "after" }
    );
    return { payment: failed || payment, rental: null, verified: false };
  }

  // Only one verify request can flip PENDING -> PAID
  const paid = await Payment.findOneAndUpdate(
    { _id: payment._id, status: PAYMENT_STATUS.PENDING },
    { status: PAYMENT_STATUS.PAID, paidAt: new Date() },
    { returnDocument: "after" }
  );
  if (!paid) {
    const current = await Payment.findById(payment._id);
    const rental = await Rental.findById(payment.rental);
    return { payment: current, rental, verified: current.status === PAYMENT_STATUS.PAID };
  }

  // Fine payment: settle the fine and issue the release code
  if (paid.type === PAYMENT_TYPE.FINE) {
    const { fine, releaseCode, expiresAt } = await expiryService.settleFinePayment(paid);
    const rental = await Rental.findById(paid.rental);
    return { payment: paid, rental, verified: true, fine, releaseCode, releaseCodeExpiresAt: expiresAt };
  }

  try {
    const rental = await rentalService.activateRental(payment.rental);
    return { payment: paid, rental, verified: true };
  } catch (err) {
    // Money received but the rental can no longer start (e.g. reservation expired)
    await Payment.updateOne(
      { _id: paid._id },
      {
        status: PAYMENT_STATUS.REFUND_REQUIRED,
        notes: `Payment received but rental could not be activated: ${err.message}`,
      }
    );
    throw httpError(
      409,
      "Payment was received but your reservation had expired. It has been flagged for a refund."
    );
  }
};