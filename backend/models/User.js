const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },

  resetOTP: String,
  otpExpire: Date,

  settings: {
    gender: { type: String, default: "" },
    avatar: { type: String, default: "" },
    darkMode: { type: Boolean, default: true },
    accent: { type: String, default: "teal" },
    notifications: { type: Object, default: {} },
    aiConsent: { type: Boolean, default: true },
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
