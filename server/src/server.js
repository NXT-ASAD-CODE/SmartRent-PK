require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { runRentalSweep } = require("./services/rentalService");
const { runHardwareSweep } = require("./services/hardwareService");
const { runExpirySweep } = require("./services/expiryService");

const PORT = process.env.PORT || 5000;
const SWEEP_INTERVAL_MS = 60 * 1000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 SmartRent PK API is running on port ${PORT}`);
  });

  setInterval(async () => {
    try {
      const { cancelled, expired } = await runRentalSweep();
      if (cancelled || expired) {
        console.log(`🧹 Sweep: ${cancelled} reservations released, ${expired} rentals expired`);
      }
    } catch (err) {
      console.error("Rental sweep failed:", err.message);
    }
  }, SWEEP_INTERVAL_MS);
};
setInterval(async () => {
  try {
    const { machinesOffline, abandoned, timedOut } = await runHardwareSweep();
    if (machinesOffline || abandoned || timedOut) {
      console.log(
        `🔧 Hardware sweep: ${machinesOffline} offline, ${abandoned} abandoned, ${timedOut} timed out`
      );
    }
  } catch (err) {
    console.error("Hardware sweep failed:", err.message);
  }
}, 15 * 1000);
setInterval(async () => {
  try {
    const { finesCreated, released } = await runExpirySweep();
    if (finesCreated || released) {
      console.log(`⏰ Expiry sweep: ${finesCreated} fines created, ${released} empty lockers released`);
    }
  } catch (err) {
    console.error("Expiry sweep failed:", err.message);
  }
}, 60 * 1000);
//asad
startServer();