const mongoose = require("mongoose");
const { FINE_STATUS } = require("../config/constants");

const fineSchema = new mongoose.Schema(
  {
    // unique: at most one fine per rental, even if the sweep runs twice
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
      unique: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "OVERDUE_ITEM" },
    status: {
      type: String,
      enum: Object.values(FINE_STATUS),
      default: FINE_STATUS.PENDING,
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

fineSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Fine", fineSchema);