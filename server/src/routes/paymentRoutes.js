const express = require("express");
const {
  createPayment,
  verifyPayment,
  getPayments,
  getPaymentById,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/create", createPayment);
router.post("/verify", verifyPayment);
router.get("/", getPayments);
router.get("/:id", getPaymentById);

module.exports = router;