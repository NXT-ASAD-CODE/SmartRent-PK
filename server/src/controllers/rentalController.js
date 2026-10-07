const mongoose = require("mongoose");
const Rental = require("../models/Rental");
const rentalService = require("../services/rentalService");
const { ROLES } = require("../config/constants");

const isStaff = (user) => [ROLES.ADMIN, ROLES.OPERATOR].includes(user.role);

const populateRental = (query) =>
  query
    .populate("locker", "lockerNumber size")
    .populate("machine", "machineId name location");

// POST /api/rentals
exports.createRental = async (req, res) => {
  const { lockerId, durationHours } = req.body;

  if (!mongoose.isValidObjectId(lockerId)) {
    return res.status(400).json({ success: false, message: "Valid lockerId is required" });
  }

  const rental = await rentalService.createRental({
    userId: req.user._id,
    lockerId,
    durationHours: Number(durationHours),
  });

  res.status(201).json({ success: true, rental });
};

// GET /api/rentals  (customers: own rentals, staff: all)
exports.getRentals = async (req, res) => {
  const filter = isStaff(req.user) ? {} : { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const rentals = await populateRental(Rental.find(filter).sort({ createdAt: -1 }));

  res.status(200).json({ success: true, count: rentals.length, rentals });
};

// GET /api/rentals/:id
exports.getRentalById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid rental id" });
  }

  const rental = await populateRental(Rental.findById(req.params.id));
  if (!rental) {
    return res.status(404).json({ success: false, message: "Rental not found" });
  }

  const ownerId = rental.user._id || rental.user;
  if (String(ownerId) !== String(req.user._id) && !isStaff(req.user)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  res.status(200).json({ success: true, rental });
};

// POST /api/rentals/:id/cancel
exports.cancelRental = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid rental id" });
  }

  const rental = await rentalService.cancelRental({
    rentalId: req.params.id,
    user: req.user,
  });

  res.status(200).json({ success: true, rental });
};