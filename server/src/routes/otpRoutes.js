const express = require("express");
const { requestOtp, verifyOtp } = require("../controllers/otpController");
const { protect } = require("../middleware/authMiddleware");
const { otpLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.use(protect, otpLimiter);

router.post("/request", requestOtp);
router.post("/verify", verifyOtp);

module.exports = router;