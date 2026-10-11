const mongoose = require("mongoose");
const {
  INCIDENT_TYPE,
  INCIDENT_SEVERITY,
  INCIDENT_STATUS,
} = require("../config/constants");

const incidentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(INCIDENT_TYPE), required: true },
    severity: {
      type: String,
      enum: Object.values(INCIDENT_SEVERITY),
      default: INCIDENT_SEVERITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(INCIDENT_STATUS),
      default: INCIDENT_STATUS.OPEN,
    },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", default: null },
    locker: { type: mongoose.Schema.Types.ObjectId, ref: "Locker", default: null },
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", default: null },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    description: { type: String, default: "" },
    detectedAt: { type: Date, default: Date.now },
    acknowledgedAt: { type: Date, default: null },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notes: [
      {
        _id: false,
        text: { type: String, maxlength: 500 },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        at: { type: Date, default: Date.now },
      },
    ],
    // true while the incident is unresolved; used to stop duplicate open incidents
    active: { type: Boolean, default: true },
    dedupeKey: { type: String, required: true },
  },
  { timestamps: true }
);

// Only one open incident per type + place + rental
incidentSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);
incidentSchema.index({ status: 1, severity: 1, detectedAt: -1 });

module.exports = mongoose.model("Incident", incidentSchema);