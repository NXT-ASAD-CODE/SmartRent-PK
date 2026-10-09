const express = require("express");
const { heartbeat, reportEvent } = require("../controllers/deviceController");
const { authenticateDevice } = require("../middleware/deviceMiddleware");

const router = express.Router();

router.use(authenticateDevice);

router.post("/heartbeat", heartbeat);
router.post("/events", reportEvent);

module.exports = router;