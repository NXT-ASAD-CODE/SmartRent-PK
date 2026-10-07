const mongoose = require("mongoose");
const {
  LOCKER_SIZES,
  LOCKER_STATUS,
  DOOR_STATE,
} = require("../config/constants");

const lockerSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    lockerNumber: { type: Number, required: true, min: 1 },
    size: { type: String, enum: LOCKER_SIZES, default: "small" },
    status: {
      type: String,
      enum: Object.values(LOCKER_STATUS),
      default: LOCKER_STATUS.AVAILABLE,
    },
    pricePerHour: { type: Number, required: true, min: 0 }, // configurable, never hard-coded
    currentRental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },
    hardwareState: {
      doorState: {
        type: String,
        enum: Object.values(DOOR_STATE),
        default: DOOR_STATE.UNKNOWN,
      },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// A machine can't have two lockers with the same number
lockerSchema.index({ machine: 1, lockerNumber: 1 }, { unique: true });

module.exports = mongoose.model("Locker", lockerSchema);