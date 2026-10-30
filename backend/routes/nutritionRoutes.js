const express = require("express");
const router = express.Router();
const axios = require("axios");
const MedicalWallet = require("../models/MedicalWallet");
const auth = require("../middleware/auth");

/* ==========================================================================
   AI NUTRITION & PREVENTIVE DIET ENGINE (ICMR & WHO Clinical Guidelines)
   ========================================================================== */

// Clinical Indian Dietary Templates (Fallback if API is unavailable)
const DIET_TEMPLATES = {
  diabetes: {
    title: { en: "Low-Glycemic Insulin-Sensitizing Protocol", hi: "कम ग्लाइसेमिक इंसुलिन-सेंसिटाइजिंग आहार योजना" },
    focus: { en: "Complex carbs, high soluble fiber, low GI foods to prevent glucose spikes", hi: "जटिल कार्बोहाइड्रेट, उच्च फाइबर, शर्करा के उतार-चढ़ाव को रोकने वाला भोजन" },
    meals: {
      morning: { en: "1 glass lukewarm Fenugreek (Methi) seed water + 5 soaked almonds", hi: "1 गिलास गुनगुना मेथी दाना पानी + 5 भीगे हुए बादाम" },
      breakfast: { en: "Moong Dal Chilla with mint coriander chutney or Vegetable Besan Toast", hi: "मूंग दाल चीला हरी पुदीना चटनी के साथ या वेज बेसन टोस्ट" },
      lunch: { en: "2 Multigrain Rotis (Barley + Chana flour) + Palak Paneer or Dal Tadka + Cucumber Raita", hi: "2 मल्टीग्रेन रोटी (जौ + चना आटा) + पालक पनीर या दाल तड़का + खीरे का रायता" },
      snack: { en: "Roasted Makhana (Foxnuts) with green tea or Boiled Kala Chana Chaat", hi: "रोस्टेड मखाना और ग्रीन टी या उबला काला चना चाट" },
      dinner: { en: "Warm Bottle Gourd (Lauki) & Tomato soup + Vegetable Moong Khichdi with salad", hi: "गरम लौकी-टमाटर सूप + वेजीटेबल मूंग दाल खिचड़ी" },
    },
    superfoods: [
      { name: "Methi Seeds (मेथी)", benefit: "Slows digestion and carbohydrate absorption, reducing blood sugar spikes." },
      { name: "Cinnamon (दालचीनी)", benefit: "Acts like insulin to help move glucose into cells." },
      { name: "Amla (आंवला)", benefit: "Rich in Vitamin C, boosts pancreatic islet cell recovery." },
    ],
    avoid: [
      "Refined wheat flour (Maida), white bread, and sugary fruit juices",
      "Fried snacks (Samosa, Namkeen) and deep-fried sweets",
      "Potatoes, white polished rice in excess",
    ],
  },
  hypertension: {
    title: { en: "DASH Cardioprotective Low-Sodium Protocol", hi: "हार्ट-फ्रेंडली कम सोडियम DASH आहार योजना" },
    focus: { en: "High potassium, magnesium, and calcium with strictly controlled sodium (< 1500mg)", hi: "उच्च पोटेशियम, मैग्नीशियम और नियंत्रित नमक (< 1500mg)" },
    meals: {
      morning: { en: "1 glass tender coconut water or Warm Lemon Water with Chia seeds", hi: "1 गिलास नारियल पानी या चिया सीड्स युक्त गुनगुना नींबू पानी" },
      breakfast: { en: "Vegetable Rava Upma or Oats Porridge with walnuts and flaxseeds", hi: "सब्जियों वाला रवा उपमा या ओट्स दलिया अखरोट और अलसी के साथ" },
      lunch: { en: "Brown rice or 2 Wheat Phulkas + Sambar with drumsticks + Fresh beetroot salad", hi: "ब्राउन राइस या 2 गेहूं फुल्के + सहजन सांभर + चुकंदर सलाद" },
      snack: { en: "1 medium apple or guava with roasted unsalted pumpkin seeds", hi: "1 सेब या अमरूद + बिना नमक वाले भुने कद्दू के बीज" },
      dinner: { en: "Steamed vegetable bowl + Masoor dal + 1 Jowar Bhakri", hi: "उबली सब्जियों का कटोरा + मसूर दाल + 1 ज्वार भाकरी" },
    },
    superfoods: [
      { name: "Garlic (लहसुन)", benefit: "Allicin compounds promote nitric oxide synthesis, naturally relaxing blood vessels." },
      { name: "Beetroot (चुकंदर)", benefit: "High in dietary nitrates, scientifically proven to reduce systolic BP." },
      { name: "Flaxseeds (अलसी)", benefit: "Rich in Omega-3 Alpha-Linolenic Acid, protects arterial elasticity." },
    ],
    avoid: [
      "Table salt sprinkling, packaged pickles (Achaar), and papads",
      "Processed canned soups and sodium-heavy instant noodles",
      "Red meat, salted butter, and bakery trans fats",
    ],
  },
  weight_loss: {
    title: { en: "Metabolic Thermogenic High-Protein Protocol", hi: "मेटाबोलिक थर्मोजेनिक हाई-प्रोटीन डाइट" },
    focus: { en: "High satiety, calorie deficit with balanced lean proteins and clean greens", hi: "उच्च तृप्ति, संतुलित प्रोटीन और मेटाबॉलिज्म तेज करने वाला आहार" },
    meals: {
      morning: { en: "Warm water with 1 tbsp Apple Cider Vinegar or Jeera-Ginger water", hi: "गुनगुना पानी 1 चम्मच सेब के सिरके के साथ या जीरा-अदरक पानी" },
      breakfast: { en: "Paneer / Tofu Bhurji with 1 multigrain toast or Sprouts Poha", hi: "पनीर/टोफू भुर्जी 1 मल्टीग्रेन टोस्ट के साथ या स्प्राउट्स पोहा" },
      lunch: { en: "1 Jowar or Bajra Roti + Large mixed green salad + Rajma or Grilled Fish/Paneer", hi: "1 ज्वार/बाजरा रोटी + बड़ा मिक्स वेज सलाद + राजमा या पनीर" },
      snack: { en: "Cucumber carrot sticks with hummus or tender coconut kernel", hi: "खीरा-गाजर स्टिक्स या भुना चना" },
      dinner: { en: "Mixed vegetable clear soup + Sautéed tofu/paneer with bell peppers", hi: "मिक्स वेज क्लियर सूप + शिमला मिर्च के साथ सौते पनीर/टोफू" },
    },
    superfoods: [
      { name: "Green Tea (हरी चाय)", benefit: "EGCG catechins accelerate adipose lipid oxidation." },
      { name: "Chia Seeds (चिया सीड्स)", benefit: "Expands in the stomach to curb cravings and stabilize ghrelin hunger hormone." },
      { name: "Ginger (अदरक)", benefit: "Thermogenic herb that stimulates digestive fire and thermogenesis." },
    ],
    avoid: [
      "Carbonated soft drinks, sweetened coffees, and commercial fruit shakes",
      "Late-night carb-heavy dinners after 8:30 PM",
      "Refined palm and vegetable oils",
    ],
  },
};

