const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const audit = require("../services/auditService");

const MINUTE = 60 * 1000;

// Logged-in routes are limited per user; everything else per IP
const byUserOrIp = (req) =>
  req.user ? `user:${req.user._id}` : ipKeyGenerator(req.ip);

const buildLimiter = ({
  name,
  windowMs,
  limit,
  message,
  keyGenerator,
  skip,
  skipSuccessfulRequests = false,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests,
    ...(keyGenerator && { keyGenerator }),
    ...(skip && { skip }),
    handler: (req, res) => {
      // Log once per window so blocked requests can't flood the audit log
      if (req.rateLimit && req.rateLimit.used === req.rateLimit.limit + 1) {
        audit.log({
          user: req.user,
          actorType: req.originalUrl.startsWith("/api/device") ? "DEVICE" : undefined,
          action: "RATE_LIMITED",
          result: "FAILURE",
          metadata: { limiter: name, path: req.originalUrl, ip: req.ip },
        });
      }
      res.status(429).json({ success: false, message });
    },
  });

// Whole API, except devices (they send a heartbeat every few seconds)
exports.apiLimiter = buildLimiter({
  name: "api",
  windowMs: 15 * MINUTE,
  limit: 300,
  skip: (req) => req.path.startsWith("/device"),
  message: "Too many requests. Please slow down and try again later.",
});

// Only failed logins count, so normal use is never blocked
exports.loginLimiter = buildLimiter({
  name: "login",
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});

exports.registerLimiter = buildLimiter({
  name: "register",
  windowMs: 60 * MINUTE,
  limit: 5,
  message: "Too many accounts created from this network. Please try again later.",
});

// Extra layer on top of the per-code attempt limits
exports.otpLimiter = buildLimiter({
  name: "otp",
  windowMs: 15 * MINUTE,
  limit: 20,
  keyGenerator: byUserOrIp,
  message: "Too many code requests. Please try again in a few minutes.",
});

exports.releaseCodeLimiter = buildLimiter({
  name: "release-code",
  windowMs: 15 * MINUTE,
  limit: 20,
  keyGenerator: byUserOrIp,
  message: "Too many release code attempts. Please try again later.",
});

// Normal traffic: one heartbeat every 2-3 seconds per machine
exports.deviceLimiter = buildLimiter({
  name: "device",
  windowMs: MINUTE,
  limit: 300,
  message: "Too many device requests.",
});

// Counts only rejected requests, which stops anyone guessing device keys
exports.deviceAuthFailureLimiter = buildLimiter({
  name: "device-auth",
  windowMs: 15 * MINUTE,
  limit: 30,
  skipSuccessfulRequests: true,
  message: "Too many failed device requests.",
});