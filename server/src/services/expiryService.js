const crypto = require("crypto");
const Rental = require("../models/Rental");
const Locker = require("../models/Locker");
const Fine = require("../models/Fine");
const ReleaseCode = require("../models/ReleaseCode");
const {
  RENTAL_STATUS,
  LOCKER_STATUS,
  FINE_STATUS,
  RELEASE_CODE_STATUS,
  COMMAND_IN_FLIGHT,
} = require("../config/constants");

const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const positiveNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const getRules = () => ({
  fineAmount: positiveNumber(process.env.FINE_AMOUNT, 200),
  codeExpiryDays: positiveNumber(process.env.RELEASE_CODE_EXPIRY_DAYS, 7),
  maxAttempts: positiveNumber(process.env.RELEASE_CODE_MAX_ATTEMPTS, 5),
});

// ---------------------------------------------------------------
// Release code helpers
// ---------------------------------------------------------------

const generateCode = () => String(crypto.randomInt(0, 100000000)).padStart(8, "0");

const hashCode = (codeId, code) =>
  crypto
    .createHmac(
      "sha256",
      process.env.RELEASE_CODE_SECRET || process.env.OTP_SECRET || process.env.JWT_SECRET
    )
    .update(`${codeId}:${code}`)
    .digest("hex");

const safeEqual = (a, b) => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const invalidate = (codeId) =>
  ReleaseCode.updateOne(
    { _id: codeId, status: RELEASE_CODE_STATUS.ACTIVE },
    { status: RELEASE_CODE_STATUS.INVALIDATED }
  );

// Replaces any existing active code. The plain code is returned once.
const issueReleaseCode = async ({ rentalId, userId, issuedBy = null }) => {
  const { codeExpiryDays } = getRules();

  await ReleaseCode.updateMany(
    { rental: rentalId, status: RELEASE_CODE_STATUS.ACTIVE },
    { status: RELEASE_CODE_STATUS.INVALIDATED }
  );

  const code = generateCode();
  const release = new ReleaseCode({
    rental: rentalId,
    user: userId,
    issuedBy,
    expiresAt: new Date(Date.now() + codeExpiryDays * 24 * 60 * 60 * 1000),
    codeHash: "pending",
  });
  release.codeHash = hashCode(release._id, code);
  await release.save();

  return { code, release };
};

// ---------------------------------------------------------------
// Expiry sweep
// ---------------------------------------------------------------

exports.runExpirySweep = async () => {
  const { fineAmount } = getRules();
  const now = new Date();
  const result = { finesCreated: 0, released: 0 };

  const rentals = await Rental.find({
    status: RENTAL_STATUS.EXPIRED,
    expiryProcessedAt: null,
  }).limit(100);

  for (const rental of rentals) {
    try {
      // Wait while a door command for this rental is still in progress
      const locker = await Locker.findById(rental.locker);
      const cmd = locker && locker.command;
      if (
        cmd &&
        String(cmd.rental) === String(rental._id) &&
        COMMAND_IN_FLIGHT.includes(cmd.status)
      ) {
        continue;
      }

      if (rental.itemStoredAt) {
        // Item is inside: fine the customer. Locker stays EXPIRED (blocked).
        try {
          await Fine.create({ rental: rental._id, user: rental.user, amount: fineAmount });
          result.finesCreated++;
        } catch (err) {
          if (err.code !== 11000) throw err; // already fined: fine
        }
        await Rental.updateOne(
          { _id: rental._id, expiryProcessedAt: null },
          { expiryProcessedAt: now }
        );
      } else {
        // Nothing was ever stored: no fine, free the locker
        const claimed = await Rental.findOneAndUpdate(
          { _id: rental._id, status: RENTAL_STATUS.EXPIRED, expiryProcessedAt: null },
          { expiryProcessedAt: now, endedAt: now }
        );
        if (claimed) {
          await Locker.updateOne(
            { _id: rental.locker, currentRental: rental._id },
            { status: LOCKER_STATUS.AVAILABLE, currentRental: null }
          );
          result.released++;
        }
      }
    } catch (err) {
      // Left unprocessed, so the next sweep retries it
      console.error(`Expiry handling failed for rental ${rental._id}:`, err.message);
    }
  }

  return result;
};

// ---------------------------------------------------------------
// Operator: move the item to a secure holding location
// ---------------------------------------------------------------

exports.moveToHolding = async ({ staff, rentalId, location }) => {
  if (typeof location !== "string" || !location.trim()) {
    throw httpError(400, "Holding location is required");
  }

  const rental = await Rental.findById(rentalId);
  if (!rental) throw httpError(404, "Rental not found");

  const held = await Rental.findOneAndUpdate(
    {
      _id: rentalId,
      status: RENTAL_STATUS.EXPIRED,
      expiryProcessedAt: { $ne: null },
      itemStoredAt: { $ne: null },
    },
    {
      status: RENTAL_STATUS.HOLDING,
      "holding.location": location.trim().slice(0, 100),
      "holding.movedBy": staff._id,
      "holding.movedAt": new Date(),
    },
    { returnDocument: "after" }
  );
  if (!held) {
    throw httpError(409, "Only an expired rental with a stored item can be moved to holding");
  }

  // The item is out of the locker, so the locker can be rented again
  await Locker.updateOne(
    { _id: rental.locker, currentRental: rental._id },
    { status: LOCKER_STATUS.AVAILABLE, currentRental: null }
  );

  return held;
};

