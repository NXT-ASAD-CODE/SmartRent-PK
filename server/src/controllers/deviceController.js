const mongoose = require("mongoose");
const hardwareService = require("../services/hardwareService");

// POST /api/device/heartbeat
exports.heartbeat = async (req, res) => {
  const { doors } = req.body || {};

  const commands = await hardwareService.processHeartbeat({
    machine: req.machine,
    doors,
  });

  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    commands,
  });
};

// POST /api/device/events
exports.reportEvent = async (req, res) => {
  const { lockerNumber, event, commandId, reason } = req.body || {};

  if (!Number.isInteger(lockerNumber)) {
    return res
      .status(400)
      .json({ success: false, message: "lockerNumber must be an integer" });
  }
  if (commandId !== undefined && !mongoose.isValidObjectId(commandId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid commandId" });
  }

  const result = await hardwareService.processEvent({
    machine: req.machine,
    lockerNumber,
    event,
    commandId,
    reason: typeof reason === "string" ? reason.slice(0, 200) : undefined,
  });

  res.status(200).json({ success: true, ...result });
};