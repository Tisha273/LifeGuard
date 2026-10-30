const express = require("express");
const router = express.Router();
const MedicalWallet = require("../models/MedicalWallet");
const auth = require("../middleware/auth");

router.use(auth);

/* ================= GET CURRENT USER RECORDS ================= */
router.get("/", async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const records = await MedicalWallet.find({
      $or: [{ owner: userId }, { userId: userId }],
    }).sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error("Medical wallet fetch error:", err);
    res.status(500).json({ message: "Failed to fetch medical records: " + err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const targetId = req.params.userId || req.user._id;
    const records = await MedicalWallet.find({
      $or: [{ owner: targetId }, { userId: targetId }],
    }).sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= CREATE NEW RECORD ================= */
router.post("/", async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { documentName, documentType, fileName, fileData, fileSize, notes } = req.body;

    if (!documentName || !documentName.trim()) {
      return res.status(400).json({ message: "Document name is required" });
    }

    const newRecord = new MedicalWallet({
      owner: userId,
      userId: userId,
      documentName: documentName.trim(),
      documentType: documentType || "Prescription 💊",
      fileName: fileName || "",
      fileData: fileData || "",
      fileSize: fileSize || "",
      notes: notes || "",
    });

    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Medical wallet create error:", err);
    res.status(500).json({ message: "Failed to save record: " + err.message });
  }
});

/* ================= DELETE RECORD ================= */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const deleted = await MedicalWallet.findOneAndDelete({
      _id: req.params.id,
      $or: [{ owner: userId }, { userId: userId }],
    });

    if (!deleted) {
      return res.status(404).json({ message: "Record not found or unauthorized" });
    }

    res.json({ message: "Record deleted successfully", id: req.params.id });
  } catch (err) {
    console.error("Medical wallet delete error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
