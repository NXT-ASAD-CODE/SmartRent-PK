const AuditLog = require("../models/AuditLog");
const Incident = require("../models/Incident");

const maskPhone = (phone) => {
  const p = String(phone || "");
  return p.length > 7 ? `${p.slice(0, 4)}****${p.slice(-3)}` : "****";
};

// Strips undefined values and turns ObjectIds/Dates into plain JSON
const clean = (value) => JSON.parse(JSON.stringify(value || {}));

exports.maskPhone = maskPhone;

// Never throws: a logging failure must not break the real operation
exports.log = async ({
  user,
  actorType,
  action,
  result = "SUCCESS",
  machine,
  locker,
  rental,
  metadata,
}) => {
  try {
    await AuditLog.create({
      actor: (user && user._id) || null,
      actorType: actorType || (user ? "USER" : "SYSTEM"),
      role: (user && user.role) || null,
      machine: machine || null,
      locker: locker || null,
      rental: rental || null,
      action,
      result,
      metadata: clean(metadata),
    });
  } catch (err) {
    console.error(`Audit log failed (${action}):`, err.message);
  }
};

// Creates an incident unless an identical one is already open
exports.reportIncident = async ({
  type,
  severity = "MEDIUM",
  machine,
  locker,
  rental,
  payment,
  description,
}) => {
  try {
    const dedupeKey = [type, locker || machine || "", rental || ""]
      .map(String)
      .join(":");

    const incident = await Incident.create({
      type,
      severity,
      machine: machine || null,
      locker: locker || null,
      rental: rental || null,
      payment: payment || null,
      description,
      dedupeKey,
    });

    console.error(`🚨 INCIDENT [${severity}] ${type}: ${description || ""}`);
    return incident;
  } catch (err) {
    if (err.code !== 11000) {
      console.error(`Incident report failed (${type}):`, err.message);
    }
    return null; // already open, or failed to record
  }
};

// Closes matching open incidents (e.g. staff fixed the locker, machine reconnected)
exports.resolveIncidents = async ({
  types,
  machine,
  locker,
  rental,
  resolvedBy = null,
  note,
}) => {
  try {
    const filter = { active: true, type: { $in: types } };
    if (machine) filter.machine = machine;
    if (locker) filter.locker = locker;
    if (rental) filter.rental = rental;

    const now = new Date();
    const update = {
      $set: { status: "RESOLVED", active: false, resolvedAt: now, resolvedBy },
    };
    if (note) update.$push = { notes: { text: note, by: resolvedBy, at: now } };

    await Incident.updateMany(filter, update);
  } catch (err) {
    console.error("Resolving incidents failed:", err.message);
  }
};