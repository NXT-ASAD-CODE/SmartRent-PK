const express = require("express");
const {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  createDeviceKey,
} = require("../controllers/machineController");
const {
  createLocker,
  getLockersByMachine,
} = require("../controllers/lockerController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.get("/", getMachines);
router.get("/:id", getMachineById);
router.get("/:id/lockers", getLockersByMachine);

router.post("/", protect, authorizeRoles(ROLES.ADMIN), createMachine);
router.patch("/:id", protect, authorizeRoles(ROLES.ADMIN), updateMachine);
router.post("/:id/lockers", protect, authorizeRoles(ROLES.ADMIN), createLocker);
router.post("/:id/device-key", protect, authorizeRoles(ROLES.ADMIN), createDeviceKey);

module.exports = router;