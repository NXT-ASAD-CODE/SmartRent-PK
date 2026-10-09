const crypto = require("crypto");
const mongoose = require("mongoose");
const Machine = require("../models/Machine");
const Locker = require("../models/Locker");
const Rental = require("../models/Rental");
const Payment = require("../models/Payment");
const otpService = require("./otpService");
const {
  ROLES,
  MACHINE_STATUS,
  CONNECTIVITY,
  LOCKER_STATUS,
  DOOR_STATE,
  RENTAL_STATUS,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  COMMAND_STATUS: C,
  COMMAND_IN_FLIGHT,
  ACCESS_PURPOSE,
} = require("../config/constants");

const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const positiveNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const getRules = () => ({
  commandTimeoutMs: positiveNumber(process.env.HARDWARE_COMMAND_TIMEOUT_SECONDS, 30) * 1000,
  openWindowMs: positiveNumber(process.env.HARDWARE_OPEN_WINDOW_SECONDS, 30) * 1000,
  offlineMs: positiveNumber(process.env.HARDWARE_OFFLINE_SECONDS, 90) * 1000,
  unlockSeconds: positiveNumber(process.env.HARDWARE_UNLOCK_SECONDS, 5),
});

const EVENTS = ["LOCK_RELEASED", "DOOR_OPENED", "DOOR_CLOSED", "UNLOCK_FAILED"];

const STATUS_MESSAGES = {
  [C.PENDING]: "Waiting for the machine to receive the request.",
  [C.SENT]: "Request delivered to the machine.",
  [C.RELEASED]: "Lock released. Please open the door.",
  [C.CONFIRMED]: "Door open confirmed. Place or collect your item, then close the door.",
  [C.COMPLETED]: "Door closed. All done.",
  [C.FAILED]: "The machine could not open the locker. Staff have been alerted.",
  [C.TIMEOUT]: "The machine did not respond. Staff have been alerted.",
  [C.ABANDONED]: "The locker was not opened. Please request a new code and try again.",
};

// ---------------------------------------------------------------
// Device credentials
// ---------------------------------------------------------------

exports.hashDeviceKey = (key) =>
  crypto.createHash("sha256").update(String(key)).digest("hex");

// Creates (or replaces) the machine's secret. The plain key is returned once.
exports.rotateDeviceKey = async (machineId) => {
  const deviceKey = crypto.randomBytes(32).toString("hex");

  const machine = await Machine.findByIdAndUpdate(
    machineId,
    { deviceKeyHash: exports.hashDeviceKey(deviceKey) },
    { returnDocument: "after" }
  );
  if (!machine) throw httpError(404, "Machine not found");

  return { machine, deviceKey };
};

const isMachineOnline = (machine) => {
  const { offlineMs } = getRules();
  return (
    machine.connectivityStatus === CONNECTIVITY.ONLINE &&
    machine.lastSeenAt &&
    Date.now() - machine.lastSeenAt.getTime() < offlineMs
  );
};

// ---------------------------------------------------------------
// Command state helpers (every change is a conditional update, so
// a device event and a sweep can never both win)
// ---------------------------------------------------------------

const abandonCommand = (locker, reason, fromStatuses) =>
  Locker.findOneAndUpdate(
    {
      _id: locker._id,
      "command.commandId": locker.command.commandId,
      "command.status": { $in: fromStatuses },
    },
    { "command.status": C.ABANDONED, "command.failureReason": reason },
    { returnDocument: "after" }
  );

const failCommand = async (locker, finalStatus, reason, fromStatuses) => {
  const lockerStatus =
    finalStatus === C.TIMEOUT
      ? LOCKER_STATUS.SENSOR_TIMEOUT
      : LOCKER_STATUS.OPENING_FAILED;

  const base = {
    _id: locker._id,
    "command.commandId": locker.command.commandId,
    "command.status": { $in: fromStatuses },
  };

  const failed = await Locker.findOneAndUpdate(
    { ...base, status: LOCKER_STATUS.OCCUPIED },
    { status: lockerStatus, "command.status": finalStatus, "command.failureReason": reason },
    { returnDocument: "after" }
  );

  if (failed) {
    await Rental.updateOne(
      { _id: failed.command.rental, status: RENTAL_STATUS.ACTIVE },
      { status: RENTAL_STATUS.OPENING_FAILED }
    );
    console.error(
      `🚨 HARDWARE FAULT: locker ${locker._id} -> ${lockerStatus} (${reason || "no reason"})`
    );
    return failed;
  }

  // Locker already moved on (e.g. rental expired): still close the command
  // so it can never block the locker.
  return Locker.findOneAndUpdate(
    base,
    { "command.status": finalStatus, "command.failureReason": reason },
    { returnDocument: "after" }
  );
};

