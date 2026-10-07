const Rental = require("../models/Rental");
const Locker = require("../models/Locker");
const {
  ROLES,
  RENTAL_STATUS,
  LOCKER_STATUS,
  MACHINE_STATUS,
  CONNECTIVITY,
} = require("../config/constants");

const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const positiveNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Read at call time so .env changes apply after restart
const getRules = () => ({
  reservationMinutes: positiveNumber(process.env.RESERVATION_MINUTES, 10),
  minHours: positiveNumber(process.env.MIN_RENTAL_HOURS, 1),
  maxHours: positiveNumber(process.env.MAX_RENTAL_HOURS, 24),
  requireOnline: process.env.REQUIRE_MACHINE_ONLINE === "true",
});

const releaseLocker = (lockerId, rentalId) =>
  Locker.updateOne(
    { _id: lockerId, currentRental: rentalId, status: LOCKER_STATUS.RESERVED },
    { status: LOCKER_STATUS.AVAILABLE, currentRental: null }
  );

// Reserve a locker and create a pending rental
exports.createRental = async ({ userId, lockerId, durationHours }) => {
  const { reservationMinutes, minHours, maxHours, requireOnline } = getRules();

  if (
    !Number.isInteger(durationHours) ||
    durationHours < minHours ||
    durationHours > maxHours
  ) {
    throw httpError(
      400,
      `Duration must be a whole number of hours between ${minHours} and ${maxHours}`
    );
  }

  // One unpaid reservation per user stops anyone from locking up every locker
  const hasPending = await Rental.exists({
    user: userId,
    status: RENTAL_STATUS.PENDING_PAYMENT,
  });
  if (hasPending) {
    throw httpError(409, "You already have a rental awaiting payment. Pay or cancel it first.");
  }

  const locker = await Locker.findById(lockerId).populate("machine");
  if (!locker) throw httpError(404, "Locker not found");

  if (locker.machine.status !== MACHINE_STATUS.ACTIVE) {
    throw httpError(409, "This machine is not accepting rentals right now");
  }
  if (requireOnline && locker.machine.connectivityStatus !== CONNECTIVITY.ONLINE) {
    throw httpError(409, "This machine is offline");
  }

  // Atomic reservation: only one request can flip AVAILABLE -> RESERVED
  const reserved = await Locker.findOneAndUpdate(
    { _id: lockerId, status: LOCKER_STATUS.AVAILABLE, currentRental: null },
    { status: LOCKER_STATUS.RESERVED },
    { returnDocument: "after" }
  );
  if (!reserved) throw httpError(409, "Locker is not available");

  try {
    const rental = await Rental.create({
      user: userId,
      machine: locker.machine._id,
      locker: locker._id,
      durationHours,
      price: locker.pricePerHour * durationHours,
      reservationExpiresAt: new Date(Date.now() + reservationMinutes * 60 * 1000),
    });

    await Locker.updateOne({ _id: lockerId }, { currentRental: rental._id });
    return rental;
  } catch (err) {
    // Never leave a locker stuck in RESERVED if rental creation failed
    await Locker.updateOne(
      { _id: lockerId },
      { status: LOCKER_STATUS.AVAILABLE, currentRental: null }
    );
    throw err;
  }
};

// Cancel an unpaid rental (owner or admin)
exports.cancelRental = async ({ rentalId, user }) => {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw httpError(404, "Rental not found");

  if (String(rental.user) !== String(user._id) && user.role !== ROLES.ADMIN) {
    throw httpError(403, "You cannot cancel this rental");
  }

  const cancelled = await Rental.findOneAndUpdate(
    { _id: rentalId, status: RENTAL_STATUS.PENDING_PAYMENT },
    { status: RENTAL_STATUS.CANCELLED, endedAt: new Date() },
    { returnDocument: "after" }
  );
  if (!cancelled) {
    throw httpError(409, "Only rentals awaiting payment can be cancelled");
  }

  await releaseLocker(rental.locker, rental._id);
  return cancelled;
};

// Called by the payment step once payment is verified. Starts the timer.
exports.activateRental = async (rentalId) => {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw httpError(404, "Rental not found");

  const start = new Date();
  const expiry = new Date(start.getTime() + rental.durationHours * 60 * 60 * 1000);

  const activated = await Rental.findOneAndUpdate(
    { _id: rentalId, status: RENTAL_STATUS.PENDING_PAYMENT },
    { status: RENTAL_STATUS.ACTIVE, startTime: start, expiryTime: expiry },
    { returnDocument: "after" }
  );
  if (!activated) {
    throw httpError(409, "Rental is no longer awaiting payment");
  }

  await Locker.updateOne(
    { _id: rental.locker, currentRental: rental._id },
    { status: LOCKER_STATUS.OCCUPIED }
  );
  return activated;
};

// Background job: free stale reservations and mark overdue rentals
exports.runRentalSweep = async () => {
  const now = new Date();
  let cancelled = 0;
  let expired = 0;

  const stale = await Rental.find({
    status: RENTAL_STATUS.PENDING_PAYMENT,
    reservationExpiresAt: { $lt: now },
  }).select("_id locker");

  for (const r of stale) {
    const done = await Rental.findOneAndUpdate(
      { _id: r._id, status: RENTAL_STATUS.PENDING_PAYMENT },
      { status: RENTAL_STATUS.CANCELLED, endedAt: now }
    );
    if (done) {
      await releaseLocker(r.locker, r._id);
      cancelled++;
    }
  }

  const overdue = await Rental.find({
    status: RENTAL_STATUS.ACTIVE,
    expiryTime: { $lt: now },
  }).select("_id locker");

  for (const r of overdue) {
    const done = await Rental.findOneAndUpdate(
      { _id: r._id, status: RENTAL_STATUS.ACTIVE },
      { status: RENTAL_STATUS.EXPIRED }
    );
    if (done) {
      await Locker.updateOne(
        { _id: r.locker, currentRental: r._id },
        { status: LOCKER_STATUS.EXPIRED }
      );
      expired++;
    }
  }

  return { cancelled, expired };
};