const mongoose = require("mongoose");
const Fine = require("../models/Fine");
const paymentService = require("../services/paymentService");
const expiryService = require("../services/expiryService");
const { ROLES } = require("../config/constants");

const isStaff = (user) => [ROLES.ADMIN, ROLES.OPERATOR].includes(user.role);

// GET /api/fines  (customers: own, staff: all)
exports.getFines = async (req, res) => {
  const filter = isStaff(req.user) ? {} : { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const fines = await Fine.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: fines.length, fines });
};

// GET /api/fines/:id
exports.getFineById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid fine id" });
  }

  const fine = await Fine.findById(req.params.id).populate(
    "rental",
    "status expiryTime holding"
  );
  if (!fine) {
    return res.status(404).json({ success: false, message: "Fine not found" });
  }

  if (String(fine.user) !== String(req.user._id) && !isStaff(req.user)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  res.status(200).json({ success: true, fine });
};

// POST /api/fines/:id/pay  (creates the payment; complete it with /api/payments/verify)
exports.payFine = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid fine id" });
  }

  const { payment, reused, charge } = await paymentService.createFinePayment({
    userId: req.user._id,
    fineId: req.params.id,
  });

  res.status(reused ? 200 : 201).json({
    success: true,
    payment,
    ...(charge && { qrPayload: charge.qrPayload, instructions: charge.instructions }),
  });
};

// POST /api/release-codes/verify  (admin, operator)
exports.verifyReleaseCode = async (req, res) => {
  const { rentalId, code } = req.body || {};

  if (!mongoose.isValidObjectId(rentalId)) {
    return res.status(400).json({ success: false, message: "Valid rentalId is required" });
  }
  if (!code) {
    return res.status(400).json({ success: false, message: "Code is required" });
  }

  const result = await expiryService.verifyReleaseCode({
    staff: req.user,
    rentalId,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Code verified. Hand the item to the customer.",
    ...result,
  });
};

// POST /api/release-codes/reissue  (admin, operator)
exports.reissueReleaseCode = async (req, res) => {
  const { rentalId } = req.body || {};

  if (!mongoose.isValidObjectId(rentalId)) {
    return res.status(400).json({ success: false, message: "Valid rentalId is required" });
  }

  const { code, expiresAt } = await expiryService.reissueReleaseCode({
    staff: req.user,
    rentalId,
  });

  res.status(201).json({
    success: true,
    message: "New code issued. Any previous code is now invalid. Give it to the customer only after checking their identity.",
    releaseCode: code,
    expiresAt,
  });
};