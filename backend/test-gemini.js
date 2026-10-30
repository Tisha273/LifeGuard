const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");

  const models = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest"
  ];

  for (const m of models) {
    try {
      console.log(`\nTesting ${m}...`);
      const start = Date.now();
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: "Hello, reply with 1 word." }] }]
        },
        { timeout: 12000 }
      );
      const elapsed = Date.now() - start;
      const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`✅ [${m}] SUCCESS (${elapsed}ms): "${reply}"`);
      break;
    } catch (err) {
      console.log(`❌ [${m}] FAILED:`, err.response?.data?.error?.message || err.message);
    }
  }
}

test();
