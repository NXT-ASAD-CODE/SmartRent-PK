const mongoose = require("mongoose");
const { OTP_PURPOSE, OTP_STATUS } = require("../config/constants");

const otpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", required: true },
    phone: { type: String, required: true },
    purpose: {
      type: String,
      enum: Object.values(OTP_PURPOSE),
      default: OTP_PURPOSE.LOCKER_ACCESS,
    },
    codeHash: { type: String, required: true, select: false }, // never store the plain code
    status: {
      type: String,
      enum: Object.values(OTP_STATUS),
      default: OTP_STATUS.PENDING,
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    verifiedAt: { type: Date, default: null },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

otpSchema.index({ user: 1, rental: 1, purpose: 1, createdAt: -1 });

// Data minimisation: delete OTP records 24 hours after they expire
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

module.exports = mongoose.model("OTP", otpSchema);