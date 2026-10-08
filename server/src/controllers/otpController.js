const mongoose = require("mongoose");
const otpService = require("../services/otpService");

// POST /api/otp/request
exports.requestOtp = async (req, res) => {
  const { rentalId, purpose } = req.body;

  if (!mongoose.isValidObjectId(rentalId)) {
    return res.status(400).json({ success: false, message: "Valid rentalId is required" });
  }

  const { otp, maskedPhone, resendSeconds, devCode } = await otpService.requestOtp({
    user: req.user,
    rentalId,
    purpose,
  });

  res.status(201).json({
    success: true,
    message: `Code sent to ${maskedPhone}`,
    expiresAt: otp.expiresAt,
    resendAfterSeconds: resendSeconds,
    ...(devCode && { devCode }), // sandbox only, never in production
  });
};

// POST /api/otp/verify
exports.verifyOtp = async (req, res) => {
  const { rentalId, purpose, code } = req.body;

  if (!mongoose.isValidObjectId(rentalId)) {
    return res.status(400).json({ success: false, message: "Valid rentalId is required" });
  }
  if (!code) {
    return res.status(400).json({ success: false, message: "Code is required" });
  }

  const otp = await otpService.verifyOtp({
    user: req.user,
    rentalId,
    purpose,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Code verified",
    verifiedAt: otp.verifiedAt,
  });
};