import React, { useState, useContext } from "react";
import "./DietPlanner.css";
import api from "../api";
import { LangContext } from "../App";
import Swal from "sweetalert2";

export default function DietPlanner() {
  const { lang } = useContext(LangContext);

  // Health Conditions
  const conditionsList = [
    { id: "diabetes", en: "Type 2 Diabetes / Pre-diabetes", hi: "मधुमेह (डायबिटीज)", icon: "🩸" },
    { id: "hypertension", en: "Hypertension / High BP", hi: "उच्च रक्तचाप (High BP)", icon: "🫀" },
    { id: "weight_loss", en: "Weight Loss / Fat Burn", hi: "वजन नियंत्रण / फैट लॉस", icon: "⚖️" },
    { id: "cholesterol", en: "High Cholesterol & Lipids", hi: "हाई कोलेस्ट्रॉल", icon: "🧪" },
    { id: "fatty_liver", en: "Fatty Liver Disease", hi: "फैटी लिवर", icon: "🫁" },
    { id: "thyroid", en: "Thyroid (Hypo/Hyper)", hi: "थायराइड स्वास्थ्य", icon: "🦋" },
    { id: "uric_acid", en: "High Uric Acid / Gout", hi: "यूरिक एसिड / गाउट", icon: "🦴" },
    { id: "longevity", en: "Longevity & Gut Health", hi: "दीर्घायु एवं गट हेल्थ", icon: "✨" },
  ];

  // States
  const [selectedConditions, setSelectedConditions] = useState(["diabetes"]);
  const [dietType, setDietType] = useState("Vegetarian");
  const [cuisine, setCuisine] = useState("North Indian");
  const [calories, setCalories] = useState("1800 kcal");
  const [allergies, setAllergies] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Bilingual Text Dictionary
  const t = {
    en: {
      badge: "Clinical Preventive Nutrition • ICMR & WHO Guidelines",
      title: "🥗 AI Nutrition & Preventive Diet Planner",
      subtitle:
        "Curated medical nutrition therapy calibrated for your health conditions, regional Indian cuisine, and metabolic targets.",
      conditionsTitle: "1. Select Active Health Conditions or Goals",
      prefTitle: "2. Dietary & Cultural Preferences",
      dietTypeLabel: "Dietary Habit",
      cuisineLabel: "Regional Indian Cuisine",
      calorieLabel: "Daily Energy Target",
      allergiesLabel: "Allergies / Ingredient Restrictions (Optional)",
      allergiesPlaceholder: "e.g., lactose intolerant, gluten allergy, no peanuts",
      btnGenerate: "Generate Personalized Clinical Diet Protocol",
      btnGenerating: "Designing Medical Nutrition Plan...",
      macroCarbs: "Carbohydrates",
      macroProtein: "Protein",
      macroFats: "Healthy Fats",
      macroHydration: "Daily Hydration",
      timelineTitle: "⏰ Circadian Meal Timing & Nutrition Protocol",
      superfoodsTitle: "🌿 Therapeutic Superfoods & Healing Botanicals",
      avoidTitle: "🚫 High-Risk Foods to Strictly Avoid",
      btnSaveWallet: "💾 Save Diet to Medical Wallet",
      btnSaved: "✓ Saved to Medical Records",
      btnPlayVoice: "🔊 Hear Diet Guidance",
      btnStopVoice: "⏹️ Stop Voice",
      toastSaved: "Diet protocol saved to your Medical Wallet in MongoDB Atlas!",
    },
    hi: {
      badge: "क्लीनिकल प्रिवेंटिव पोषण • ICMR एवं WHO दिशानिर्देश",
      title: "🥗 एआई पोषण एवं प्रिवेंटिव आहार योजना",
      subtitle:
        "आपकी स्वास्थ्य स्थिति, क्षेत्रीय भारतीय भोजन और मेटाबोलिक जरूरतों के आधार पर वैज्ञानिक रूप से तैयार आहार योजना।",
      conditionsTitle: "1. अपनी वर्तमान स्वास्थ्य स्थिति या लक्ष्य चुनें",
      prefTitle: "2. भोजन प्रकार एवं क्षेत्रीय पसंद",
      dietTypeLabel: "भोजन का प्रकार",
      cuisineLabel: "क्षेत्रीय भारतीय व्यंजन",
      calorieLabel: "दैनिक कैलोरी लक्ष्य",
      allergiesLabel: "एलर्जी या विशेष परहेज (वैकल्पिक)",
      allergiesPlaceholder: "उदा. दूध से एलर्जी, ग्लूटेन एलर्जी, मूंगफली न खाएं",
      btnGenerate: "व्यक्तिगत क्लीनिकल आहार योजना तैयार करें",
      btnGenerating: "आहार योजना बनाई जा रही है...",
      macroCarbs: "कार्बोहाइड्रेट",
      macroProtein: "प्रोटीन",
      macroFats: "स्वस्थ फैट्स",
      macroHydration: "दैनिक पानी",
      timelineTitle: "⏰ दैनिक भोजन समय सारिणी (Circadian Meals)",
      superfoodsTitle: "🌿 चिकित्सीय सुपरफूड्स एवं घरेलू औषधियां",
      avoidTitle: "🚫 परहेज योग्य खाद्य पदार्थ (हानिकारक)",
      btnSaveWallet: "💾 मेडिकल वॉलेट में सुरक्षित करें",
      btnSaved: "✓ मेडिकल वॉलेट में सुरक्षित",
      btnPlayVoice: "🔊 आहार सलाह सुनें",
      btnStopVoice: "⏹️ आवाज रोकें",
      toastSaved: "आहार योजना आपके मेडिकल वॉलेट और डेटाबेस में सुरक्षित हो गई!",
    },
  };

  const text = t[lang] || t.en;

  // Toggle Condition
  const toggleCondition = (id) => {
    setSelectedConditions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Generate Diet Plan
  const handleGeneratePlan = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const res = await api.post("/nutrition/plan", {
        conditions: selectedConditions,
        dietType,
        cuisine,
        calories,
        allergies,
        language: lang,
      });

      if (res.data && res.data.plan) {
        setPlan(res.data.plan);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Generation Failed",
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Play Spoken Guidance
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window) || !plan?.voiceSummary) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(plan.voiceSummary);
      utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Save to Medical Wallet
  const handleSaveToWallet = async () => {
    if (!plan) return;

    try {
      await api.post("/nutrition/save", {
        plan,
        conditions: selectedConditions,
      });

      setSaved(true);

      Swal.fire({
        icon: "success",
        title: lang === "hi" ? "सफलतापूर्वक सुरक्षित" : "Saved to Wallet!",
        text: text.toastSaved,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.response?.data?.message || "Could not save to wallet.",
      });
    }
  };

  return (
    <div className="diet-container">
      {/* Header */}
      <div className="diet-header">
        <div className="diet-badge">
          <span>🌿</span> {text.badge}
        </div>
        <h1 className="diet-title">{text.title}</h1>
        <p className="diet-subtitle">{text.subtitle}</p>
      </div>

      {/* Input Configuration Card */}
      <div className="diet-card">
        {/* Condition Chips */}
        <div className="diet-section-title">
          <span>🩺</span> {text.conditionsTitle}
        </div>
        <div className="conditions-grid">
          {conditionsList.map((item) => {
            const isSelected = selectedConditions.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleCondition(item.id)}
                className={`condition-pill ${isSelected ? "selected" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{lang === "hi" ? item.hi : item.en}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Preferences Grid */}
        <div className="diet-section-title">
          <span>🍽️</span> {text.prefTitle}
        </div>
        <div className="diet-pref-grid">
          {/* Diet Type */}
          <div className="pref-box">
            <label className="pref-label">{text.dietTypeLabel}</label>
            <select
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              className="pref-select"
            >
              <option value="Vegetarian">🟢 Vegetarian (शाकाहारी)</option>
              <option value="Eggetarian">🟡 Eggetarian (अंडा युक्त)</option>
              <option value="Non-Vegetarian">🔴 Non-Vegetarian (मांसाहारी)</option>
              <option value="Vegan">🌱 Vegan (वीगन)</option>
              <option value="Jain">🌾 Jain (जैन सात्विक)</option>
            </select>
          </div>

          {/* Regional Cuisine */}
          <div className="pref-box">
            <label className="pref-label">{text.cuisineLabel}</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="pref-select"
            >
              <option value="North Indian">North Indian (उत्तर भारतीय - Roti/Dal)</option>
              <option value="South Indian">South Indian (दक्षिण भारतीय - Idli/Sambar)</option>
              <option value="West Indian">West Indian (गुजराती / महाराष्ट्रीयन)</option>
              <option value="East Indian">East Indian (पूर्वी भारतीय / बंगाली)</option>
              <option value="Balanced Global">Balanced Global / Mediterranean</option>
            </select>
          </div>

          {/* Calorie Target */}
          <div className="pref-box">
            <label className="pref-label">{text.calorieLabel}</label>
            <select
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="pref-select"
            >
              <option value="1500 kcal">1500 kcal (Fat Loss / Deficit)</option>
              <option value="1800 kcal">1800 kcal (Balanced Maintenance)</option>
              <option value="2000 kcal">2000 kcal (Active Vitality)</option>
              <option value="2200 kcal">2200 kcal (Strength & Athletic)</option>
            </select>
          </div>
        </div>

        {/* Optional Allergies */}
        <div className="pref-box" style={{ marginBottom: 24 }}>
          <label className="pref-label">{text.allergiesLabel}</label>
          <input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder={text.allergiesPlaceholder}
            className="pref-select"
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGeneratePlan}
          disabled={loading || selectedConditions.length === 0}
          className="btn-generate-diet"
        >
          {loading ? (
            <>
              <span>⏳</span> {text.btnGenerating}
            </>
          ) : (
            <>
              <span>🥗</span> {text.btnGenerate}
            </>
          )}
        </button>
      </div>

      {/* Generated Diet Protocol Results */}
      {plan && (
        <div className="plan-result-card">
          {/* Hero Protocol Card */}
          <div className="protocol-hero-card">
            <div className="protocol-badge">
              <span>✨</span> {plan.source || "Google Gemini Medical AI"}
            </div>
            <h2 className="protocol-title">{plan.title}</h2>
            <p className="protocol-focus">{plan.focus}</p>

            {/* Macros Bar */}
            <div className="macro-tiles-grid">
              <div className="macro-tile">
                <div className="macro-label">{text.macroCarbs}</div>
                <div className="macro-val">{plan.macros?.carbs || "45%"}</div>
              </div>
              <div className="macro-tile">
                <div className="macro-label">{text.macroProtein}</div>
                <div className="macro-val">{plan.macros?.protein || "25%"}</div>
              </div>
              <div className="macro-tile">
                <div className="macro-label">{text.macroFats}</div>
                <div className="macro-val">{plan.macros?.healthyFats || "30%"}</div>
              </div>
              <div className="macro-tile">
                <div className="macro-label">{text.macroHydration}</div>
                <div className="macro-val">{plan.macros?.hydrationLiters || "3.0"} L/day</div>
              </div>
            </div>
          </div>

          {/* Voice Guidance Readout Bar */}
          {plan.voiceSummary && (
            <div className="voice-guidance-bar">
              <div className="voice-guidance-text">
                <span>🔊</span> {plan.voiceSummary}
              </div>
              <button onClick={toggleSpeech} className="btn-play-diet-voice">
                {isSpeaking ? text.btnStopVoice : text.btnPlayVoice}
              </button>
            </div>
          )}

          {/* Circadian Meal Timeline */}
          <div className="timeline-card">
            <div className="diet-section-title">
              <span>⏰</span> {text.timelineTitle}
            </div>

            <div className="timeline-list">
              {/* Early Morning */}
              {plan.meals?.earlyMorning && (
                <div className="timeline-item">
                  <div className="timeline-time-badge">{plan.meals.earlyMorning.time || "06:30 AM"}</div>
                  <div>
                    <div className="timeline-meal-title">🌅 Early Morning Detox</div>
                    <div className="timeline-meal-desc">{plan.meals.earlyMorning.item}</div>
                    <div className="timeline-clinical-why">✓ {plan.meals.earlyMorning.clinicalReason}</div>
                  </div>
                </div>
              )}

              {/* Breakfast */}
              {plan.meals?.breakfast && (
                <div className="timeline-item">
                  <div className="timeline-time-badge">{plan.meals.breakfast.time || "08:30 AM"}</div>
                  <div>
                    <div className="timeline-meal-title">🥣 Power Breakfast</div>
                    <div className="timeline-meal-desc">{plan.meals.breakfast.item}</div>
                    <div className="timeline-clinical-why">✓ {plan.meals.breakfast.clinicalReason}</div>
                  </div>
                </div>
              )}

              {/* Lunch */}
              {plan.meals?.lunch && (
                <div className="timeline-item">
                  <div className="timeline-time-badge">{plan.meals.lunch.time || "01:00 PM"}</div>
                  <div>
                    <div className="timeline-meal-title">🥗 Midday Balanced Lunch</div>
                    <div className="timeline-meal-desc">{plan.meals.lunch.item}</div>
                    <div className="timeline-clinical-why">✓ {plan.meals.lunch.clinicalReason}</div>
                  </div>
                </div>
              )}

              {/* Evening Snack */}
              {plan.meals?.eveningSnack && (
                <div className="timeline-item">
                  <div className="timeline-time-badge">{plan.meals.eveningSnack.time || "05:00 PM"}</div>
                  <div>
                    <div className="timeline-meal-title">🍵 Evening Sustenance</div>
                    <div className="timeline-meal-desc">{plan.meals.eveningSnack.item}</div>
                    <div className="timeline-clinical-why">✓ {plan.meals.eveningSnack.clinicalReason}</div>
                  </div>
                </div>
              )}

              {/* Dinner */}
              {plan.meals?.dinner && (
                <div className="timeline-item">
                  <div className="timeline-time-badge">{plan.meals.dinner.time || "07:45 PM"}</div>
                  <div>
                    <div className="timeline-meal-title">🍲 Restorative Dinner</div>
                    <div className="timeline-meal-desc">{plan.meals.dinner.item}</div>
                    <div className="timeline-clinical-why">✓ {plan.meals.dinner.clinicalReason}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Superfoods and Avoid Lists */}
          <div className="diet-split-grid">
            {/* Superfoods */}
            <div className="superfoods-box">
              <div className="split-box-title">
                <span>🌿</span> {text.superfoodsTitle}
              </div>
              <ul className="superfoods-list">
                {plan.therapeuticSuperfoods?.map((s, idx) => (
                  <li key={idx} className="superfood-item">
                    <span className="superfood-name">{s.name}</span>
                    <span>{s.benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Foods to Avoid */}
            <div className="avoid-box">
              <div className="split-box-title">
                <span>🚫</span> {text.avoidTitle}
              </div>
              <ul className="avoid-list">
                {plan.foodsToAvoid?.map((item, idx) => (
                  <li key={idx} className="avoid-item">
                    <span className="avoid-bullet">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Save to Medical Wallet Card */}
          <div className="diet-footer-card">
            <button
              onClick={handleSaveToWallet}
              disabled={saved}
              className={`btn-save-wallet ${saved ? "saved" : ""}`}
            >
              {saved ? text.btnSaved : text.btnSaveWallet}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
