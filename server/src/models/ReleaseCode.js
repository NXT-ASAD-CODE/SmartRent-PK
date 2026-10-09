const mongoose = require("mongoose");
const { RELEASE_CODE_STATUS } = require("../config/constants");

const releaseCodeSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    codeHash: { type: String, required: true, select: false }, // never store the plain code
    status: {
      type: String,
      enum: Object.values(RELEASE_CODE_STATUS),
      default: RELEASE_CODE_STATUS.ACTIVE,  
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = issued on payment
    usedAt: { type: Date, default: null },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Only one ACTIVE code per rental
releaseCodeSchema.index(
  { rental: 1 },
  { unique: true, partialFilterExpression: { status: RELEASE_CODE_STATUS.ACTIVE } }
);

module.exports = mongoose.model("ReleaseCode", releaseCodeSchema);