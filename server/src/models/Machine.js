const mongoose = require("mongoose");
const { MACHINE_STATUS, CONNECTIVITY } = require("../config/constants");

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: [true, "machineId is required"],
      unique: true,
      uppercase: true,
      trim: true, // e.g. SR-KHI-001
    },
    name: { type: String, required: [true, "Name is required"], trim: true },
    location: {
      address: { type: String, required: [true, "Address is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
    },
    status: {
      type: String,
      enum: Object.values(MACHINE_STATUS),
      default: MACHINE_STATUS.ACTIVE,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: 1,
      max: 50,
    },
    connectivityStatus: {
      type: String,
      enum: Object.values(CONNECTIVITY),
      default: CONNECTIVITY.OFFLINE,
    },
    lastSeenAt: { type: Date, default: null }, // updated by the ESP32 heartbeat later
    deviceKeyHash: { type: String, default: null, select: false }, // hash of the ESP32 secret
  },
  { timestamps: true }
);

module.exports = mongoose.model("Machine", machineSchema);