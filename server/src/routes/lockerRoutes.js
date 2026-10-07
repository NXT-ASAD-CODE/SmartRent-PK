const express = require("express");
const {
  getLockerById,
  updateLocker,
} = require("../controllers/lockerController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.get("/:id", getLockerById);
router.patch(
  "/:id",
  protect,
  authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR),
  updateLocker
);

module.exports = router;