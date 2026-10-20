const express = require("express");
const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", protect, getCurrentUser);

module.exports = router;