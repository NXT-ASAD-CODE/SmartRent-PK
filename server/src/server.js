require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { runRentalSweep } = require("./services/rentalService");

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

startServer();