const mongoose = require("mongoose");

const lifeguardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "busy"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lifeguard", lifeguardSchema);
