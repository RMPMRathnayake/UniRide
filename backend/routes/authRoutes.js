import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

console.log("UNIRIDE AUTH ROUTES LOADED");

// Demo settings
const DEMO_MODE = process.env.DEMO_MODE === "true";
const DEMO_OTP = "123456";

// Phone number validation
const normalizePhoneNumber = (phone) => {
  return String(phone || "").replace(/[\s()-]/g, "");
};

const isValidPhoneNumber = (phone) => {
  return /^\+?[0-9]{7,15}$/.test(phone);
};

// ========================================
// STUDENT REGISTRATION
// ========================================

router.post("/register/student", async (req, res) => {
  try {
    const {
      fullName,
      email,
      studentRegistrationNumber,
      phoneNumber,
      password,
      confirmPassword,
      securityQuestion,
      securityAnswer
    } = req.body;

    if (
      !fullName ||
      !email ||
      !studentRegistrationNumber ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !securityQuestion ||
      !securityAnswer?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStudentNumber = studentRegistrationNumber.trim();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const existingStudent = await User.findOne({
      studentRegistrationNumber: normalizedStudentNumber
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "Student registration number is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const securityAnswerHash = await bcrypt.hash(
      securityAnswer.trim().toLowerCase(),
      10
    );

    const newStudent = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      studentRegistrationNumber: normalizedStudentNumber,
      password: hashedPassword,
      role: "student",
      securityQuestion,
      securityAnswerHash
    });

    await newStudent.save();

    res.status(201).json({
      message: "Student registered successfully"
    });

  } catch (error) {
    console.error("Student Registration Error:", error);

    res.status(500).json({
      message: "Server error during student registration"
    });
  }
});

// ========================================
// RIDER REGISTRATION
// ========================================

router.post("/register/rider", async (req, res) => {
  try {
    const {
      fullName,
      email,
      vehicleNumber,
      phoneNumber,
      password,
      confirmPassword,
      securityQuestion,
      securityAnswer
    } = req.body;

    if (
      !fullName ||
      !email ||
      !vehicleNumber ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !securityQuestion ||
      !securityAnswer?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedVehicleNumber = vehicleNumber.trim().toUpperCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const existingRider = await User.findOne({
      vehicleNumber: normalizedVehicleNumber
    });

    if (existingRider) {
      return res.status(409).json({
        message: "Vehicle number is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const securityAnswerHash = await bcrypt.hash(
      securityAnswer.trim().toLowerCase(),
      10
    );

    const newRider = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      vehicleNumber: normalizedVehicleNumber,
      password: hashedPassword,
      role: "rider",
      securityQuestion,
      securityAnswerHash
    });

    await newRider.save();

    res.status(201).json({
      message: "Rider registered successfully"
    });

  } catch (error) {
    console.error("Rider Registration Error:", error);

    res.status(500).json({
      message: "Server error during rider registration"
    });
  }
});

// ========================================
// LOGIN
// ========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error during login"
    });
  }
});

// ========================================
// FORGOT PASSWORD - DEMO OTP REQUEST
// ========================================

router.post("/forgot-password", async (req, res) => {
  try {
    if (!DEMO_MODE) {
      return res.status(503).json({
        message: "Demo OTP mode is disabled"
      });
    }

    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email address is required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address"
      });
    }

    // No actual email is sent in demo mode.
    res.status(200).json({
      message: "Demo verification code prepared. No email was sent."
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);

    res.status(500).json({
      message: "Unable to start password recovery"
    });
  }
});

// ========================================
// VERIFY DEMO OTP
// ========================================

router.post("/verify-reset-code", async (req, res) => {
  try {
    if (!DEMO_MODE) {
      return res.status(503).json({
        message: "Demo OTP mode is disabled"
      });
    }

    const email = req.body.email?.trim().toLowerCase();
    const code = String(req.body.code || "").trim();

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or verification code"
      });
    }

    if (code !== DEMO_OTP) {
      return res.status(400).json({
        message: "Incorrect verification code"
      });
    }

    const resetToken = jwt.sign(
      {
        userId: user._id,
        purpose: "password-reset"
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      message: "Demo verification successful",
      resetToken
    });

  } catch (error) {
    console.error("OTP Verification Error:", error);

    res.status(500).json({
      message: "Verification failed"
    });
  }
});

// ========================================
// RESET PASSWORD
// ========================================

router.post("/reset-password", async (req, res) => {
  try {
    const {
      resetToken,
      newPassword,
      confirmPassword
    } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        message: "Invalid or expired reset session. Please try again."
      });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(401).json({
        message: "Invalid password reset token"
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password reset successfully. Please login."
    });

  } catch (error) {
    console.error("Reset Password Error:", error);

    res.status(500).json({
      message: "Password reset failed"
    });
  }
});

export default router;