const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  gender: String,
  avatar: String,
  darkMode: {
    type: Boolean,
    default: true,
  },
  theme: String,
  accent: String,
  notifications: {
    medicine: { type: Boolean, default: true },
    tips: { type: Boolean, default: true },
    checkup: { type: Boolean, default: true },
  },
  language: {
    type: String,
    default: "en",
  },
  aiConsent: {
    type: Boolean,
    default: true,
  },
  privacyMode: Boolean,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserSettings", userSettingsSchema);
