const express = require("express");
const {
  getLockerById,
  updateLocker,
  unlockLocker,
  getLockerCommand,
  resolveLockerFailure,
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

router.post("/:id/unlock", protect, unlockLocker);
router.get("/:id/command", protect, getLockerCommand);
router.post(
  "/:id/resolve",
  protect,
  authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR),
  resolveLockerFailure
);

module.exports = router;