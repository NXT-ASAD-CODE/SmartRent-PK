const express = require("express");
const {
  verifyReleaseCode,
  reissueReleaseCode,
} = require("../controllers/fineController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { releaseCodeLimiter } = require("../middleware/rateLimiter");
const { ROLES } = require("../config/constants");

const router = express.Router();

// Role check first, so customers get a 403 and are never counted
router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), releaseCodeLimiter);

router.post("/verify", verifyReleaseCode);
router.post("/reissue", reissueReleaseCode);

module.exports = router;