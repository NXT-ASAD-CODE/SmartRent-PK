    const express = require("express");
const {
  getDashboard,
  getIncidents,
  updateIncident,
  getAuditLogs,
} = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/dashboard", authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), getDashboard);
router.get("/incidents", authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), getIncidents);
router.patch("/incidents/:id", authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), updateIncident);
router.get("/audit-logs", authorizeRoles(ROLES.ADMIN), getAuditLogs);

module.exports = router;