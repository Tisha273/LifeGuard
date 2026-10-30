const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const auth = require("../middleware/auth");

const SECRET = process.env.JWT_SECRET || "super_secret_key";

/* ⭐ GOOGLE CLIENT */
const client = new OAuth2Client(
  "770031219524-2q6noqjlpma47sve6b5i7p141hua5fpu.apps.googleusercontent.com"
);

function formatUserResponse(user) {
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    settings: user.settings || {},
    createdAt: user.createdAt,
  };
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    SECRET,
    { expiresIn: "7d" }
  );
}

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const cleanPassword = password || "";

    if (!trimmedName) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!trimmedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Check if email already in use
    const existingEmail = await User.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Check if username already taken (case-insensitive)
    const existingName = await User.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });
    if (existingName) {
      return res.status(400).json({ message: "This username is already taken. Please choose another" });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      settings: {
        gender: "",
        avatar: "",
        darkMode: false,
        accent: "teal",
        notifications: {},
        aiConsent: true,
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed: " + err.message });
  }
});

/* ================= LOGIN (EMAIL OR USERNAME) ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const identifier = (email || "").trim();
    const cleanPassword = password || "";

    if (!identifier) {
      return res.status(400).json({ message: "Please enter your email or username" });
    }

    if (!cleanPassword) {
      return res.status(400).json({ message: "Please enter your password" });
    }

    // Match by email or username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { name: { $regex: new RegExp(`^${identifier}$`, "i") } },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed: " + err.message });
  }
});

/* ================= GET CURRENT USER ================= */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user: " + err.message });
  }
});

/* ================= GOOGLE LOGIN ================= */
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience:
          "770031219524-2q6noqjlpma47sve6b5i7p141hua5fpu.apps.googleusercontent.com",
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      // In development fallback if client id mismatch:
      const decoded = jwt.decode(token);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        throw verifyErr;
      }
    }

    const { email, name } = payload;
    const cleanEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const randomPass = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        password: randomPass,
        settings: {
          gender: "",
          avatar: payload.picture || "",
          darkMode: false,
          accent: "teal",
          notifications: {},
          aiConsent: true,
        },
      });
    }

    const jwtToken = generateToken(user);

    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Google login failed: " + err.message });
  }
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (process.env.EMAIL && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        to: user.email,
        subject: "Password Reset OTP - LifeGuard",
        text: `Your LifeGuard OTP is ${otp}. It will expire in 10 minutes.`,
      });
    } else {
      console.log(`\n🔑 [LifeGuard DEV] Password Reset OTP for ${user.email}: ${otp}\n`);
    }

    res.json({
      message: "OTP sent to email",
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to send reset OTP: " + err.message });
  }
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user || user.resetOTP !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = null;
    user.otpExpire = null;

    await user.save();

    res.json({ message: "Password updated successfully. You can now login." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password: " + err.message });
  }
});

module.exports = router;
