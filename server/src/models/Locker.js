const mongoose = require("mongoose");
const {
  LOCKER_SIZES,
  LOCKER_STATUS,
  DOOR_STATE,
  COMMAND_STATUS,
  ACCESS_PURPOSE,
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
    pricePerHour: { type: Number, required: true, min: 0 },
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
      lastEvent: { type: String, default: null },
    },
    // The latest access command (history is overwritten by the next command)
    command: {
      commandId: { type: mongoose.Schema.Types.ObjectId },
      purpose: { type: String, enum: Object.values(ACCESS_PURPOSE) },
      status: { type: String, enum: Object.values(COMMAND_STATUS) },
      rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental" },
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      issuedAt: Date,
      sentAt: Date,
      releasedAt: Date,
      confirmedAt: Date,
      completedAt: Date,
      failureReason: String,
    },
  },
  { timestamps: true }
);

lockerSchema.index({ machine: 1, lockerNumber: 1 }, { unique: true });
lockerSchema.index({ "command.status": 1 });

module.exports = mongoose.model("Locker", lockerSchema);