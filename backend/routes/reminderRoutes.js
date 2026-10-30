const express = require("express");
const router = express.Router();
const Reminder = require("../models/Reminder");
const auth = require("../middleware/auth");

router.use(auth);

/* ================= CREATE ================= */
router.post("/", async (req, res) => {
  try {
    const reminder = new Reminder({
      owner: req.user._id,
      medicineName: req.body.medicineName,
      dosage: req.body.dosage,
      time: req.body.time,
      repeatDays: req.body.repeatDays,
    });

    const saved = await reminder.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Save failed", error: err.message });
  }
});


/* ================= GET USER REMINDERS ================= */
router.get("/:userId", async (req, res) => {
  try {
    const reminders = await Reminder.find({
      owner: req.params.userId, // ✅ FIX HERE
    });

    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ================= */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Reminder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= DELETE ================= */
/* ===== DELETE REMINDER ===== */
router.delete("/:id", async (req, res) => {
  try {
    console.log("DELETE ID:", req.params.id);
    console.log("USER:", req.headers["x-user-id"]);

    const deleted = await Reminder.findByIdAndDelete(req.params.id);

    console.log("DELETED:", deleted);

    if (!deleted) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
