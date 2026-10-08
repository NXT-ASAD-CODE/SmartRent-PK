const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const paymentService = require("../services/paymentService");
const { ROLES } = require("../config/constants");

const isStaff = (user) => [ROLES.ADMIN, ROLES.OPERATOR].includes(user.role);

// POST /api/payments/create
exports.createPayment = async (req, res) => {
  const { rentalId } = req.body;

  if (!mongoose.isValidObjectId(rentalId)) {
    return res.status(400).json({ success: false, message: "Valid rentalId is required" });
  }

  const { payment, reused, charge } = await paymentService.createPayment({
    userId: req.user._id,
    rentalId,
  });

  res.status(reused ? 200 : 201).json({
    success: true,
    payment,
    ...(charge && { qrPayload: charge.qrPayload, instructions: charge.instructions }),
  });
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
  const { paymentId, simulate } = req.body;

  if (!mongoose.isValidObjectId(paymentId)) {
    return res.status(400).json({ success: false, message: "Valid paymentId is required" });
  }

  const { payment, rental, verified } = await paymentService.verifyPayment({
    user: req.user,
    paymentId,
    simulate,
  });

  if (!verified) {
    return res.status(402).json({
      success: false,
      message: "Payment was not completed. You can try again while your reservation is held.",
      payment,
    });
  }

  res.status(200).json({ success: true, payment, rental });
};

// GET /api/payments  (customers: own, staff: all)
exports.getPayments = async (req, res) => {
  const filter = isStaff(req.user) ? {} : { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const payments = await Payment.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: payments.length, payments });
};

// GET /api/payments/:id
exports.getPaymentById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid payment id" });
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, message: "Payment not found" });
  }

  if (String(payment.user) !== String(req.user._id) && !isStaff(req.user)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  res.status(200).json({ success: true, payment });
};