const express = require("express");
const { requestOtp, verifyOtp } = require("../controllers/otpController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/request", requestOtp);
router.post("/verify", verifyOtp);

module.exports = router;