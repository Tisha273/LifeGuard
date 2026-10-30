import React, { useState, useEffect, useContext, useRef } from "react";
import "./QuickCheck.css";
import api from "../api";
import { LangContext } from "../App";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function QuickCheck() {
  const { lang } = useContext(LangContext);
  const navigate = useNavigate();

  // States
  const [symptoms, setSymptoms] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Recognition ref
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");

  // Bilingual UI Dictionary
  const t = {
    en: {
      badge: "Quick Check • Clinical Voice Assessment",
      title: "🎙️ Quick Check — Clinical Assessment",
      subtitle:
        "Speak or describe your symptoms naturally in Hindi or English. Our hospital-grade triage protocol rapidly evaluates urgency, guides immediate first-aid, and connects you to appropriate care.",
      micReady: "Press Microphone & Speak Your Symptoms",
      micListening: "Listening... Speak naturally in English or Hindi",
      micSubtext: "Click mic to stop recording, or edit your text below anytime.",
      micNotSupported: "Speech recognition is not supported in this browser. Please type below.",
      placeholder:
        "e.g., 'I have sharp chest pain and shortness of breath since 2 hours' or speak into the microphone above...",
      quickChipsLabel: "⚡ Quick Demo Presets (Instant Hackathon Test)",
      chipEmergency: "🔴 Severe chest pain & breathlessness",
      chipClinic: "🟡 High fever & vomiting for 3 days",
      chipHome: "🟢 Mild cold & sore throat",
      chipGI: "🟡 Acute stomach pain & acidity",
      btnAnalyze: "Assess My Symptoms",
      btnAnalyzing: "Assessing Symptoms...",
      btnClear: "Clear",
      actionStepsTitle: "⚡ Recommended First-Aid & Immediate Protocol",
      redFlagsTitle: "⚠️ Critical Warning Signs to Watch",
      callEmergencyTitle: "🚨 Urgent Medical Emergency Detected",
      callEmergencySub: "Do not wait. Immediate hospital emergency or ambulance required.",
      callEmergencyBtn: "📞 Call Ambulance (108 / 911)",
      saveBtn: "💾 Save to Medical Wallet & Records",
      savedBtn: "✓ Saved to Database",
      voiceNurseTag: "LifeGuard Voice Nurse Guidance",
      voiceNursePlaying: "Speaking clinical recommendations...",
      voiceNursePaused: "Voice guidance paused",
      btnHearAgain: "🔊 Speak Advice",
      btnStopAudio: "⏹️ Stop Voice",
      historyTitle: "History",
      historyEmpty: "No prior records found. Perform a check above to save records.",
      toastSaved: "Assessment saved to your Medical Wallet & MongoDB Atlas!",
    },
    hi: {
      badge: "Quick Check • त्वरित वॉइस जांच • क्लीनिकल मूल्यांकन",
      title: "🎙️ Quick Check — क्लीनिकल असेसमेंट",
      subtitle:
        "अपनी भाषा (हिन्दी या अंग्रेज़ी) में माइक दबाकर अपने लक्षण बताएं। हमारी हॉस्पिटल-ग्रेड ट्रायज प्रणाली तुरंत गंभीरता की जांच करेगी, प्राथमिक उपचार बताएगी और सही चिकित्सा सलाह देगी।",
      micReady: "माइक बटन दबाएं और अपने लक्षण बोलें",
      micListening: "सुन रहे हैं... कृपया स्पष्ट आवाज में अपने लक्षण बोलें",
      micSubtext: "बोलना समाप्त होने पर दोबारा माइक दबाएं या नीचे टाइप करें।",
      micNotSupported: "आपके ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है, कृपया लिखकर बताएं।",
      placeholder:
        "उदा. 'मुझे दो दिन से सीने में तेज दर्द और सांस फूलने की समस्या हो रही है' या ऊपर माइक से बोलकर बताएं...",
      quickChipsLabel: "⚡ त्वरित डेमो प्रीसेट्स (हैकाथॉन लाइव टेस्ट)",
      chipEmergency: "🔴 सीने में तेज दर्द और सांस फूलना",
      chipClinic: "🟡 3 दिन से तेज बुखार और उल्टी",
      chipHome: "🟢 हल्की सर्दी और गले में खराश",
      chipGI: "🟡 पेट में तेज दर्द और मरोड़",
      btnAnalyze: "लक्षणों का मूल्यांकन करें",
      btnAnalyzing: "लक्षणों की जांच हो रही है...",
      btnClear: "साफ करें",
      actionStepsTitle: "⚡ तुरंत उठाए जाने वाले प्राथमिक कदम (First Aid)",
      redFlagsTitle: "⚠️ गंभीर खतरे के संकेत (Red Flags)",
      callEmergencyTitle: "🚨 तत्काल आपातकालीन स्थिति की पहचान",
      callEmergencySub: "कृपया समय न गंवाएं। तुरंत अस्पताल या एम्बुलेंस सहायता लें।",
      callEmergencyBtn: "📞 108 एम्बुलेंस को कॉल करें",
      saveBtn: "💾 मेडिकल वॉलेट और डेटाबेस में सुरक्षित करें",
      savedBtn: "✓ डेटाबेस में सुरक्षित",
      voiceNurseTag: "लाइफगार्ड वॉइस नर्स मार्गदर्शन",
      voiceNursePlaying: "एआई नर्स आपको बोलकर सलाह दे रही है...",
      voiceNursePaused: "वॉइस सलाह रोकी गई",
      btnHearAgain: "🔊 सलाह दोबारा सुनें",
      btnStopAudio: "⏹️ आवाज रोकें",
      historyTitle: "इतिहास (History)",
      historyEmpty: "अभी कोई पुराना रिकॉर्ड नहीं है। ऊपर लक्षण जांच कर सेव करें।",
      toastSaved: "रिपोर्ट आपके मेडिकल वॉलेट और मोंगोडीबी एटलस में सेव हो गई!",
    },
  };

  const text = t[lang] || t.en;

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang === "hi" ? "hi-IN" : "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const spokenText = (finalTranscript + interimTranscript).trim();
      const base = baseTextRef.current ? baseTextRef.current.trim() : "";

      if (base && spokenText) {
        setSymptoms(`${base} ${spokenText}`);
      } else if (spokenText) {
        setSymptoms(spokenText);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        if (recognitionRef.current) recognitionRef.current.abort();
      } catch (e) {}
    };
  }, [lang]);

  // Load Past History
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get("/triage/history");
      if (res.data && res.data.history) {
        setHistory(res.data.history);
      }
    } catch (err) {
      // Non-blocking history load
    }
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (!speechSupported) {
      Swal.fire({
        icon: "info",
        title: "Voice Input",
        text: text.micNotSupported,
      });
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      stopVoice();
      baseTextRef.current = symptoms || "";
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang === "hi" ? "hi-IN" : "en-US";
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    }
  };

  // Trigger Speech Output (Voice Nurse)
  const speakAdvice = (speechText) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Submit Symptoms for Triage Analysis
  const handleAnalyze = async (presetText = null) => {
    const inputToUse = presetText || symptoms;
    if (!inputToUse || inputToUse.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: lang === "hi" ? "लक्षण दर्ज करें" : "Symptoms Required",
        text:
          lang === "hi"
            ? "कृपया माइक से बोलकर या लिखकर अपने लक्षण बताएं।"
            : "Please speak or type your symptoms first.",
      });
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    }

    setLoading(true);
    setSaved(false);

    try {
      const res = await api.post("/triage/analyze", {
        symptoms: inputToUse,
        language: lang,
      });

      if (res.data && res.data.result) {
        const triageData = res.data.result;
        setTriageResult(triageData);

        // Speak advice automatically
        if (triageData.spokenAdvice) {
          speakAdvice(triageData.spokenAdvice);
        }
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Assessment Failed",
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Preset Click Handler
  const handlePreset = (presetText) => {
    setSymptoms(presetText);
    handleAnalyze(presetText);
  };

  // Save to Medical Wallet / DB
  const handleSaveToWallet = async () => {
    if (!triageResult) return;

    try {
      await api.post("/triage/save", {
        symptoms: symptoms || "Voice Triage Check",
        triageResult: triageResult,
      });

      setSaved(true);
      loadHistory();

      Swal.fire({
        icon: "success",
        title: lang === "hi" ? "सफलतापूर्वक सुरक्षित" : "Assessment Saved!",
        text: text.toastSaved,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.response?.data?.message || "Could not save triage record.",
      });
    }
  };

  return (
    <div className="triage-container">
      {/* Header */}
      <div className="triage-header">
        <h1 className="triage-title">{text.title}</h1>
        <p className="triage-subtitle">{text.subtitle}</p>
      </div>

      {/* Main Interactive Stage */}
      <div className="triage-card">
        {/* Voice Microphone Stage */}
        <div className="voice-stage">
          <div className="mic-wrapper">
            <button
              onClick={toggleListening}
              className={`mic-btn ${isListening ? "active" : ""}`}
              title={isListening ? "Stop listening" : "Start speaking"}
            >
              {isListening ? "⏹" : "🎙️"}
            </button>
          </div>

          <div
            className={`soundwave-visualizer ${
              isListening || isSpeaking ? "animated" : ""
            }`}
          >
            <div className="soundwave-bar"></div>
            <div className="soundwave-bar"></div>
            <div className="soundwave-bar"></div>
            <div className="soundwave-bar"></div>
            <div className="soundwave-bar"></div>
            <div className="soundwave-bar"></div>
            <div className="soundwave-bar"></div>
          </div>

          <div className="voice-status-text">
            {isListening
              ? text.micListening
              : isSpeaking
              ? text.voiceNursePlaying
              : text.micReady}
          </div>
          <div className="voice-substatus">{text.micSubtext}</div>
        </div>

        {/* Symptoms Textarea */}
        <div className="symptom-input-box">
          <textarea
            className="symptom-textarea"
            rows="3"
            value={symptoms}
            onChange={(e) => {
              setSymptoms(e.target.value);
              baseTextRef.current = e.target.value;
            }}
            placeholder={text.placeholder}
          ></textarea>
        </div>

        {/* Action Button Bar */}
        <div className="action-button-bar">
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !symptoms.trim()}
            className="btn-analyze"
          >
            {loading ? (
              <>
                <span className="spinner-small">⏳</span> {text.btnAnalyzing}
              </>
            ) : (
              <>
                <span>🩺</span> {text.btnAnalyze}
              </>
            )}
          </button>

          {symptoms && (
            <button
              onClick={() => {
                setSymptoms("");
                setTriageResult(null);
                stopVoice();
              }}
              className="btn-clear"
            >
              ✕ {text.btnClear}
            </button>
          )}
        </div>
      </div>

      {/* Triage Assessment Results */}
      {triageResult && (
        <div
          className={`triage-result-card ${
            triageResult.level === "EMERGENCY"
              ? "level-emergency"
              : triageResult.level === "URGENT_CLINIC"
              ? "level-clinic"
              : "level-home"
          }`}
        >
          {/* Top Banner */}
          <div className="result-top-banner">
            <div>
              <div
                className={`urgency-badge ${
                  triageResult.level === "EMERGENCY"
                    ? "badge-emergency"
                    : triageResult.level === "URGENT_CLINIC"
                    ? "badge-clinic"
                    : "badge-home"
                }`}
              >
                {triageResult.badge}
              </div>
              <h2 className="result-title">{triageResult.title}</h2>
              {triageResult.primaryCondition && (
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0d9488", margin: "8px 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🩺</span>
                  <span>{lang === "hi" ? "संभावित चिकित्सीय कारण:" : "Suspected Clinical Condition:"} <strong>{triageResult.primaryCondition}</strong></span>
                </div>
              )}
              <p className="result-summary">{triageResult.summary}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div className="organ-system-tag">
                <span>{triageResult.systemIcon || "🩺"}</span>
                <span>{triageResult.system}</span>
              </div>
              <span className="gemini-source-tag">
                ✨ Google Gemini Clinical Intelligence
              </span>
            </div>
          </div>

          {/* Voice Nurse Readout Bar */}
          <div className="voice-player-bar">
            <div className="voice-player-info">
              <div className="nurse-avatar">👩‍⚕️</div>
              <div>
                <div className="voice-player-text">{text.voiceNurseTag}</div>
                <div className="voice-player-subtext">
                  {isSpeaking ? text.voiceNursePlaying : text.voiceNursePaused}
                </div>
              </div>
            </div>

            <div className="voice-controls">
              {isSpeaking ? (
                <button onClick={stopVoice} className="btn-speech stop">
                  {text.btnStopAudio}
                </button>
              ) : (
                <button
                  onClick={() => speakAdvice(triageResult.spokenAdvice)}
                  className="btn-speech play"
                >
                  {text.btnHearAgain}
                </button>
              )}
            </div>
          </div>

          {/* Emergency Direct Call Card (If ER level) */}
          {triageResult.level === "EMERGENCY" && (
            <div className="emergency-call-card">
              <div>
                <div className="emergency-call-title">
                  {text.callEmergencyTitle}
                </div>
                <div className="emergency-call-sub">
                  {text.callEmergencySub}
                </div>
              </div>
              <a href="tel:108" className="btn-call-emergency">
                {text.callEmergencyBtn}
              </a>
            </div>
          )}

          {/* Action Protocols & Red-Flags */}
          <div className="protocol-grid">
            {/* First Aid Protocol */}
            <div className="protocol-box">
              <div className="protocol-title">
                <span>🛡️</span> {text.actionStepsTitle}
              </div>
              <ul className="protocol-list">
                {triageResult.firstAid?.map((item, idx) => (
                  <li key={idx}>
                    <span className="check-bullet">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags / Warnings */}
            <div className="protocol-box">
              <div className="protocol-title">
                <span>⚠️</span> {text.redFlagsTitle}
              </div>
              <ul className="protocol-list">
                {triageResult.redFlags?.map((item, idx) => (
                  <li key={idx}>
                    <span className="warning-bullet">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Step: Connect Directly to AI Prescription & Lab Report Decoder */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)",
              borderRadius: "18px",
              border: "1.5px solid #99f6e4",
              padding: "20px 24px",
              margin: "20px 0",
              boxShadow: "0 4px 16px rgba(13, 148, 136, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 32 }}>📸</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ background: "#0d9488", color: "white", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                    ✨ LabRx Scan
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
                    {lang === "hi" ? "दवा का पर्चा या ब्लड टेस्ट समझें" : "Have a Prescription or Test Report?"}
                  </span>
                </div>
                <h4 style={{ margin: "2px 0 3px 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  {lang === "hi"
                    ? "डॉक्टर का पर्चा या ब्लड टेस्ट स्कैन करके तुरंत समझें"
                    : "Scan & Decode Your Prescription or Lab Report"}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  {lang === "hi"
                    ? "दवाओं के नाम, सही समय, और खतरनाक ड्रग टकराव को 1-क्लिक में जांचें।"
                    : "Decode handwriting, detect dangerous drug clashes, and auto-sync medication reminders."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/app/scanner")}
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                color: "white",
                border: "none",
                padding: "11px 22px",
                borderRadius: "12px",
                fontSize: "13.5px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
              }}
            >
              <span>📸</span>
              <span>{lang === "hi" ? "पर्चा स्कैन करें →" : "Scan Prescription →"}</span>
            </button>
          </div>

          {/* Result Footer: Save to Database */}
          <div className="result-footer-actions">
            <button
              onClick={handleSaveToWallet}
              disabled={saved}
              className={`btn-save-record ${saved ? "saved" : ""}`}
            >
              {saved ? text.savedBtn : text.saveBtn}
            </button>
          </div>
        </div>
      )}

      {/* Recent History Drawer */}
      {history.length > 0 && (
        <div className="triage-history-card">
          <div className="history-header">
            <h3 className="history-title">
              <span>📋</span> {text.historyTitle}
            </h3>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              {history.length} {lang === "hi" ? "रिकॉर्ड्स" : "records"}
            </span>
          </div>

          <div className="history-grid">
            {history.slice(0, 6).map((item, idx) => {
              let parsedResult = null;
              try {
                parsedResult =
                  typeof item.result === "string" && item.result.startsWith("{")
                    ? JSON.parse(item.result)
                    : null;
              } catch (e) {}

              return (
                <div key={item._id || idx} className="history-item">
                  <div className="history-item-top">
                    <span
                      className="history-badge"
                      style={{
                        background:
                          parsedResult?.level === "EMERGENCY"
                            ? "#fee2e2"
                            : parsedResult?.level === "URGENT_CLINIC"
                            ? "#fef3c7"
                            : "#dcfce7",
                        color:
                          parsedResult?.level === "EMERGENCY"
                            ? "#b91c1c"
                            : parsedResult?.level === "URGENT_CLINIC"
                            ? "#b45309"
                            : "#15803d",
                      }}
                    >
                      {parsedResult?.badge || "Assessment"}
                    </span>
                    <span className="history-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="history-symptoms">
                    {Array.isArray(item.symptoms)
                      ? item.symptoms.join(", ")
                      : item.symptoms}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
