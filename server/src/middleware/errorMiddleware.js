exports.notFound = (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Broken or oversized request bodies (from express.json)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body too large" });
  }

  // Duplicate key (phone / email / machineId already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res
      .status(409)
      .json({ success: false, message: `${field} is already registered` });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: `Invalid ${err.path}` });
  }

  const status = err.statusCode || err.status || 500;
  if (status >= 500) console.error(err);

  // Unexpected errors never leak internals in production
  const hide = status === 500 && process.env.NODE_ENV === "production";

  res.status(status).json({
    success: false,
    message: hide ? "Server error" : err.message || "Server error",
  });
};