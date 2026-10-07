const mongoose = require("mongoose");
const { RENTAL_STATUS } = require("../config/constants");

const rentalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    locker: { type: mongoose.Schema.Types.ObjectId, ref: "Locker", required: true },
    durationHours: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // snapshot at booking time
    status: {
      type: String,
      enum: Object.values(RENTAL_STATUS),
      default: RENTAL_STATUS.PENDING_PAYMENT,
    },
    reservationExpiresAt: { type: Date, required: true },
    startTime: { type: Date, default: null },
    expiryTime: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

rentalSchema.index({ user: 1, status: 1 });
rentalSchema.index({ status: 1, reservationExpiresAt: 1 });
rentalSchema.index({ status: 1, expiryTime: 1 });

module.exports = mongoose.model("Rental", rentalSchema);