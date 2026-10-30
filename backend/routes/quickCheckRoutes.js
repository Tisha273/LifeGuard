const express = require("express");
const router = express.Router();
const QuickCheck = require("../models/QuickCheck");
const auth = require("../middleware/auth");

const { spawn } = require("child_process");
const path = require("path");

router.use(auth);

/* ===== CREATE ===== */
router.post("/", async (req, res) => {
  try {
    const userId = (req.user && req.user._id) || req.headers["x-user-id"] || req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: "User ID missing" });
    }

    const symptoms = Array.isArray(req.body.symptoms)
      ? req.body.symptoms
      : [req.body.symptoms || ""];

    const check = new QuickCheck({
      userId,
      symptoms,
      result: req.body.result,
    });

    const saved = await check.save();
    res.json(saved);
  } catch (err) {
    console.error("QUICKCHECK ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ===== GET CURRENT USER ===== */
router.get("/", async (req, res) => {
  try {
    const uid = (req.user && req.user._id) || req.headers["x-user-id"];
    const checks = await QuickCheck.find({
      $or: [{ userId: uid }, { owner: uid }],
    }).sort({ createdAt: -1 });

    res.json(checks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===== DELETE CURRENT USER ===== */
router.delete("/", async (req, res) => {
  try {
    const uid = (req.user && req.user._id) || req.headers["x-user-id"];
    await QuickCheck.deleteMany({
      $or: [{ userId: uid }, { owner: uid }],
    });

    res.json({ message: "Cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ================= HEART DISEASE PREDICTION ================= */

router.post("/heart-predict", async (req, res) => {
  try {
    const {
      age,
      sex,
      cp,
      trestbps,
      chol,
      fbs,
      restecg,
      thalach,
      exang,
      oldpeak,
      slope,
      ca,
      thal
    } = req.body;

    const inputData = {
      age: Number(age),
      sex: Number(sex),
      cp: Number(cp),
      trestbps: Number(trestbps),
      chol: Number(chol),
      fbs: Number(fbs),
      restecg: Number(restecg),
      thalach: Number(thalach),
      exang: Number(exang),
      oldpeak: Number(oldpeak),
      slope: Number(slope),
      ca: Number(ca),
      thal: Number(thal)
    };

    const pythonScript = path.join(
      __dirname,
      "..",
      "ml",
      "predict.py"
    );

    const python = spawn("python", [
      pythonScript,
      JSON.stringify(inputData)
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", (code) => {

      if (code !== 0) {
        console.error("Python Error:", errorOutput);

        return res.status(500).json({
          message: "Heart prediction failed",
          error: errorOutput
        });
      }

      try {
        const result = JSON.parse(output);

        res.json(result);

      } catch (error) {

        console.error("Prediction parsing error:", output);

        res.status(500).json({
          message: "Invalid prediction response"
        });
      }
    });

  } catch (error) {

    console.error("HEART PREDICTION ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
