const express = require("express");
const {
  verifyReleaseCode,
  reissueReleaseCode,
} = require("../controllers/fineController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR));

router.post("/verify", verifyReleaseCode);
router.post("/reissue", reissueReleaseCode);

module.exports = router;