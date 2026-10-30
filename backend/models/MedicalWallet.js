const mongoose = require("mongoose");

const medicalWalletSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  documentName: {
    type: String,
    required: true,
  },
  documentType: {
    type: String,
    default: "Prescription 💊",
  },
  fileName: String,
  fileData: String, // Base64 data URL for instant viewing & downloading
  fileSize: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MedicalWallet", medicalWalletSchema);
