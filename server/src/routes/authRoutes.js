const express = require("express");
const { registerUser } = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route is working",
  });
});

module.exports = router;