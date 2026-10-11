const mongoose = require("mongoose");
const { ACTOR_TYPE, AUDIT_RESULT } = require("../config/constants");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorType: { type: String, enum: Object.values(ACTOR_TYPE), required: true },
    role: { type: String, default: null },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", default: null },
    locker: { type: mongoose.Schema.Types.ObjectId, ref: "Locker", default: null },
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", default: null },
    action: { type: String, required: true, uppercase: true, trim: true },
    result: {
      type: String,
      enum: Object.values(AUDIT_RESULT),
      default: AUDIT_RESULT.SUCCESS,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Append-only: the application can add records but never change or delete them
const blocked = () => {
  throw new Error("Audit logs are append-only");
};

auditLogSchema.pre(
  [
    "updateOne",
    "updateMany",
    "findOneAndUpdate",
    "findOneAndReplace",
    "replaceOne",
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
  ],
  blocked
);

auditLogSchema.pre("save", function () {
  if (!this.isNew) throw new Error("Audit logs are append-only");
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ rental: 1, createdAt: -1 });
auditLogSchema.index({ locker: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);