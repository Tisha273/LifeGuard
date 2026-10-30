import React, { useState, useContext, useEffect } from "react";
import { LangContext } from "../App";
import Swal from "sweetalert2";
import api from "../api";
import "./Settings.css";
import { triggerGlobalInstall, isAppInstalled } from "../components/InstallPrompt";

export default function Settings() {
  const { lang, setLang } = useContext(LangContext);

  const t = {
    en: {
      badge: "Personal Preferences",
      title: "Account & Health Settings",
      subtitle: "Customize your profile, display preferences, notifications, and privacy options.",
      profileTitle: "Profile & Identity",
      nameLabel: "Full Name / Display Name",
      genderLabel: "Biological Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      preferNot: "Prefer not to say",
      avatarLabel: "Choose Avatar Icon",
      displayTitle: "Display & Language",
      darkModeLabel: "Dark Mode Theme",
      darkModeDesc: "High contrast dark interface for nighttime eye comfort",
      langLabel: "Application Language",
      langDesc: "Switch language across dashboard, reminders, and assessments",
      notifTitle: "Notification & Audio Preferences",
      voiceRemindersLabel: "Medicine Voice Reminders & Ringtone",
      voiceRemindersDesc: "Audible alarm ringtone and text-to-speech medication reminders",
      dailyTipsLabel: "Daily Preventive Health Tips",
      dailyTipsDesc: "Receive personalized dietary and exercise recommendations",
      checkupAlertsLabel: "Routine Health Checkup Alerts",
      checkupAlertsDesc: "Reminders for annual cardiac risk checks and blood pressure screening",
      privacyTitle: "Privacy, AI & Data Control",
      aiLabel: "AI Health Risk Predictions",
      aiDesc: "Allow AI to analyze vital patterns and calculate cardiovascular risk",
      exportBtn: "📥 Download Health Data Backup (JSON)",
      resetBtn: "⚠️ Reset Local Cache",
      saveBtn: "Save All Settings to Database",
      savingBtn: "Saving Preferences...",
      savedSuccess: "Settings saved successfully to database!",
    },
    hi: {
      badge: "व्यक्तिगत प्राथमिकताएं",
      title: "खाता और स्वास्थ्य सेटिंग्स",
      subtitle: "अपनी प्रोफ़ाइल, डिस्प्ले, नोटिफिकेशन और प्राइवेसी विकल्पों को कस्टमाइज़ करें।",
      profileTitle: "प्रोफ़ाइल और पहचान",
      nameLabel: "पूरा नाम / डिस्प्ले नाम",
      genderLabel: "जैविक लिंग",
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
      preferNot: "बताना नहीं चाहते",
      avatarLabel: "अवतार आइकन चुनें",
      displayTitle: "डिस्प्ले और भाषा",
      darkModeLabel: "डार्क मोड थीम",
      darkModeDesc: "रात में आंखों के आराम के लिए आधुनिक डार्क इंटरफ़ेस",
      langLabel: "एप्लिकेशन भाषा",
      langDesc: "डैशबोर्ड, रिमाइंडर और स्वास्थ्य जांच की भाषा बदलें",
      notifTitle: "नोटिफिकेशन और ऑडियो प्राथमिकताएं",
      voiceRemindersLabel: "दवा वॉइस रिमाइंडर और रिंगटोन",
      voiceRemindersDesc: "आवाज में सूचना और सुरीली अलार्म रिंगटोन",
      dailyTipsLabel: "दैनिक स्वास्थ्य सलाह",
      dailyTipsDesc: "दैनिक आहार और व्यायाम के व्यक्तिगत सुझाव प्राप्त करें",
      checkupAlertsLabel: "नियमित स्वास्थ्य चेकअप अलर्ट",
      checkupAlertsDesc: "वार्षिक हृदय जोखिम और बीपी जांच के लिए रिमाइंडर",
      privacyTitle: "गोपनीयता, एआई और डेटा नियंत्रण",
      aiLabel: "एआई स्वास्थ्य जोखिम विश्लेषण",
      aiDesc: "एआई को वाइटल्स का विश्लेषण कर हृदय जोखिम स्कोर बताने की अनुमति दें",
      exportBtn: "📥 स्वास्थ्य डेटा बैकअप डाउनलोड करें (JSON)",
      resetBtn: "⚠️ लोकल कैश रीसेट करें",
      saveBtn: "सभी सेटिंग्स डेटाबेस में सुरक्षित करें",
      savingBtn: "सेटिंग्स सहेजी जा रही हैं...",
      savedSuccess: "सेटिंग्स डेटाबेस में सफलतापूर्वक सुरक्षित कर दी गईं!",
    },
  };

  const str = t[lang] || t.en;

  const savedUser = JSON.parse(localStorage.getItem("lg_user") || "{}");
  const userKey = savedUser?.email || "guest";
  const SETTINGS_KEY = `lg_settings_${userKey}`;

  // Form states
  const [name, setName] = useState(savedUser.name || "Member");
  const [gender, setGender] = useState("Not specified");
  const [avatar, setAvatar] = useState("👤");
  const [darkMode, setDarkMode] = useState(
    JSON.parse(localStorage.getItem("lg_settings") || "{}")?.darkMode !== false
  );
  const currentLang = localStorage.getItem("lg_lang") || lang || "en";
  const [appLanguage, setAppLanguage] = useState(currentLang);
  const [aiConsent, setAiConsent] = useState(true);
  const [notifications, setNotifications] = useState({
    medicine: true,
    tips: true,
    checkup: true,
  });
  const [saving, setSaving] = useState(false);

  const avatarsList = ["👤", "👨‍⚕️", "👩‍⚕️", "🏃", "🧘", "🩺", "🌿", "🍎"];

  // Keep appLanguage in sync if lang changes from topbar
  useEffect(() => {
    if (lang) {
      setAppLanguage(lang);
    }
  }, [lang]);

  /* ================= LOAD SETTINGS ON MOUNT ================= */
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Current active theme from document or local storage
    const localSetting = JSON.parse(localStorage.getItem("lg_settings") || "{}");
    const isCurrentlyDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      localSetting.darkMode !== false;

    try {
      const res = await api.get("/settings");
      if (res.data) {
        const s = res.data;
        if (s.name) setName(s.name);
        if (s.gender) setGender(s.gender);
        if (s.avatar) setAvatar(s.avatar);

        // Respect active dark mode preference and do not revert to light
        const resolvedDark = isCurrentlyDark ? true : (typeof s.darkMode === "boolean" ? s.darkMode : true);
        setDarkMode(resolvedDark);
        applyTheme(resolvedDark);

        // Sync backend if needed
        if (s.darkMode !== resolvedDark) {
          api.post("/settings/save", { darkMode: resolvedDark }).catch(() => {});
        }

        // Preserve the user's active language preference
        const activeLang = localStorage.getItem("lg_lang") || lang || s.language || "en";
        setAppLanguage(activeLang);
        setLang(activeLang);

        if (s.notifications) setNotifications(s.notifications);
        if (typeof s.aiConsent === "boolean") setAiConsent(s.aiConsent);
      }
    } catch (err) {
      // Fallback local
      const local = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      if (local.name) setName(local.name);
      if (local.gender) setGender(local.gender);
      if (local.avatar) setAvatar(local.avatar);

      const resolvedDark = isCurrentlyDark ? true : (typeof local.darkMode === "boolean" ? local.darkMode : true);
      setDarkMode(resolvedDark);
      applyTheme(resolvedDark);

      const activeLang = localStorage.getItem("lg_lang") || lang || "en";
      setAppLanguage(activeLang);
      setLang(activeLang);
    }
  };

  const applyTheme = (isDark) => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    const current = JSON.parse(localStorage.getItem("lg_settings") || "{}");
    localStorage.setItem("lg_settings", JSON.stringify({ ...current, darkMode: isDark }));
  };

  const handleDarkModeToggle = (e) => {
    const isDark = e.target.checked;
    setDarkMode(isDark);
    applyTheme(isDark);

    const current = JSON.parse(localStorage.getItem("lg_settings") || "{}");
    localStorage.setItem("lg_settings", JSON.stringify({ ...current, darkMode: isDark }));

    const localUserSetting = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...localUserSetting, darkMode: isDark }));

    api.post("/settings/save", { darkMode: isDark }).catch(() => {});
  };

  const handleLanguageChange = (newLang) => {
    setAppLanguage(newLang);
    setLang(newLang);
    localStorage.setItem("lg_lang", newLang);
    api.post("/settings/save", { language: newLang }).catch(() => {});
  };

  /* ================= SAVE SETTINGS ================= */
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: name.trim(),
      gender,
      avatar,
      darkMode,
      language: appLanguage,
      notifications,
      aiConsent,
    };

    try {
      await api.post("/settings/save", payload);

      // Update local storage
      const updatedUser = { ...savedUser, name: name.trim() };
      localStorage.setItem("lg_user", JSON.stringify(updatedUser));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));

      Swal.fire({
        title: "⚙️ Settings Saved!",
        text: "Your preferences have been synchronized with the database.",
        icon: "success",
        timer: 2000,
      });
    } catch (err) {
      console.error("Settings save error:", err);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      Swal.fire("Settings Applied", "Saved to local profile.", "info");
    } finally {
      setSaving(false);
    }
  };

  /* ================= EXPORT HEALTH BACKUP ================= */
  const handleExportData = () => {
    const data = {
      profile: { name, gender, avatar },
      settings: { darkMode, language: appLanguage, notifications, aiConsent },
      reminders: JSON.parse(localStorage.getItem(`smart_reminders_${userKey}`) || "[]"),
      wallet: JSON.parse(localStorage.getItem(`lg_medical_records_${userKey}`) || "[]"),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeguard_health_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= CLEAR DATA ================= */
  const handleClearAll = () => {
    Swal.fire({
      title: "Reset All Local Data?",
      text: "This will clear local caches and log you out. Database records remain intact.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, reset",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.clear();
        applyTheme(false);
        window.location.href = "/";
      }
    });
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title">{str.title}</h1>
        <p className="settings-subtitle">{str.subtitle}</p>
      </div>

      <form onSubmit={handleSaveSettings}>
        {/* Card 1: Profile & Identity */}
        <div className="settings-card">
          <h2 className="settings-section-title">
            <span>👤</span>
            <span>{str.profileTitle}</span>
          </h2>

          <div className="settings-grid">
            <div className="settings-field">
              <label>{str.nameLabel}</label>
              <input
                type="text"
                className="settings-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="settings-field">
              <label>{str.genderLabel}</label>
              <select
                className="settings-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">{str.male}</option>
                <option value="Female">{str.female}</option>
                <option value="Other">{str.other}</option>
                <option value="Not specified">{str.preferNot}</option>
              </select>
            </div>

            <div className="settings-field" style={{ gridColumn: "1 / -1" }}>
              <label>{str.avatarLabel}</label>
              <div className="avatar-selector">
                {avatarsList.map((item) => (
                  <div
                    key={item}
                    className={`avatar-option ${avatar === item ? "selected" : ""}`}
                    onClick={() => setAvatar(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Appearance & Language */}
        <div className="settings-card">
          <h2 className="settings-section-title">
            <span>🎨</span>
            <span>{str.displayTitle}</span>
          </h2>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{str.darkModeLabel}</span>
              <span className="settings-toggle-desc">{str.darkModeDesc}</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={darkMode} onChange={handleDarkModeToggle} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-toggle-row" style={{ marginTop: "12px" }}>
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{str.langLabel}</span>
              <span className="settings-toggle-desc">{str.langDesc}</span>
            </div>
            <select
              className="settings-select"
              style={{ width: "160px" }}
              value={appLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">English (US)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* Card 3: Notifications & Reminders */}
        <div className="settings-card">
          <h2 className="settings-section-title">
            <span>🔔</span>
            <span>{str.notifTitle}</span>
          </h2>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{str.voiceRemindersLabel}</span>
              <span className="settings-toggle-desc">{str.voiceRemindersDesc}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications.medicine}
                onChange={(e) =>
                  setNotifications({ ...notifications, medicine: e.target.checked })
                }
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{str.dailyTipsLabel}</span>
              <span className="settings-toggle-desc">{str.dailyTipsDesc}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications.tips}
                onChange={(e) =>
                  setNotifications({ ...notifications, tips: e.target.checked })
                }
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{str.checkupAlertsLabel}</span>
              <span className="settings-toggle-desc">{str.checkupAlertsDesc}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications.checkup}
                onChange={(e) =>
                  setNotifications({ ...notifications, checkup: e.target.checked })
                }
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Card: Mobile App & PWA Status */}
        <div className="settings-card">
          <h2 className="settings-section-title">
            <span>📲</span>
            <span>{lang === "hi" ? "मोबाइल ऐप व PWA इंस्टॉलेशन" : "Mobile App & PWA Installation"}</span>
          </h2>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, color: "#f1f7ff", fontSize: 14 }}>
                {lang === "hi" ? "ऐप स्थिति" : "Application Status"}
              </div>
              <div style={{ fontSize: 13, color: "#8da8ce", marginTop: 3, lineHeight: 1.4 }}>
                {isAppInstalled()
                  ? (lang === "hi" ? "✅ लाइफगार्ड आपके डिवाइस पर स्टैंडअलोन ऐप के रूप में सक्रिय है।" : "✅ LifeGuard is installed as a native standalone PWA on this device.")
                  : (lang === "hi" ? "ब्राउज़र में चल रहा है — सीधे होम स्क्रीन पर इंस्टॉल करें!" : "Running in browser — Click below to install directly to your device home screen.")}
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerGlobalInstall()}
              className="btn-scanner"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                border: "none",
                boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
              }}
            >
              <span>📲</span>
              <span>{isAppInstalled() ? (lang === "hi" ? "ऐप इंस्टॉल है" : "App Installed") : (lang === "hi" ? "होम स्क्रीन पर जोड़ें" : "Install App to Device")}</span>
            </button>
          </div>

          <div style={{ background: "#0a1932", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(180, 220, 255, 0.12)", fontSize: 12.5, color: "#cbdcf5", lineHeight: 1.4 }}>
            💡 <strong>{lang === "hi" ? "PWA लाभ:" : "PWA Benefits:"}</strong> {lang === "hi" ? "ऑफ़लाइन टूल्स, 1-टैप होम स्क्रीन एक्सेस, फुल-स्क्रीन अनुभव बिना किसी ब्राउज़र बार के, और बैकग्राउंड मेडिसिन अलार्म!" : "Offline clinical tools, 1-tap home screen access, fullscreen app interface with no browser URL bar, and background medication alerts!"}
          </div>
        </div>

        {/* Card 4: Privacy & Data Backup */}
        <div className="settings-card">
          <h2 className="settings-section-title">
            <span>🛡️</span>
            <span>{str.privacyTitle}</span>
          </h2>

          <div className="settings-toggle-row" style={{ marginBottom: "16px" }}>
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{str.aiLabel}</span>
              <span className="settings-toggle-desc">{str.aiDesc}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid #f8fafc" }}>
            <button
              type="button"
              className="settings-btn-secondary"
              onClick={handleExportData}
            >
              {str.exportBtn}
            </button>

            <button
              type="button"
              className="settings-btn-danger"
              onClick={handleClearAll}
            >
              {str.resetBtn}
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button type="submit" className="settings-save-btn" disabled={saving}>
          <span>💾</span>
          <span>{saving ? str.savingBtn : str.saveBtn}</span>
        </button>
      </form>
    </div>
  );
}
