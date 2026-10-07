const express = require("express");
const {
  createRental,
  getRentals,
  getRentalById,
  cancelRental,
} = require("../controllers/rentalController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createRental);
router.get("/", getRentals);
router.get("/:id", getRentalById);
router.post("/:id/cancel", cancelRental);

module.exports = router;