const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const audit = require("../services/auditService");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
});

// POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, phone, email, password } = req.body;

  // Must be real strings (a JSON object here would otherwise reach the database layer)
  if (
    typeof name !== "string" ||
    typeof phone !== "string" ||
    typeof password !== "string" ||
    (email !== undefined && typeof email !== "string") ||
    !name.trim() ||
    !phone.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Name, phone and password are required",
    });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      success: false,
      message: "Password must be between 8 and 72 characters",
    });
  }

  // Role is never taken from the request: public signups are always customers.
  // Duplicate phone/email is handled by the global error handler (409).
  const user = await User.create({
    name,
    phone,
    email: email || undefined,
    passwordHash: await User.hashPassword(password),
  });

  audit.log({ user, action: "USER_REGISTERED" });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token: generateToken(user),
    user: sanitizeUser(user),
  });
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  const { phone, password } = req.body;

  // Strings only: an object like {"$gt": ""} must never reach the query
  if (
    typeof phone !== "string" ||
    typeof password !== "string" ||
    !phone ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Phone and password are required",
    });
  }

  const user = await User.findOne({ phone }).select("+passwordHash");

  // Same message for both failures so attackers can't tell which was wrong
  if (!user || !(await user.comparePassword(password))) {
    audit.log({
      user,
      action: "LOGIN_FAILED",
      result: "FAILURE",
      metadata: { phone: audit.maskPhone(phone) },
    });
    return res.status(401).json({
      success: false,
      message: "Invalid phone or password",
    });
  }

  audit.log({ user, action: "LOGIN_SUCCESS" });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: generateToken(user),
    user: sanitizeUser(user),
  });
};

// GET /api/auth/me
const getCurrentUser = async (req, res) => {
  // authMiddleware already loaded the user
  res.status(200).json({ success: true, user: sanitizeUser(req.user) });
};

module.exports = { registerUser, loginUser, getCurrentUser };