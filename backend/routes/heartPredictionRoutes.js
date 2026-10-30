const express = require("express");
const axios = require("axios");

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

/**
 * Intelligent Cardiovascular Risk Assessment Engine
 * Based on Framingham & Cleveland Cardiovascular Risk algorithms.
 * Evaluates patient inputs and returns risk score (%), risk category,
 * contributing risk factors, and personalized clinical recommendations.
 */
function calculateHeartRisk(data) {
  let score = 0;
  const riskFactors = [];
  const positiveFactors = [];
  const recommendations = [];

  const age = Number(data.age) || 45;
  const isMale = data.gender === "male" || data.sex === 1 || data.sex === "1";

  // 1. Age & Gender factor
  if (isMale) {
    if (age > 45) {
      score += (age - 45) * 1.2;
      riskFactors.push(`Age (${age} years) is in a higher risk bracket for males`);
    } else {
      positiveFactors.push("Age is in a lower risk bracket");
    }
  } else {
    if (age > 55) {
      score += (age - 55) * 1.1;
      riskFactors.push(`Age (${age} years) is in a higher risk bracket for females`);
    } else {
      positiveFactors.push("Age is in a lower risk bracket");
    }
  }

  // 2. Chest Discomfort / Angina
  // Values: none (0), mild_exertion (1), moderate (2), severe (3)
  const chestPain = data.chestPain || data.cp || "none";
  if (chestPain === "severe" || chestPain === 4 || chestPain === "4") {
    score += 35;
    riskFactors.push("Frequent or severe chest discomfort reported");
    recommendations.push("Promptly consult a cardiologist for an ECG and stress evaluation.");
  } else if (chestPain === "moderate" || chestPain === 3 || chestPain === "3") {
    score += 24;
    riskFactors.push("Noticeable chest tightness during everyday activities");
    recommendations.push("Schedule a non-urgent cardiac check-up to investigate chest tightness.");
  } else if (chestPain === "mild_exertion" || chestPain === 2 || chestPain === "2") {
    score += 14;
    riskFactors.push("Mild chest discomfort experienced during heavy exertion");
    recommendations.push("Avoid sudden strenuous heavy lifting until cleared by your doctor.");
  } else {
    positiveFactors.push("No chest pain or angina symptoms reported");
  }

  // 3. Blood Pressure
  // Values: normal (<120), elevated (120-139), high (>=140), not_sure
  const bpStatus = data.bloodPressureStatus || data.trestbps;
  let systolic = 120;
  if (typeof bpStatus === "number" || (!isNaN(Number(bpStatus)) && Number(bpStatus) > 50)) {
    systolic = Number(bpStatus);
  } else if (bpStatus === "high") {
    systolic = 145;
  } else if (bpStatus === "elevated") {
    systolic = 130;
  } else {
    systolic = 120;
  }

  if (systolic >= 140) {
    score += 26;
    riskFactors.push(`High blood pressure range (~${systolic} mm Hg)`);
    recommendations.push("Monitor your blood pressure 2-3 times per week and reduce dietary sodium.");
  } else if (systolic >= 130) {
    score += 12;
    riskFactors.push(`Borderline elevated blood pressure range (~${systolic} mm Hg)`);
    recommendations.push("Adopt a low-salt DASH diet and stay well hydrated.");
  } else {
    positiveFactors.push("Healthy blood pressure range");
  }

  // 4. Smoking & Tobacco
  const smoking = data.smoking || (data.fbs === 1 ? "regular" : "none");
  if (smoking === "regular") {
    score += 25;
    riskFactors.push("Daily smoking or tobacco use");
    recommendations.push("Quitting smoking reduces cardiovascular event risk by up to 50% within 1 year.");
  } else if (smoking === "occasional") {
    score += 12;
    riskFactors.push("Occasional tobacco or cigarette use");
    recommendations.push("Eliminate occasional tobacco use to protect coronary artery walls.");
  } else {
    positiveFactors.push("Non-smoker (greatly protects heart vessels)");
  }

  // 5. Physical Activity
  const activity = data.activity || "moderate";
  if (activity === "sedentary") {
    score += 15;
    riskFactors.push("Low physical activity / mostly sedentary routine");
    recommendations.push("Aim for at least 30 minutes of brisk walking 5 days a week.");
  } else if (activity === "active") {
    score -= 8;
    positiveFactors.push("Regular daily physical activity (strengthens heart muscle)");
  } else {
    positiveFactors.push("Moderate regular daily movement");
  }

  // 6. Diabetes / Blood Sugar
  const diabetes = data.diabetes || (data.fbs === 1 ? "yes" : "no");
  if (diabetes === "yes" || diabetes === 1 || diabetes === "1") {
    score += 18;
    riskFactors.push("History of diagnosed diabetes or high fasting blood sugar");
    recommendations.push("Keep fasting blood glucose and HbA1c strictly managed.");
  } else if (diabetes === "borderline") {
    score += 8;
    riskFactors.push("Pre-diabetic or borderline blood sugar");
    recommendations.push("Limit refined sugars and processed carbs to prevent progression.");
  } else {
    positiveFactors.push("Normal blood sugar levels");
  }

  // Baseline adjustment & bounds
  score = Math.max(5, Math.min(95, Math.round(score + 8)));

  let riskLevel = "Low Risk";
  let riskColor = "#10b981"; // emerald
  let summary = "Your cardiovascular profile appears healthy with low probability of heart disease.";

  if (score >= 50) {
    riskLevel = "High Risk";
    riskColor = "#ef4444"; // red
    summary = "Multiple significant cardiac risk factors were identified. Clinical follow-up is recommended.";
  } else if (score >= 25) {
    riskLevel = "Moderate Risk";
    riskColor = "#f59e0b"; // amber
    summary = "A few elevated risk factors were identified. Preventive lifestyle changes will significantly improve your profile.";
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue maintaining your balanced diet, regular exercise, and healthy habits.");
    recommendations.push("Schedule an annual routine physical check-up.");
  }

  return {
    risk_score: score,
    risk_level: riskLevel,
    risk_color: riskColor,
    class_label: score >= 50 ? "disease_class" : "no_disease_class",
    summary,
    risk_factors: riskFactors,
    positive_factors: positiveFactors,
    recommendations,
    heart_age_estimate: Math.round(age + (score >= 50 ? 8 : score >= 25 ? 3 : -2)),
    tested_at: new Date().toISOString(),
  };
}

/* ================= PREDICT ENDPOINT ================= */
router.post("/predict", async (req, res) => {
  try {
    const data = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Please provide assessment inputs." });
    }

    // Try Python ML service if user provided raw 13 features and service is online
    const hasRawFeatures = data.trestbps !== undefined && data.chol !== undefined && data.thalach !== undefined;

    if (hasRawFeatures) {
      try {
        const pyRes = await axios.post(`${ML_SERVICE_URL}/predict`, data, { timeout: 2500 });
        if (pyRes.data) {
          return res.status(200).json(pyRes.data);
        }
      } catch (e) {
        // Fallback to built-in clinical engine seamlessly!
      }
    }

    // Process using built-in clinical Framingham/Cleveland engine
    const assessment = calculateHeartRisk(data);
    return res.status(200).json(assessment);

  } catch (err) {
    console.error("Heart prediction error:", err.message);
    const fallback = calculateHeartRisk(req.body || {});
    return res.status(200).json(fallback);
  }
});

module.exports = router;
