const express = require("express");
const {
  createRental,
  getRentals,
  getRentalById,
  cancelRental,
  holdRental,
} = require("../controllers/rentalController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.post("/", createRental);
router.get("/", getRentals);
router.get("/:id", getRentalById);
router.post("/:id/cancel", cancelRental);
router.post("/:id/hold", authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), holdRental);

module.exports = router;