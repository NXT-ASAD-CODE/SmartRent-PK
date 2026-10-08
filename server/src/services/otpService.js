const crypto = require("crypto");
const OTP = require("../models/OTP");
const Rental = require("../models/Rental");
const {
  RENTAL_STATUS,
  OTP_PURPOSE,
  OTP_STATUS,
} = require("../config/constants");

const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const positiveNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const getRules = () => ({
  expiryMinutes: positiveNumber(process.env.OTP_EXPIRY_MINUTES, 5),
  maxAttempts: positiveNumber(process.env.OTP_MAX_ATTEMPTS, 5),
  resendSeconds: positiveNumber(process.env.OTP_RESEND_SECONDS, 60),
  maxRequestsPerHour: positiveNumber(process.env.OTP_MAX_REQUESTS_PER_HOUR, 5),
  accessWindowMinutes: positiveNumber(process.env.OTP_ACCESS_WINDOW_MINUTES, 5),
});

const isProduction = () => process.env.NODE_ENV === "production";

// ---------------------------------------------------------------
// SMS provider interface. A real provider will implement send()
// with the same signature and replace the mock.
// ---------------------------------------------------------------
const mockSms = {
  send: async ({ phone, message }) => {
    if (!isProduction()) console.log(`📱 [MOCK SMS] to ${phone}: ${message}`);
  },
};

const getSmsProvider = () => {
  const mode = process.env.SMS_MODE || "mock";
  if (mode !== "mock") throw httpError(501, "SMS provider is not configured");
  return mockSms;
};

// ---------------------------------------------------------------

const generateCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

// HMAC with a server secret: a leaked database can't be brute-forced offline
const hashCode = (otpId, code) =>
  crypto
    .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
    .update(`${otpId}:${code}`)
    .digest("hex");

const safeEqual = (a, b) => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const maskPhone = (phone) => `${phone.slice(0, 4)}****${phone.slice(-3)}`;

const invalidate = (otpId) =>
  OTP.updateOne(
    { _id: otpId, status: OTP_STATUS.PENDING },
    { status: OTP_STATUS.INVALIDATED }
  );

const assertValidPurpose = (purpose) => {
  if (!Object.values(OTP_PURPOSE).includes(purpose)) {
    throw httpError(400, "Invalid OTP purpose");
  }
};

// Issue a code for an active rental owned by the user
exports.requestOtp = async ({ user, rentalId, purpose = OTP_PURPOSE.LOCKER_ACCESS }) => {
  assertValidPurpose(purpose);
  const { expiryMinutes, resendSeconds, maxRequestsPerHour } = getRules();
  const sms = getSmsProvider();

  const rental = await Rental.findById(rentalId);
  if (!rental) throw httpError(404, "Rental not found");
  if (String(rental.user) !== String(user._id)) {
    throw httpError(403, "This is not your rental");
  }
  if (
    rental.status !== RENTAL_STATUS.ACTIVE ||
    !rental.expiryTime ||
    rental.expiryTime <= new Date()
  ) {
    throw httpError(409, "OTP is only available for an active, paid rental");
  }

  const scope = { user: user._id, rental: rental._id, purpose };

  // Resend cooldown
  const latest = await OTP.findOne(scope).sort({ createdAt: -1 });
  if (latest) {
    const waitSeconds = Math.ceil(
      (latest.createdAt.getTime() + resendSeconds * 1000 - Date.now()) / 1000
    );
    if (waitSeconds > 0) {
      throw httpError(429, `Please wait ${waitSeconds}s before requesting another code`);
    }
  }

  // Hourly cap
  const recent = await OTP.countDocuments({
    ...scope,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (recent >= maxRequestsPerHour) {
    throw httpError(429, "Too many code requests. Try again later.");
  }

  // Only the newest code is ever valid
  await OTP.updateMany(
    { ...scope, status: OTP_STATUS.PENDING },
    { status: OTP_STATUS.INVALIDATED }
  );

  const code = generateCode();
  const otp = new OTP({
    ...scope,
    phone: user.phone,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    codeHash: "pending",
  });
  otp.codeHash = hashCode(otp._id, code);
  await otp.save();

  await sms.send({
    phone: user.phone,
    message: `Your SmartRent PK code is ${code}. It expires in ${expiryMinutes} minutes. Do not share it.`,
  });

  return {
    otp,
    maskedPhone: maskPhone(user.phone),
    resendSeconds,
    devCode: isProduction() ? undefined : code,
  };
};

// Check a code. A correct code moves the OTP to VERIFIED.
exports.verifyOtp = async ({ user, rentalId, purpose = OTP_PURPOSE.LOCKER_ACCESS, code }) => {
  assertValidPurpose(purpose);
  const { maxAttempts } = getRules();

  if (!/^\d{6}$/.test(String(code))) {
    throw httpError(400, "Code must be 6 digits");
  }

  const scope = { user: user._id, rental: rentalId, purpose };

  const otp = await OTP.findOne({ ...scope, status: OTP_STATUS.PENDING }).sort({
    createdAt: -1,
  });
  if (!otp) throw httpError(400, "No active code. Please request a new one.");

  if (otp.expiresAt <= new Date()) {
    await invalidate(otp._id);
    throw httpError(400, "Code has expired. Please request a new one.");
  }

  // Count the attempt BEFORE checking, so parallel guesses can't dodge the limit
  const attempt = await OTP.findOneAndUpdate(
    { _id: otp._id, status: OTP_STATUS.PENDING },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" }
  ).select("+codeHash");
  if (!attempt) throw httpError(400, "Code is no longer valid. Please request a new one.");

  if (attempt.attempts > maxAttempts) {
    await invalidate(attempt._id);
    throw httpError(429, "Too many incorrect attempts. Please request a new code.");
  }

  if (!safeEqual(attempt.codeHash, hashCode(attempt._id, String(code)))) {
    const left = maxAttempts - attempt.attempts;
    if (left <= 0) {
      await invalidate(attempt._id);
      throw httpError(429, "Too many incorrect attempts. Please request a new code.");
    }
    throw httpError(400, `Incorrect code. ${left} attempt(s) left.`);
  }

  const verified = await OTP.findOneAndUpdate(
    { _id: attempt._id, status: OTP_STATUS.PENDING },
    { status: OTP_STATUS.VERIFIED, verifiedAt: new Date() },
    { returnDocument: "after" }
  );
  if (!verified) throw httpError(409, "Code was already used. Please request a new one.");

  return verified;
};

// For the unlock step: proves a recent verification and uses it up (one-time).
exports.consumeVerifiedOtp = async ({
  userId,
  rentalId,
  purpose = OTP_PURPOSE.LOCKER_ACCESS,
}) => {
  const { accessWindowMinutes } = getRules();

  const consumed = await OTP.findOneAndUpdate(
    {
      user: userId,
      rental: rentalId,
      purpose,
      status: OTP_STATUS.VERIFIED,
      verifiedAt: { $gte: new Date(Date.now() - accessWindowMinutes * 60 * 1000) },
    },
    { status: OTP_STATUS.CONSUMED, usedAt: new Date() },
    { returnDocument: "after" }
  );

  if (!consumed) {
    throw httpError(403, "OTP verification required. Request and verify a code first.");
  }
  return consumed;
};