const express = require("express");
const {
  getFines,
  getFineById,
  payFine,
} = require("../controllers/fineController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getFines);
router.get("/:id", getFineById);
router.post("/:id/pay", payFine);

module.exports = router;