// ---------------------------------------------------------------
// Fine payment settled -> issue the one-time release code
// ---------------------------------------------------------------

exports.settleFinePayment = async (payment) => {
  const fine = await Fine.findOneAndUpdate(
    { rental: payment.rental, status: FINE_STATUS.PENDING },
    { status: FINE_STATUS.PAID, paidAt: new Date(), payment: payment._id },
    { returnDocument: "after" }
  );

  // Already settled by an earlier call: the code cannot be shown again
  if (!fine) {
    return {
      fine: await Fine.findOne({ rental: payment.rental }),
      releaseCode: null,
      expiresAt: null,
    };
  }

  const { code, release } = await issueReleaseCode({
    rentalId: fine.rental,
    userId: fine.user,
  });

  return { fine, releaseCode: code, expiresAt: release.expiresAt };
};

// ---------------------------------------------------------------
// Staff: verify a release code and hand the item over
// ---------------------------------------------------------------

exports.verifyReleaseCode = async ({ staff, rentalId, code }) => {
  const { maxAttempts } = getRules();

  if (!/^\d{8}$/.test(String(code))) {
    throw httpError(400, "Code must be 8 digits");
  }

  const rental = await Rental.findById(rentalId);
  if (!rental) throw httpError(404, "Rental not found");
  if (![RENTAL_STATUS.EXPIRED, RENTAL_STATUS.HOLDING].includes(rental.status)) {
    throw httpError(409, "This rental is not awaiting release");
  }

  const release = await ReleaseCode.findOne({
    rental: rentalId,
    status: RELEASE_CODE_STATUS.ACTIVE,
  });
  if (!release) {
    throw httpError(400, "No active release code. The fine must be paid, or staff must reissue a code.");
  }
  if (release.expiresAt <= new Date()) {
    await invalidate(release._id);
    throw httpError(400, "Release code has expired. Staff must reissue one.");
  }

  // Count the attempt BEFORE checking so parallel guesses can't dodge the limit
  const attempt = await ReleaseCode.findOneAndUpdate(
    { _id: release._id, status: RELEASE_CODE_STATUS.ACTIVE },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" }
  ).select("+codeHash");
  if (!attempt) throw httpError(400, "Release code is no longer valid");

  if (attempt.attempts > maxAttempts) {
    await invalidate(attempt._id);
    throw httpError(429, "Too many incorrect attempts. Staff must reissue a code.");
  }

  if (!safeEqual(attempt.codeHash, hashCode(attempt._id, String(code)))) {
    const left = maxAttempts - attempt.attempts;
    if (left <= 0) {
      await invalidate(attempt._id);
      throw httpError(429, "Too many incorrect attempts. Staff must reissue a code.");
    }
    throw httpError(400, `Incorrect code. ${left} attempt(s) left.`);
  }

  // Work out where the item is before changing anything
  const locker = await Locker.findById(rental.locker).populate("machine", "machineId name");
  const itemLocation =
    rental.status === RENTAL_STATUS.HOLDING
      ? `Holding: ${rental.holding.location}`
      : `Locker ${locker?.lockerNumber} at ${locker?.machine?.machineId} (open with manual access)`;

  const used = await ReleaseCode.findOneAndUpdate(
    { _id: attempt._id, status: RELEASE_CODE_STATUS.ACTIVE },
    { status: RELEASE_CODE_STATUS.USED, usedAt: new Date(), usedBy: staff._id },
    { returnDocument: "after" }
  );
  if (!used) throw httpError(409, "This code was already used");

  const released = await Rental.findOneAndUpdate(
    { _id: rentalId, status: { $in: [RENTAL_STATUS.EXPIRED, RENTAL_STATUS.HOLDING] } },
    { status: RENTAL_STATUS.RELEASED, endedAt: new Date(), releasedBy: staff._id },
    { returnDocument: "after" }
  );

  // If the item was still in the locker, the locker is free once staff empties it
  await Locker.updateOne(
    { _id: rental.locker, currentRental: rental._id },
    { status: LOCKER_STATUS.AVAILABLE, currentRental: null }
  );

  return { rental: released, itemLocation };
};

// ---------------------------------------------------------------
// Staff: lost or compromised code -> issue a replacement
// ---------------------------------------------------------------

exports.reissueReleaseCode = async ({ staff, rentalId }) => {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw httpError(404, "Rental not found");
  if (![RENTAL_STATUS.EXPIRED, RENTAL_STATUS.HOLDING].includes(rental.status)) {
    throw httpError(409, "This rental is not awaiting release");
  }

  const fine = await Fine.findOne({ rental: rentalId });
  if (!fine || fine.status !== FINE_STATUS.PAID) {
    throw httpError(409, "The fine must be paid before a release code can be issued");
  }

  const { code, release } = await issueReleaseCode({
    rentalId,
    userId: rental.user,
    issuedBy: staff._id,
  });

  return { code, expiresAt: release.expiresAt };
};