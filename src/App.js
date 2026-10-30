import React, { useState, createContext, useEffect } from "react";
// import { Routes, Route, useNavigate, NavLink, useLocation } from "react-router-dom";
import { Routes, Route, useNavigate, NavLink, useLocation } from "react-router-dom";



// Pages
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import PrescriptionScanner from "./pages/PrescriptionScanner";
import QuickCheck from "./pages/QuickCheck";
import Community from "./pages/Community";
import Reminders from "./pages/Reminders";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import HealthTips from "./pages/HealthTips";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./utils/ProtectedRoute";
import api from "./api";
import "./pages/dark-theme.css";
import InstallPrompt, { triggerGlobalInstall } from "./components/InstallPrompt";

// Navbar
import Navbar from "./components/Navbar";

export const strings = {
  en: {
    dashboardTitle: "Health Analytics Dashboard",
    scannerTitle: "📸 LabRx Scan",
    triageTitle: "🎙️ Quick Check",
    communityTitle: "💬 Community Health Forum",
    remindersTitle: "⏰ Medication & Vitals Reminders",
    walletTitle: "📁 Secure Medical Wallet",
    settingsTitle: "⚙️ Settings & System Profile",
    sidebarDashboard: "Dashboard",
    sidebarScanner: "LabRx Scan",
    sidebarQuick: "Quick Check",
    sidebarCommunity: "Community",
    sidebarReminders: "Reminders",
    sidebarWallet: "Medical Wallet",
    sidebarSettings: "Settings",
    footer: "LifeGuard AI • Smart Preventive Health Companion • 24/7 Clinical Intelligence",
    logout: "Log Out",
    tagline: "AI Health Companion",
  },

  hi: {
    dashboardTitle: "स्वास्थ्य विश्लेषण डैशबोर्ड",
    scannerTitle: "📸 LabRx Scan",
    triageTitle: "🎙️ Quick Check",
    communityTitle: "💬 सामुदायिक स्वास्थ्य फोरम",
    remindersTitle: "⏰ दवा एवं टेस्ट रिमाइंडर",
    walletTitle: "📁 सुरक्षित मेडिकल वॉलेट",
    settingsTitle: "⚙️ सेटिंग्स एवं सिस्टम प्रोफ़ाइल",
    sidebarDashboard: "डैशबोर्ड",
    sidebarScanner: "LabRx Scan",
    sidebarQuick: "Quick Check",
    sidebarCommunity: "समुदाय फोरम",
    sidebarReminders: "दवा रिमाइंडर",
    sidebarWallet: "मेडिकल वॉलेट",
    sidebarSettings: "सेटिंग्स",
    footer: "लाइफगार्ड एआई • स्मार्ट प्रिवेंटिव हेल्थ साथी • 24/7 क्लीनिकल इंटेलिजेंस",
    logout: "लॉगआउट",
    tagline: "एआई स्वास्थ्य साथी",
  },
};

export const LangContext = createContext({ lang: "en", setLang: () => {} });

export default function App() {

  const [lang, setLang] = useState(localStorage.getItem("lg_lang") || "en");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("lg_lang", lang);
  }, [lang]);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem("lg_settings") || "{}");
    if (settings.darkMode === false) {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      if (settings.darkMode === undefined) {
        localStorage.setItem(
          "lg_settings",
          JSON.stringify({ ...settings, darkMode: true })
        );
      }
    }
  }, []);



  const handleLoginSuccess = () => navigate("/app");
  const switchToSignup = () => navigate("/auth/signup");
  const switchToLogin = () => navigate("/auth/login");

  const hideNavbar =
    location.pathname === "/" ||
    location.pathname.startsWith("/app") ||
    location.pathname.startsWith("/auth") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/auth/login"
          element={
            <Login
              onSuccess={handleLoginSuccess}
              switchToSignup={switchToSignup}
            />
          }
        />
        <Route
          path="/login"
          element={
            <Login
              onSuccess={handleLoginSuccess}
              switchToSignup={switchToSignup}
            />
          }
        />

        <Route
          path="/auth/signup"
          element={
            <Signup
              onSuccess={handleLoginSuccess}
              switchToLogin={switchToLogin}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <Signup
              onSuccess={handleLoginSuccess}
              switchToLogin={switchToLogin}
            />
          }
        />


        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </LangContext.Provider>
  );
}

