const crypto = require("crypto");
const Machine = require("../models/Machine");
const { hashDeviceKey } = require("../services/hardwareService");

const safeEqualHex = (a, b) => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Devices send:  x-machine-id: SR-KHI-001   x-device-key: <secret>
exports.authenticateDevice = async (req, res, next) => {
  const machineId = req.headers["x-machine-id"];
  const deviceKey = req.headers["x-device-key"];

  if (!machineId || !deviceKey) {
    return res
      .status(401)
      .json({ success: false, message: "Device credentials required" });
  }

  const machine = await Machine.findOne({
    machineId: String(machineId).toUpperCase(),
  }).select("+deviceKeyHash");

  // One generic message for every failure so nothing leaks
  if (
    !machine ||
    !machine.deviceKeyHash ||
    !safeEqualHex(machine.deviceKeyHash, hashDeviceKey(deviceKey))
  ) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid device credentials" });
  }

  req.machine = machine;
  next();
};