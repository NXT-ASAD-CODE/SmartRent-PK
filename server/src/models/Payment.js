const mongoose = require("mongoose");
const { PAYMENT_TYPE, PAYMENT_STATUS } = require("../config/constants");

const paymentSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: Object.values(PAYMENT_TYPE),
      default: PAYMENT_TYPE.RENTAL,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    provider: { type: String, default: "MOCK" },
    providerReference: { type: String, required: true, unique: true },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Only one open (PENDING) payment per rental and type at a time
paymentSchema.index(
  { rental: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: PAYMENT_STATUS.PENDING } }
);
paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);