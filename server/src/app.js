const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { apiLimiter } = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const machineRoutes = require("./routes/machineRoutes");
const lockerRoutes = require("./routes/lockerRoutes");
const rentalRoutes = require("./routes/rentalRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const otpRoutes = require("./routes/otpRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const fineRoutes = require("./routes/fineRoutes");
const releaseRoutes = require("./routes/releaseRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Behind a reverse proxy, set TRUST_PROXY to the number of proxies (usually 1)
// so rate limits see the real client IP instead of the proxy's.
const proxyHops = Number(process.env.TRUST_PROXY);
if (Number.isInteger(proxyHops) && proxyHops > 0) {
  app.set("trust proxy", proxyHops);
}

// Secure headers (also removes X-Powered-By)
app.use(helmet());

// CORS: only the listed browser origins. Requests with no Origin header
// (Postman, curl, the ESP32) are not browsers and are not affected.
const allowedOrigins = (
  process.env.CLIENT_URL || (isProduction ? "" : "http://localhost:3000")
)
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (isProduction && allowedOrigins.length === 0) {
  console.warn("⚠️  CLIENT_URL is not set: all browser origins will be blocked");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, allowedOrigins.includes(origin));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

// Small body limit: this API only ever receives short JSON
app.use(express.json({ limit: "10kb" }));

// Express 5 leaves req.body undefined when no JSON was sent
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartRent PK API is running",
  });
});

// General rate limit for the whole API (devices are excluded inside the limiter)
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/lockers", lockerRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/release-codes", releaseRoutes);
app.use("/api/admin", adminRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;