/* ================= MAIN APP LAYOUT ================= */
function MainApp() {
  const { lang } = React.useContext(LangContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("lg_user");
    localStorage.removeItem("lg_token");
    localStorage.removeItem("lg_auth");
    window.location.href = "/";
  };

  // Dynamic Header Title
  const getHeaderTitle = () => {
    const p = location.pathname;
    if (p.startsWith("/app/scanner")) return strings[lang].scannerTitle;
    if (p.startsWith("/app/quick")) return strings[lang].triageTitle;
    if (p.startsWith("/app/community")) return strings[lang].communityTitle;
    if (p.startsWith("/app/reminders")) return strings[lang].remindersTitle;
    if (p.startsWith("/app/wallet")) return strings[lang].walletTitle;
    if (p.startsWith("/app/settings")) return strings[lang].settingsTitle;
    return strings[lang].dashboardTitle;
  };

  return (
    <div className="app">
      {/* ---------- Sidebar ---------- */}
      <aside className="sidebar">
        <div
          className="brand"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/app")}
        >
          <div className="logo">LG</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>LifeGuard</div>
            <div className="small" style={{ color: "#0d9488", fontWeight: 700 }}>{strings[lang].tagline}</div>
          </div>
        </div>

        <nav className="menu">
          <NavLink to="/app" end>
            <div className="icon">🏠</div> {strings[lang].sidebarDashboard}
          </NavLink>

          <NavLink to="/app/scanner">
            <div className="icon">📸</div> {strings[lang].sidebarScanner}
          </NavLink>

          <NavLink to="/app/quick">
            <div className="icon">🎙️</div> {strings[lang].sidebarQuick}
          </NavLink>

          <NavLink to="/app/community">
            <div className="icon">💬</div> {strings[lang].sidebarCommunity}
          </NavLink>

          <NavLink to="/app/reminders">
            <div className="icon">⏰</div> {strings[lang].sidebarReminders}
          </NavLink>

          <NavLink to="/app/wallet">
            <div className="icon">📁</div> {strings[lang].sidebarWallet}
          </NavLink>

          <NavLink to="/app/settings">
            <div className="icon">⚙</div> {strings[lang].sidebarSettings}
          </NavLink>
        </nav>

        {/* PWA App Install Button */}
        <button
          onClick={() => triggerGlobalInstall()}
          className="btn-sidebar-install"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "9px 14px",
            background: "linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(6, 182, 212, 0.15))",
            border: "1px solid rgba(45, 212, 191, 0.35)",
            borderRadius: 10,
            color: "#2dd4bf",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            margin: "8px 0 12px 0",
            transition: "all 0.2s ease",
          }}
          title={lang === "hi" ? "ऐप इंस्टॉल करें" : "Install App"}
        >
          <span style={{ fontSize: 16 }}>📲</span>
          <span>{lang === "hi" ? "ऐप इंस्टॉल करें" : "Install App"}</span>
        </button>

        {/* User Mini Profile Card in Sidebar */}
        <div className="sidebar-profile-card">
          <div className="sidebar-avatar">🛡️</div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">
              {JSON.parse(localStorage.getItem("lg_user") || "{}")?.name ||
                JSON.parse(localStorage.getItem("lg_user") || "{}")?.username ||
                (lang === "hi" ? "साथी" : "Member")}
            </div>
            <div className="sidebar-user-role">
              {lang === "hi" ? "स्वास्थ्य रक्षक" : "Health Guardian"}
            </div>
          </div>
        </div>

        {/* ✅ LOGOUT BUTTON AT BOTTOM */}
        <button
          onClick={handleLogout}
          className="btn-sidebar-logout"
        >
          <span>🚪</span> {strings[lang].logout}
        </button>
      </aside>

      {/* ---------- Main Content ---------- */}
      <main className="content">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏥</span>
            <div className="topbar-page-title">
              {getHeaderTitle()}
            </div>
          </div>
          <ShortSettings />
        </div>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scanner" element={<PrescriptionScanner />} />
          <Route path="/quick" element={<QuickCheck />} />
          <Route path="/community" element={<Community />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/healthtips" element={<HealthTips />} />
        </Routes>

        <div className="footer">
          <span>🛡️</span>
          <span>{strings[lang].footer}</span>
        </div>
      </main>

      {/* PWA Smart Install Banner & Modal */}
      <InstallPrompt lang={lang} />
    </div>
  );
}

/* ================= LANGUAGE & QUICK CONTROLS ================= */
function ShortSettings() {
  const { lang, setLang } = React.useContext(LangContext);
  const [isDark, setIsDark] = React.useState(
    document.documentElement.getAttribute("data-theme") === "dark" ||
      JSON.parse(localStorage.getItem("lg_settings") || "{}")?.darkMode !== false
  );

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("lg_lang", newLang);
    api.post("/settings/save", { language: newLang }).catch(() => {});
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    const current = JSON.parse(localStorage.getItem("lg_settings") || "{}");
    localStorage.setItem(
      "lg_settings",
      JSON.stringify({ ...current, darkMode: nextDark })
    );

    // Sync to user-specific local storage
    const user = JSON.parse(localStorage.getItem("lg_user") || "{}");
    const userKey = user?.email || user?._id || "guest";
    const userSettingsKey = `lg_settings_${userKey}`;
    const localUserSetting = JSON.parse(localStorage.getItem(userSettingsKey) || "{}");
    localStorage.setItem(userSettingsKey, JSON.stringify({ ...localUserSetting, darkMode: nextDark }));

    // Persist to database so navigating to Settings does not reset theme
    api.post("/settings/save", { darkMode: nextDark }).catch(() => {});
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Dark Mode Quick Toggle */}
      <button
        onClick={toggleTheme}
        title="Toggle Theme"
        style={{
          border: "1px solid #cbd5e1",
          background: isDark ? "#1e293b" : "#f8fafc",
          color: isDark ? "#f8fafc" : "#334155",
          padding: "7px 11px",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 700,
          transition: "all 0.2s ease",
        }}
      >
        <span>{isDark ? "☀️" : "🌙"}</span>
      </button>

      {/* Language Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <select
          value={lang}
          onChange={(e) => handleLangChange(e.target.value)}
          className="topbar-lang-select"
          style={{
            padding: "7px 12px",
            borderRadius: 10,
            border: isDark ? "1.5px solid rgba(45, 212, 191, 0.4)" : "1.5px solid #0d9488",
            fontWeight: 700,
            background: isDark ? "#0a1932" : "#f0fdfa",
            color: isDark ? "#2dd4bf" : "#0f766e",
            cursor: "pointer",
            fontSize: 13,
            outline: "none",
          }}
        >
          <option value="en">🌐 English (US)</option>
          <option value="hi">🌐 हिन्दी (Hindi)</option>
        </select>
      </div>
    </div>
  );
}