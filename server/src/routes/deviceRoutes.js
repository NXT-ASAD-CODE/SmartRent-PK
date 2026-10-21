const express = require("express");
const { heartbeat, reportEvent } = require("../controllers/deviceController");
const { authenticateDevice } = require("../middleware/deviceMiddleware");
const {
  deviceLimiter,
  deviceAuthFailureLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

router.use(deviceAuthFailureLimiter, deviceLimiter, authenticateDevice);

router.post("/heartbeat", heartbeat);
router.post("/events", reportEvent);

module.exports = router;