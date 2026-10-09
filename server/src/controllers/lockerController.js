const mongoose = require("mongoose");
const Machine = require("../models/Machine");
const Locker = require("../models/Locker");
const hardwareService = require("../services/hardwareService");
const { LOCKER_STATUS } = require("../config/constants");

// Admins/operators may only toggle these manually.
// Every other status is owned by the rental/hardware engine.
const MANUAL_STATUSES = [LOCKER_STATUS.AVAILABLE, LOCKER_STATUS.MAINTENANCE];

// POST /api/machines/:id/lockers (admin)
exports.createLocker = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid machine id" });
  }

  const machine = await Machine.findById(id);
  if (!machine) {
    return res.status(404).json({ success: false, message: "Machine not found" });
  }

  const existing = await Locker.countDocuments({ machine: id });
  if (existing >= machine.capacity) {
    return res.status(400).json({
      success: false,
      message: `Machine capacity (${machine.capacity}) reached`,
    });
  }

  const { lockerNumber, size, pricePerHour } = req.body;

  const locker = await Locker.create({
    machine: id,
    lockerNumber,
    size,
    pricePerHour,
  });

  res.status(201).json({ success: true, locker });
};

// GET /api/machines/:id/lockers (public)
exports.getLockersByMachine = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid machine id" });
  }

  const filter = { machine: id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.size) filter.size = req.query.size;

  const lockers = await Locker.find(filter).sort({ lockerNumber: 1 });

  res.status(200).json({ success: true, count: lockers.length, lockers });
};

// GET /api/lockers/:id (public)
exports.getLockerById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid locker id" });
  }

  const locker = await Locker.findById(req.params.id).populate(
    "machine",
    "machineId name location status connectivityStatus"
  );
  if (!locker) {
    return res.status(404).json({ success: false, message: "Locker not found" });
  }

  res.status(200).json({ success: true, locker });
};

// PATCH /api/lockers/:id (admin, operator)
exports.updateLocker = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid locker id" });
  }

  const locker = await Locker.findById(req.params.id);
  if (!locker) {
    return res.status(404).json({ success: false, message: "Locker not found" });
  }

  const { status, size, pricePerHour } = req.body;

  if (status !== undefined) {
    if (!MANUAL_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status can only be set manually to: ${MANUAL_STATUSES.join(", ")}`,
      });
    }
    if (locker.currentRental) {
      return res.status(409).json({
        success: false,
        message: "Cannot change status while a rental is attached to this locker",
      });
    }
    locker.status = status;
  }
  if (size !== undefined) locker.size = size;
  if (pricePerHour !== undefined) locker.pricePerHour = pricePerHour;

  await locker.save(); // runs validators

  res.status(200).json({ success: true, locker });
};
// POST /api/lockers/:id/unlock  (rental owner, verified OTP required)
exports.unlockLocker = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid locker id" });
  }

  const command = await hardwareService.requestUnlock({
    user: req.user,
    lockerId: req.params.id,
  });

  // 202: queued, NOT confirmed. Poll GET /:id/command for the real result.
  res.status(202).json({
    success: true,
    confirmed: false,
    message: "Unlock requested. Waiting for the machine to confirm.",
    command: {
      commandId: command.commandId,
      purpose: command.purpose,
      status: command.status,
    },
  });
};

// GET /api/lockers/:id/command  (rental owner or staff)
exports.getLockerCommand = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid locker id" });
  }

  const result = await hardwareService.getCommandStatus({
    user: req.user,
    lockerId: req.params.id,
  });

  res.status(200).json({ success: true, ...result });
};

// POST /api/lockers/:id/resolve  (admin, operator)
exports.resolveLockerFailure = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid locker id" });
  }

  const { resolution } = req.body || {};
  const result = await hardwareService.resolveFailure({
    lockerId: req.params.id,
    resolution,
  });

  res.status(200).json({ success: true, ...result });
};