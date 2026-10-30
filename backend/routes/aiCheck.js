const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/ai-check", async (req, res) => {
  try {
    const { symptoms } = req.body;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "system",
            content:
              "You are a medical assistant. Suggest possible illness and OTC medicines only. Always advise doctor consultation.",
          },
          {
            role: "user",
            content: `Symptoms: ${symptoms}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      text: response.data.choices[0].message.content,
    });
  } catch (err) {
    console.error("AI ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "AI service failed" });
  }
});

module.exports = router;
