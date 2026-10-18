const mongoose = require("mongoose");
const Machine = require("../models/Machine");
const Locker = require("../models/Locker");
const Rental = require("../models/Rental");
const Payment = require("../models/Payment");
const Fine = require("../models/Fine");
const Incident = require("../models/Incident");
const AuditLog = require("../models/AuditLog");
const audit = require("../services/auditService");
const {
  PAYMENT_STATUS,
  FINE_STATUS,
  INCIDENT_STATUS,
  INCIDENT_TYPE,
  INCIDENT_SEVERITY,
  AUDIT_RESULT,
} = require("../config/constants");

const bad = (res, message) =>
  res.status(400).json({ success: false, message });

const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

const countBy = async (Model, field, match = {}) => {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
};

// GET /api/admin/dashboard  (admin, operator)
exports.getDashboard = async (req, res) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    machines,
    lockers,
    rentals,
    openIncidents,
    refundsRequired,
    fines,
    actions24h,
    failures24h,
  ] = await Promise.all([
    countBy(Machine, "connectivityStatus"),
    countBy(Locker, "status"),
    countBy(Rental, "status"),
    countBy(Incident, "severity", { active: true }),
    Payment.countDocuments({ status: PAYMENT_STATUS.REFUND_REQUIRED }),
    Fine.aggregate([
      { $match: { status: FINE_STATUS.PENDING } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]),
    AuditLog.countDocuments({ createdAt: { $gte: dayAgo } }),
    AuditLog.countDocuments({
      createdAt: { $gte: dayAgo },
      result: AUDIT_RESULT.FAILURE,
    }),
  ]);

  res.status(200).json({
    success: true,
    dashboard: {
      machines,
      lockers,
      rentals,
      openIncidents,
      refundsRequired,
      pendingFines: {
        count: fines[0]?.count || 0,
        total: fines[0]?.total || 0,
      },
      last24h: { actions: actions24h, failures: failures24h },
    },
  });
};

// GET /api/admin/incidents  (admin, operator)
exports.getIncidents = async (req, res) => {
  const { status, type, severity, machine, locker } = req.query;
  const filter = {};

  if (status) {
    if (!Object.values(INCIDENT_STATUS).includes(status)) return bad(res, "Invalid status");
    filter.status = status;
  }
  if (type) {
    if (!Object.values(INCIDENT_TYPE).includes(type)) return bad(res, "Invalid type");
    filter.type = type;
  }
  if (severity) {
    if (!Object.values(INCIDENT_SEVERITY).includes(severity)) return bad(res, "Invalid severity");
    filter.severity = severity;
  }
  for (const [key, value] of Object.entries({ machine, locker })) {
    if (value) {
      if (!mongoose.isValidObjectId(value)) return bad(res, `Invalid ${key} id`);
      filter[key] = value;
    }
  }

  const { page, limit, skip } = paginate(req.query);

  const [incidents, total] = await Promise.all([
    Incident.find(filter)
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("machine", "machineId name")
      .populate("locker", "lockerNumber"),
    Incident.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, page, limit, total, incidents });
};

const TRANSITIONS = {
  ACKNOWLEDGED: ["OPEN"],
  RESOLVED: ["OPEN", "ACKNOWLEDGED"],
};

// PATCH /api/admin/incidents/:id  (admin, operator)
// Body: { "status": "ACKNOWLEDGED" | "RESOLVED", "note": "optional" }
exports.updateIncident = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return bad(res, "Invalid incident id");

  const { status, note } = req.body || {};
  if (typeof status !== "string" || !Object.hasOwn(TRANSITIONS, status)) {
    return bad(res, "status must be ACKNOWLEDGED or RESOLVED");
  }

  const now = new Date();
  const set = { status };
  if (status === "ACKNOWLEDGED") {
    set.acknowledgedAt = now;
    set.acknowledgedBy = req.user._id;
  } else {
    set.resolvedAt = now;
    set.resolvedBy = req.user._id;
    set.active = false;
  }

  const update = { $set: set };
  if (typeof note === "string" && note.trim()) {
    update.$push = {
      notes: { text: note.trim().slice(0, 500), by: req.user._id, at: now },
    };
  }

  const incident = await Incident.findOneAndUpdate(
    { _id: id, status: { $in: TRANSITIONS[status] } },
    update,
    { returnDocument: "after" }
  );

  if (!incident) {
    const exists = await Incident.exists({ _id: id });
    return res.status(exists ? 409 : 404).json({
      success: false,
      message: exists
        ? "Incident cannot move to that status"
        : "Incident not found",
    });
  }

  audit.log({
    user: req.user,
    action: "INCIDENT_UPDATED",
    machine: incident.machine,
    locker: incident.locker,
    rental: incident.rental,
    metadata: { incidentId: incident._id, type: incident.type, status },
  });

  res.status(200).json({ success: true, incident });
};

// GET /api/admin/audit-logs  (admin only)
// Filters: action, result, actor, machine, locker, rental, from, to, page, limit
exports.getAuditLogs = async (req, res) => {
  const { action, result, from, to } = req.query;
  const filter = {};

  if (action) filter.action = String(action).toUpperCase();
  if (result) {
    const r = String(result).toUpperCase();
    if (!Object.values(AUDIT_RESULT).includes(r)) return bad(res, "Invalid result");
    filter.result = r;
  }

  for (const key of ["actor", "machine", "locker", "rental"]) {
    const value = req.query[key];
    if (value) {
      if (!mongoose.isValidObjectId(value)) return bad(res, `Invalid ${key} id`);
      filter[key] = value;
    }
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const d = new Date(from);
      if (Number.isNaN(d.getTime())) return bad(res, "Invalid from date");
      filter.createdAt.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (Number.isNaN(d.getTime())) return bad(res, "Invalid to date");
      filter.createdAt.$lte = d;
    }
  }

  const { page, limit, skip } = paginate(req.query);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "name role"),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, page, limit, total, logs });
};