const bcrypt = require("bcryptjs");
const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Check required fields
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and password are required",
      });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number is already registered",
      });
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await User.findOne({ email });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
};