const finalizeCommand = async (locker) => {
  const now = new Date();
  const { purpose, rental: rentalId } = locker.command;

  if (purpose === ACCESS_PURPOSE.DEPOSIT) {
    await Rental.updateOne(
      { _id: rentalId, itemStoredAt: null },
      { itemStoredAt: now }
    );
    return;
  }

  // RETRIEVE: item collected, rental is finished
  await Rental.updateOne(
    { _id: rentalId, status: { $in: [RENTAL_STATUS.ACTIVE, RENTAL_STATUS.EXPIRED] } },
    { status: RENTAL_STATUS.COMPLETED, endedAt: now }
  );
  await Locker.updateOne(
    { _id: locker._id, currentRental: rentalId },
    { status: LOCKER_STATUS.AVAILABLE, currentRental: null }
  );
};

// ---------------------------------------------------------------
// Customer: request an unlock
// ---------------------------------------------------------------

exports.requestUnlock = async ({ user, lockerId }) => {
  const locker = await Locker.findById(lockerId).populate("machine");
  if (!locker) throw httpError(404, "Locker not found");

  if (locker.machine.status !== MACHINE_STATUS.ACTIVE) {
    throw httpError(409, "This machine is not available right now");
  }
  if (!isMachineOnline(locker.machine)) {
    throw httpError(409, "This machine is offline. Please try again shortly.");
  }
  if (!locker.currentRental) {
    throw httpError(409, "This locker has no active rental");
  }

  const rental = await Rental.findById(locker.currentRental);
  if (!rental || String(rental.user) !== String(user._id)) {
    throw httpError(403, "This is not your rental");
  }
  if (
    rental.status !== RENTAL_STATUS.ACTIVE ||
    !rental.expiryTime ||
    rental.expiryTime <= new Date()
  ) {
    throw httpError(409, "Your rental is not active");
  }
  if (locker.status !== LOCKER_STATUS.OCCUPIED) {
    throw httpError(409, "This locker is not ready for access");
  }
  if (COMMAND_IN_FLIGHT.includes(locker.command?.status)) {
    throw httpError(409, "An access request is already in progress for this locker");
  }

  // Authorization first: the command only exists once the OTP is spent
  await otpService.consumeVerifiedOtp({ userId: user._id, rentalId: rental._id });

  const purpose = rental.itemStoredAt ? ACCESS_PURPOSE.RETRIEVE : ACCESS_PURPOSE.DEPOSIT;

  const queued = await Locker.findOneAndUpdate(
    {
      _id: locker._id,
      status: LOCKER_STATUS.OCCUPIED,
      currentRental: rental._id,
      "command.status": { $nin: COMMAND_IN_FLIGHT },
    },
    {
      command: {
        commandId: new mongoose.Types.ObjectId(),
        purpose,
        status: C.PENDING,
        rental: rental._id,
        user: user._id,
        issuedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!queued) {
    throw httpError(
      409,
      "Another access request started at the same time. Please request a new code and try again."
    );
  }

  return queued.command;
};

// Customer (owner) or staff: check progress of the latest command
exports.getCommandStatus = async ({ user, lockerId }) => {
  const locker = await Locker.findById(lockerId);
  if (!locker) throw httpError(404, "Locker not found");

  const command = locker.command;
  if (!command || !command.status) {
    throw httpError(404, "No access request for this locker");
  }

  const isStaff = [ROLES.ADMIN, ROLES.OPERATOR].includes(user.role);
  if (!isStaff && String(command.user) !== String(user._id)) {
    throw httpError(403, "Access denied");
  }

  return {
    command: {
      commandId: command.commandId,
      purpose: command.purpose,
      status: command.status,
      issuedAt: command.issuedAt,
      confirmedAt: command.confirmedAt,
      completedAt: command.completedAt,
      failureReason: command.failureReason,
    },
    // true only when the door sensor has confirmed the physical result
    verified: [C.CONFIRMED, C.COMPLETED].includes(command.status),
    message: STATUS_MESSAGES[command.status],
    doorState: locker.hardwareState?.doorState,
  };
};

// ---------------------------------------------------------------
// Device: heartbeat + events
// ---------------------------------------------------------------

exports.processHeartbeat = async ({ machine, doors }) => {
  const { unlockSeconds } = getRules();
  const now = new Date();

  if (doors !== undefined && (!Array.isArray(doors) || doors.length > 50)) {
    throw httpError(400, "doors must be an array of up to 50 items");
  }

  await Machine.updateOne(
    { _id: machine._id },
    { connectivityStatus: CONNECTIVITY.ONLINE, lastSeenAt: now }
  );

  // Door telemetry (state changes themselves arrive as events)
  const ops = (doors || [])
    .filter(
      (d) =>
        Number.isInteger(d.lockerNumber) &&
        [DOOR_STATE.OPEN, DOOR_STATE.CLOSED].includes(d.doorState)
    )
    .map((d) => ({
      updateOne: {
        filter: { machine: machine._id, lockerNumber: d.lockerNumber },
        update: {
          "hardwareState.doorState": d.doorState,
          "hardwareState.updatedAt": now,
        },
      },
    }));
  if (ops.length) await Locker.bulkWrite(ops);

  // Commands the device still has to execute (re-delivered until acknowledged,
  // so the device must ignore a commandId it has already executed)
  const waiting = await Locker.find({
    machine: machine._id,
    "command.status": { $in: [C.PENDING, C.SENT] },
  });

  const commands = [];
  for (const locker of waiting) {
    if (locker.command.status === C.PENDING) {
      const sent = await Locker.findOneAndUpdate(
        {
          _id: locker._id,
          "command.commandId": locker.command.commandId,
          "command.status": C.PENDING,
        },
        { "command.status": C.SENT, "command.sentAt": now }
      );
      if (!sent) continue; // changed meanwhile
    }
    commands.push({
      commandId: locker.command.commandId,
      lockerNumber: locker.lockerNumber,
      action: "UNLOCK",
      unlockSeconds,
    });
  }

  return commands;
};

exports.processEvent = async ({ machine, lockerNumber, event, commandId, reason }) => {
  if (!EVENTS.includes(event)) {
    throw httpError(400, `event must be one of: ${EVENTS.join(", ")}`);
  }
  if ((event === "LOCK_RELEASED" || event === "UNLOCK_FAILED") && !commandId) {
    throw httpError(400, "commandId is required for this event");
  }

  const locker = await Locker.findOne({ machine: machine._id, lockerNumber });
  if (!locker) throw httpError(404, "Locker not found on this machine");

  const now = new Date();

  if (event === "LOCK_RELEASED") {
    const released = await Locker.findOneAndUpdate(
      {
        _id: locker._id,
        "command.commandId": commandId,
        "command.status": { $in: [C.PENDING, C.SENT] },
      },
      {
        "command.status": C.RELEASED,
        "command.releasedAt": now,
        "hardwareState.lastEvent": event,
        "hardwareState.updatedAt": now,
      }
    );
    return { accepted: Boolean(released) };
  }

  if (event === "UNLOCK_FAILED") {
    if (!locker.command?.commandId || String(locker.command.commandId) !== String(commandId)) {
      return { accepted: false };
    }
    const failed = await failCommand(locker, C.FAILED, reason || "Device reported unlock failure", [
      C.PENDING,
      C.SENT,
      C.RELEASED,
    ]);
    return { accepted: Boolean(failed) };
  }

  if (event === "DOOR_OPENED") {
    await Locker.updateOne(
      { _id: locker._id },
      {
        "hardwareState.doorState": DOOR_STATE.OPEN,
        "hardwareState.updatedAt": now,
        "hardwareState.lastEvent": event,
      }
    );

    const filter = {
      _id: locker._id,
      "command.status": { $in: [C.SENT, C.RELEASED] },
    };
    if (commandId) filter["command.commandId"] = commandId;

    const confirmed = await Locker.findOneAndUpdate(filter, {
      "command.status": C.CONFIRMED,
      "command.confirmedAt": now,
    });

    const authorized = Boolean(confirmed) || locker.command?.status === C.CONFIRMED;
    if (!authorized) {
      console.warn(
        `⚠️  Unauthorized door open: machine ${machine.machineId} locker ${lockerNumber}`
      );
      await Locker.updateOne(
        { _id: locker._id },
        { "hardwareState.lastEvent": "UNAUTHORIZED_DOOR_OPEN" }
      );
    }
    return { accepted: true, authorized };
  }

  // DOOR_CLOSED
  await Locker.updateOne(
    { _id: locker._id },
    {
      "hardwareState.doorState": DOOR_STATE.CLOSED,
      "hardwareState.updatedAt": now,
      "hardwareState.lastEvent": event,
    }
  );

  const completed = await Locker.findOneAndUpdate(
    { _id: locker._id, "command.status": C.CONFIRMED },
    { "command.status": C.COMPLETED, "command.completedAt": now },
    { returnDocument: "after" }
  );
  if (completed) await finalizeCommand(completed);

  return { accepted: true, completed: Boolean(completed) };
};

// ---------------------------------------------------------------
// Staff: resolve a hardware failure
// ---------------------------------------------------------------

exports.resolveFailure = async ({ lockerId, resolution }) => {
  if (!["RETRY", "REFUND"].includes(resolution)) {
    throw httpError(400, "resolution must be RETRY or REFUND");
  }

  const locker = await Locker.findById(lockerId);
  if (!locker) throw httpError(404, "Locker not found");

  const failureStatuses = [LOCKER_STATUS.OPENING_FAILED, LOCKER_STATUS.SENSOR_TIMEOUT];
  if (!failureStatuses.includes(locker.status)) {
    throw httpError(409, "This locker has no hardware failure to resolve");
  }

  const rentalId = locker.currentRental;
  const rental = rentalId ? await Rental.findById(rentalId) : null;

  if (resolution === "RETRY") {
    const updated = await Locker.findOneAndUpdate(
      { _id: lockerId, status: { $in: failureStatuses } },
      { status: LOCKER_STATUS.OCCUPIED },
      { returnDocument: "after" }
    );
    if (!updated) throw httpError(409, "Failure was already resolved");

    await Rental.updateOne(
      { _id: rentalId, status: RENTAL_STATUS.OPENING_FAILED },
      { status: RENTAL_STATUS.ACTIVE }
    );
    return { locker: updated };
  }

  // REFUND: end the rental, flag the payment, take the locker out of service
  const updated = await Locker.findOneAndUpdate(
    { _id: lockerId, status: { $in: failureStatuses } },
    { status: LOCKER_STATUS.MAINTENANCE, currentRental: null },
    { returnDocument: "after" }
  );
  if (!updated) throw httpError(409, "Failure was already resolved");

  await Rental.updateOne(
    { _id: rentalId, status: RENTAL_STATUS.OPENING_FAILED },
    { status: RENTAL_STATUS.CANCELLED, endedAt: new Date() }
  );
  await Payment.updateOne(
    { rental: rentalId, type: PAYMENT_TYPE.RENTAL, status: PAYMENT_STATUS.PAID },
    {
      status: PAYMENT_STATUS.REFUND_REQUIRED,
      notes: "Refund required: locker could not be opened (resolved by staff)",
    }
  );

  return {
    locker: updated,
    ...(rental?.itemStoredAt && {
      warning: "An item may still be inside this locker. Retrieve it manually.",
    }),
  };
};

// ---------------------------------------------------------------
// Background job
// ---------------------------------------------------------------

exports.runHardwareSweep = async () => {
  const { commandTimeoutMs, openWindowMs, offlineMs } = getRules();
  const now = Date.now();
  const result = { machinesOffline: 0, abandoned: 0, timedOut: 0 };

  const offline = await Machine.updateMany(
    {
      connectivityStatus: CONNECTIVITY.ONLINE,
      $or: [{ lastSeenAt: null }, { lastSeenAt: { $lt: new Date(now - offlineMs) } }],
    },
    { connectivityStatus: CONNECTIVITY.OFFLINE }
  );
  result.machinesOffline = offline.modifiedCount;

  // Never picked up: nothing physical happened
  const notPickedUp = await Locker.find({
    "command.status": C.PENDING,
    "command.issuedAt": { $lt: new Date(now - commandTimeoutMs) },
  });
  for (const locker of notPickedUp) {
    const done = await abandonCommand(locker, "Machine did not pick up the request", [C.PENDING]);
    if (done) result.abandoned++;
  }

  // Delivered but never acknowledged: possible hardware fault
  const unanswered = await Locker.find({
    "command.status": C.SENT,
    "command.sentAt": { $lt: new Date(now - commandTimeoutMs) },
  });
  for (const locker of unanswered) {
    const done = await failCommand(locker, C.TIMEOUT, "Machine did not acknowledge the command", [C.SENT]);
    if (done) result.timedOut++;
  }

  // Lock released but the door was never opened
  const unopened = await Locker.find({
    "command.status": C.RELEASED,
    "command.releasedAt": { $lt: new Date(now - openWindowMs) },
  });
  for (const locker of unopened) {
    const done = await abandonCommand(locker, "Door was not opened after the lock released", [C.RELEASED]);
    if (done) result.abandoned++;
  }

  return result;
};