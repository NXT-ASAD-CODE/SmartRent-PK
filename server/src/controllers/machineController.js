const mongoose = require("mongoose");
const Machine = require("../models/Machine");
const hardwareService = require("../services/hardwareService");

const MACHINE_EDITABLE_FIELDS = ["name", "location", "status", "capacity"];

// POST /api/machines (admin)
exports.createMachine = async (req, res) => {
  const { machineId, name, location, capacity } = req.body;

  const machine = await Machine.create({ machineId, name, location, capacity });

  res.status(201).json({ success: true, machine });
};

// GET /api/machines (public)
exports.getMachines = async (req, res) => {
  const filter = {};
  if (req.query.city) filter["location.city"] = new RegExp(`^${req.query.city}$`, "i");
  if (req.query.status) filter.status = req.query.status;

  const machines = await Machine.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: machines.length, machines });
};

// GET /api/machines/:id (public)
exports.getMachineById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid machine id" });
  }

  const machine = await Machine.findById(req.params.id);
  if (!machine) {
    return res.status(404).json({ success: false, message: "Machine not found" });
  }

  res.status(200).json({ success: true, machine });
};

// PATCH /api/machines/:id (admin)
exports.updateMachine = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid machine id" });
  }

  // Whitelist fields: connectivityStatus/lastSeenAt are controlled by hardware only
  const updates = {};
  MACHINE_EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const machine = await Machine.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!machine) {
    return res.status(404).json({ success: false, message: "Machine not found" });
  }

  res.status(200).json({ success: true, machine });
};
// POST /api/machines/:id/device-key (admin) - creates or rotates the ESP32 secret
exports.createDeviceKey = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid machine id" });
  }

  const { machine, deviceKey } = await hardwareService.rotateDeviceKey(req.params.id);

  res.status(201).json({
    success: true,
    message: "Store this key on the device now. It will not be shown again.",
    machineId: machine.machineId,
    deviceKey,
  });
};