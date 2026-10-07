const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      trim: true,
      match: [/^(\+92|0)3\d{9}$/, "Enter a valid Pakistani mobile number"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // lets many users have no email without clashing
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = function (plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

module.exports = mongoose.model("User", userSchema);