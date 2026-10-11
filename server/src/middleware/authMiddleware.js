const jwt = require("jsonwebtoken");
const User = require("../models/User");
const audit = require("../services/auditService");

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

exports.authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      audit.log({
        user: req.user,
        action: "AUTHORIZATION_DENIED",
        result: "FAILURE",
        metadata: { method: req.method, path: req.originalUrl },
      });
      return res
        .status(403)
        .json({ success: false, message: "Access denied for your role" });
    }
    next();
  };