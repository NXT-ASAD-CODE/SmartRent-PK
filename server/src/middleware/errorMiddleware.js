exports.notFound = (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  // Duplicate key (email / phone / machineId already exists)
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

  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server error",
  });
};