const express = require("express");
const router = express.Router();
const UserSettings = require("../models/UserSettings");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.use(auth);

/* ================= SAVE SETTINGS ================= */
router.post(["/", "/save"], async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, gender, avatar, darkMode, language, notifications, aiConsent, accent } = req.body;

    const updateFields = { userId };
    if (name !== undefined) updateFields.name = name;
    if (gender !== undefined) updateFields.gender = gender;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (darkMode !== undefined) updateFields.darkMode = Boolean(darkMode);
    if (language !== undefined) updateFields.language = language;
    if (notifications !== undefined) updateFields.notifications = notifications;
    if (aiConsent !== undefined) updateFields.aiConsent = Boolean(aiConsent);
    if (accent !== undefined) updateFields.accent = accent;

    const settings = await UserSettings.findOneAndUpdate(
      { $or: [{ userId }, { _id: req.body._id }] },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    // Sync name to User model if updated
    if (name && name.trim()) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          name: name.trim(),
          "settings.gender": gender,
          "settings.avatar": avatar,
          "settings.darkMode": Boolean(darkMode),
          "settings.aiConsent": Boolean(aiConsent),
        },
      });
    }

    res.json({ message: "Settings saved successfully", settings });
  } catch (err) {
    console.error("Settings save error:", err);
    res.status(500).json({ message: "Failed to save settings: " + err.message });
  }
});

/* ================= GET SETTINGS ================= */
router.get("/", async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      // Find user info for defaults
      const user = await User.findById(userId);
      settings = {
        name: user?.name || "Member",
        gender: user?.settings?.gender || "Not specified",
        avatar: user?.settings?.avatar || "👤",
        darkMode: user?.settings?.darkMode !== false,
        language: "en",
        notifications: {
          medicine: true,
          tips: true,
          checkup: true,
        },
        aiConsent: true,
        accent: "teal",
      };
    }

    res.json(settings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    res.status(500).json({ message: "Failed to fetch settings: " + err.message });
  }
});

module.exports = router;