/**
 * Call Gemini AI for custom dynamic diet planning
 */
async function callGeminiDietPlanner({ conditions, dietType, cuisine, calories, allergies, lang }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") return null;

  const prompt = `You are a World-Class Clinical Nutritionist & Preventive Dietitian specializing in Evidence-Based Indian & Global Medical Nutrition Therapy.

Create a highly detailed, personalized 1-Day Clinical Nutrition Plan tailored to the patient profile below:
- Health Conditions: ${conditions.join(", ") || "General Longevity & Metabolic Health"}
- Dietary Preference: ${dietType || "Vegetarian"}
- Preferred Regional Cuisine: ${cuisine || "North Indian"}
- Target Calories: ${calories || "1800 kcal"}
- Allergies / Restrictions: ${allergies || "None"}
- Output Language: ${lang === "hi" ? "Hindi (हिन्दी)" : "English"}

Respond strictly in valid JSON adhering to this exact schema (no markdown formatting, no code ticks):
{
  "title": "Clinical protocol title in requested language",
  "focus": "Core physiological focus of this diet",
  "macros": {
    "carbs": "45%",
    "protein": "25%",
    "healthyFats": "30%",
    "hydrationLiters": "3.0"
  },
  "meals": {
    "earlyMorning": {
      "time": "06:30 AM",
      "item": "Detailed therapeutic drink and snack",
      "clinicalReason": "Why this works for the condition"
    },
    "breakfast": {
      "time": "08:30 AM",
      "item": "Nutrient-dense breakfast meal",
      "clinicalReason": "Metabolic benefit"
    },
    "lunch": {
      "time": "01:00 PM",
      "item": "Balanced mid-day lunch with fiber, grain, and protein",
      "clinicalReason": "Glycemic and satiety control"
    },
    "eveningSnack": {
      "time": "05:00 PM",
      "item": "Healthy low-carb sustenance and herbal tea",
      "clinicalReason": "Prevents cortisol and late afternoon crashes"
    },
    "dinner": {
      "time": "07:45 PM",
      "item": "Light, restorative dinner for optimal circadian digestion",
      "clinicalReason": "Promotes deep sleep recovery and low nocturnal glucose"
    }
  },
  "therapeuticSuperfoods": [
    { "name": "Superfood 1", "benefit": "Clinical mechanism of action" },
    { "name": "Superfood 2", "benefit": "Clinical mechanism of action" },
    { "name": "Superfood 3", "benefit": "Clinical mechanism of action" }
  ],
  "foodsToAvoid": [
    "Harmful food 1 for this condition",
    "Harmful food 2 for this condition",
    "Harmful food 3 for this condition"
  ],
  "voiceSummary": "Empathetic, clear, 2-3 sentence clinical guidance spoken to the patient"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      },
      { timeout: 15000 }
    );

    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidate) {
      return JSON.parse(candidate);
    }
  } catch (err) {
    console.warn("⚠️ Gemini Diet Planner note:", err.response?.data?.error?.message || err.message);
  }
  return null;
}

/* ==========================================================================
   API ROUTES
   ========================================================================== */

/**
 * POST /api/nutrition/plan
 * Generates an evidence-based personalized clinical diet.
 */
router.post("/plan", async (req, res) => {
  try {
    const {
      conditions = [],
      dietType = "Vegetarian",
      cuisine = "North Indian",
      calories = "1800 kcal",
      allergies = "",
      language = "en",
    } = req.body;

    const lang = language === "hi" ? "hi" : "en";

    // 1. Try Gemini Generative AI first
    let plan = await callGeminiDietPlanner({
      conditions,
      dietType,
      cuisine,
      calories,
      allergies,
      lang,
    });

    // 2. Fallback to clinical templates if API is busy or unconfigured
    if (!plan) {
      const primaryKey = conditions[0] || "diabetes";
      const template = DIET_TEMPLATES[primaryKey] || DIET_TEMPLATES.diabetes;
      const isHi = lang === "hi";

      plan = {
        title: template.title[isHi ? "hi" : "en"],
        focus: template.focus[isHi ? "hi" : "en"],
        macros: { carbs: "48%", protein: "24%", healthyFats: "28%", hydrationLiters: "3.2" },
        meals: {
          earlyMorning: { time: "06:30 AM", item: template.meals.morning[isHi ? "hi" : "en"], clinicalReason: "Detoxification & enzyme activation" },
          breakfast: { time: "08:30 AM", item: template.meals.breakfast[isHi ? "hi" : "en"], clinicalReason: "Sustained morning vitality" },
          lunch: { time: "01:00 PM", item: template.meals.lunch[isHi ? "hi" : "en"], clinicalReason: "Balanced glycemic index" },
          eveningSnack: { time: "05:00 PM", item: template.meals.snack[isHi ? "hi" : "en"], clinicalReason: "Cortisol management" },
          dinner: { time: "07:45 PM", item: template.meals.dinner[isHi ? "hi" : "en"], clinicalReason: "Circadian rest and metabolic repair" },
        },
        therapeuticSuperfoods: template.superfoods,
        foodsToAvoid: template.avoid,
        voiceSummary: isHi
          ? `नमस्ते, हमने आपकी स्थिति के अनुसार यह व्यक्तिगत आहार योजना तैयार की है। समय पर भोजन करें और पर्याप्त पानी पिएं।`
          : `Hello, we have curated this specialized clinical nutrition plan tailored to your health profile. Prioritize timely meals and adequate hydration.`,
      };
    }

    res.json({
      success: true,
      plan,
      generatedAt: new Date().toISOString(),
      source: process.env.GEMINI_API_KEY ? "Google Gemini Medical AI" : "Clinical ICMR Nutrition Engine",
    });
  } catch (err) {
    console.error("NUTRITION PLAN ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/nutrition/save
 * Saves this personalized diet protocol into the patient's Medical Wallet.
 */
router.post("/save", auth, async (req, res) => {
  try {
    const userId = (req.user && req.user._id) || req.body.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { plan, conditions = [] } = req.body;

    const walletRecord = new MedicalWallet({
      userId,
      title: plan.title || "Personalized AI Nutrition Plan",
      category: "Diet & Nutrition",
      fileData: JSON.stringify(plan),
      fileName: `Nutrition_Plan_${new Date().toISOString().slice(0, 10)}.json`,
      fileType: "application/json",
      fileSize: "4 KB",
      tags: conditions,
      notes: plan.focus || "Personalized clinical nutrition protocol",
    });

    const saved = await walletRecord.save();
    res.json({ success: true, record: saved });
  } catch (err) {
    console.error("NUTRITION SAVE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
