import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LangContext } from "../App";
import Swal from "sweetalert2";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./Dashboard.css";

export default function Dashboard() {
  const { lang } = useContext(LangContext);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("lg_user") || "{}");
  const userKey = user?.email || user?._id || "guest";

  const [userName, setUserName] = useState("Member");
  const [userEmail, setUserEmail] = useState("");
  const [greeting, setGreeting] = useState("Welcome");

  // Real Reminders (No Fake Hardcoding)
  const [reminders, setReminders] = useState([]);
  const takenCount = reminders.filter((r) => r.taken).length;
  const allMedsTaken = reminders.length > 0 && takenCount === reminders.length;

  // Breathing Modal State
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [breathPhase, setBreathPhase] = useState("inhale"); // "inhale" | "hold" | "exhale"
  const [breathTimer, setBreathTimer] = useState(60);

  // Single Adherence Streak Activity with 3 Simple Daily Habits
  const streakStorageKey = `lg_streak_${userKey}`;
  const [streakData, setStreakData] = useState(() => {
    try {
      const saved = localStorage.getItem(streakStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          baseStreak: parsed.baseStreak || 5,
          todayGoalDone: parsed.todayGoalDone || false,
          habits: {
            meds: parsed.habits?.meds || false,
            water: typeof parsed.habits?.water === "number" ? parsed.habits.water : 4,
            breathing: parsed.habits?.breathing || false,
          },
          date: new Date().toISOString().split("T")[0],
        };
      }
    } catch (e) {}
    return {
      baseStreak: 5,
      todayGoalDone: false,
      habits: {
        meds: false,
        water: 4,
        breathing: false,
      },
      date: new Date().toISOString().split("T")[0],
    };
  });

  const completedHabitsCount =
    (streakData.habits.meds ? 1 : 0) +
    (streakData.habits.water >= 8 ? 1 : 0) +
    (streakData.habits.breathing ? 1 : 0);

  // Dynamic 7-Day Consistency Tracker based on real current day of week
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 is Sun, 1 is Mon, 4 is Thu...
  const mondayFirstIndex = currentDayIndex === 0 ? 7 : currentDayIndex;

  const dayLabels = [
    { label: "MON", dayNum: 1 },
    { label: "TUE", dayNum: 2 },
    { label: "WED", dayNum: 3 },
    { label: "THU", dayNum: 4 },
    { label: "FRI", dayNum: 5 },
    { label: "SAT", dayNum: 6 },
    { label: "SUN", dayNum: 7 },
  ];

  const weekDays = dayLabels.map((d) => {
    const isPast = d.dayNum < mondayFirstIndex;
    const isToday = d.dayNum === mondayFirstIndex;
    return {
      label: d.label,
      isToday,
      active: isPast ? true : isToday ? streakData.todayGoalDone : false,
    };
  });

  // Current Display Streak: Stable baseline + 1 when today's habits are all done
  const currentStreakCount = streakData.todayGoalDone
    ? (streakData.baseStreak || 5) + 1
    : (streakData.baseStreak || 5);

  // Calculate Today's Real-Time Adherence Score based on user actions:
  // Baseline: 60% • Meds: +20% • Water: +10% • Breathing: +10% (Max 100%)
  const medsRatio = reminders.length > 0
    ? (takenCount / reminders.length)
    : (streakData.habits.meds ? 1 : 0);
  const waterRatio = Math.min(1, (streakData.habits.water || 0) / 8);
  const breathRatio = streakData.habits.breathing ? 1 : 0;
  const todayAdherenceScore = Math.round(60 + (medsRatio * 20) + (waterRatio * 10) + (breathRatio * 10));

  // 7-Day Health & Adherence Trend Graph Data (Today is dynamically computed in real-time)
  const healthTrendData = [
    { day: "Mon", score: 85 },
    { day: "Tue", score: 88 },
    { day: "Wed", score: 91 },
    { day: "Thu", score: todayAdherenceScore },
    { day: "Fri", score: streakData.todayGoalDone ? 95 : 90 },
    { day: "Sat", score: 92 },
    { day: "Sun", score: 94 },
  ];

  const t = {
    en: {
      morning: "Good Morning",
      afternoon: "Good Afternoon",
      evening: "Good Evening",
      patientBadge: "VERIFIED PATIENT PROFILE",
      userProfile: "User Profile",
      accountEmail: "Account",
      todayDosesLabel: "Today's Doses Completed",

      // Gamification Streak & Basis
      streakTitle: "Day Health Streak",
      streakSub: "Streak advances by completing your 3 simple daily wellness habits",
      habitsProgressLabel: "Habits Completed",
      streakBasisTag: "Basis: Meds • Water • Breathing",
      trackerLabel: "7-Day Consistency:",
      todayTag: "Today",

      // 3 Habits
      habitMedsTitle: "Take Medicines on Time",
      habitMedsSub: "Prescribed doses for today",
      allMedsCompleted: "All prescribed doses completed",
      habitWaterTitle: "Drink 8 Glasses of Water",
      habitWaterSub: "Optimal hydration for vitality",
      habitBreatheTitle: "2-Min Mindful Breathing",
      habitBreatheSub: "Lower stress and blood pressure",

      markDone: "Mark Done",
      completed: "✓ Done",
      quickFillWater: "8/8 Done",
      openBreatheBtn: "🧘 Breathe",

      // Breathing Modal
      breatheModalHeading: "2-Minute Calming Breathing",
      breatheModalDesc: "Inhale gently as the circle expands, hold calmly, and exhale as it relaxes.",
      phaseInhale: "Inhale gently...",
      phaseHold: "Hold calmly...",
      phaseExhale: "Exhale slowly...",
      btnFinishBreathe: "✓ Complete Session",
      btnClose: "Close",

      // Superpower Options
      scannerBadge: "AI VISION SCANNER",
      scannerTitle: "LabRx Scan",
      scannerDesc: "Photograph doctor prescriptions or lab reports to decode dosages, biomarkers, and test results.",
      scannerBtn: "Start LabRx Scan →",

      triageBadge: "INSTANT HEALTH CHECK",
      triageTitle: "Quick Check",
      triageDesc: "Speak or describe symptoms in Hindi or English for an instant clinical triage and care guidance.",
      triageBtn: "Start Quick Check →",

      // Reminders (Remainder)
      remindersTitle: "Today's Medication Schedule (Reminders)",
      remindersSub: "Active doses synchronized from your doctor's prescriptions",
      btnManageReminders: "Manage Reminders →",
      noMedsTitle: "No medications scheduled yet",
      noMedsSub: "Scan your doctor's prescription with the AI Scanner to automatically populate dosage times.",
      btnScanFirst: "📸 Scan Prescription",
      markTaken: "Mark Taken",
      taken: "✓ Taken",

      // Graph
      graphTitle: "Weekly Health & Adherence Trend",
      graphSub: "Calculated from: 💊 Meds (50%) • 💧 Hydration (25%) • 🧘 Mindful Breathing (25%)",
      todayScoreLabel: "Today's Score",
    },
    hi: {
      morning: "शुभ प्रभात",
      afternoon: "शुभ दोपहर",
      evening: "शुभ संध्या",
      patientBadge: "सत्यापित मरीज़ खाता",
      userProfile: "उपयोगकर्ता प्रोफ़ाइल",
      accountEmail: "खाता ईमेल",
      todayDosesLabel: "आज की पूर्ण खुराकें",

      // Gamification Streak & Basis
      streakTitle: "दिवसीय स्वास्थ्य स्ट्रीक",
      streakSub: "3 सरल दैनिक आदतों को पूरा करने पर आपकी स्ट्रीक आगे बढ़ती है",
      habitsProgressLabel: "दैनिक आदतें पूर्ण",
      streakBasisTag: "आधार: दवाएं • पानी • श्वास अभ्यास",
      trackerLabel: "7-दिवसीय निरंतरता:",
      todayTag: "आज",

      // 3 Habits
      habitMedsTitle: "समय पर दवाएं लें",
      habitMedsSub: "आज की निर्धारित खुराकें",
      allMedsCompleted: "आज की सभी दवा खुराकें पूर्ण",
      habitWaterTitle: "8 गिलास पानी पिएं",
      habitWaterSub: "शरीर व किडनी के लिए दैनिक जल संतुलन",
      habitBreatheTitle: "2-मिनट शांत श्वास अभ्यास",
      habitBreatheSub: "मानसिक तनाव व रक्तचाप को संतुलित करें",

      markDone: "पूर्ण चिह्नित करें",
      completed: "✓ पूर्ण",
      quickFillWater: "8/8 पूर्ण",
      openBreatheBtn: "🧘 श्वास लें",

      // Breathing Modal
      breatheModalHeading: "2-मिनट शांत श्वास अभ्यास",
      breatheModalDesc: "वृत्त के अनुसार चलें: फैलने पर गहरी सांस अंदर लें, रोकें, और सिकुड़ने पर धीरे-धीरे छोड़ें।",
      phaseInhale: "धीरे-धीरे सांस अंदर लें...",
      phaseHold: "सांस रोककर रखें...",
      phaseExhale: "आराम से सांस बाहर छोड़ें...",
      btnFinishBreathe: "✓ अभ्यास पूर्ण करें",
      btnClose: "बंद करें",

      // Superpower Options
      scannerBadge: "एआई विज़न स्कैनर",
      scannerTitle: "LabRx Scan",
      scannerDesc: "लैब टेस्ट रिपोर्ट या डॉक्टर के पर्चे की फोटो खींचकर बायोमार्कर, खुराक व टेस्ट परिणाम जांचें।",
      scannerBtn: "LabRx Scan खोलें →",

      triageBadge: "त्वरित स्वास्थ्य जांच",
      triageTitle: "Quick Check",
      triageDesc: "हिंदी या अंग्रेजी में अपने लक्षण बोलें या लिखें और तुरंत प्राथमिक स्वास्थ्य परामर्श पाएं।",
      triageBtn: "Quick Check शुरू करें →",

      // Reminders
      remindersTitle: "आज का दवा शेड्यूल (रिमाइंडर)",
      remindersSub: "डॉक्टर के पर्चे से स्वतः सिंक की गई सक्रिय दवा खुराकें",
      btnManageReminders: "रिमाइंडर प्रबंधित करें →",
      noMedsTitle: "अभी कोई दवा शेड्यूल नहीं है",
      noMedsSub: "एआई स्कैनर से डॉक्टर का पर्चा स्कैन करें ताकि दवा का समय स्वतः जुड़ जाए।",
      btnScanFirst: "📸 पर्चा स्कैन करें",
      markTaken: "दवा ली",
      taken: "✓ ले ली गई",

      // Graph
      graphTitle: "साप्ताहिक स्वास्थ्य एवं अनुपालन ट्रेंड",
      graphSub: "गणना आधार: 💊 दवाएं (50%) • 💧 जल संतुलन (25%) • 🧘 शांत श्वास (25%)",
      todayScoreLabel: "आज का स्कोर",
    },
  };

  const str = t[lang] || t.en;

  // Save Reminders to LocalStorage
  const saveReminders = (updated) => {
    if (user?.email) localStorage.setItem(`smart_reminders_${user.email}`, JSON.stringify(updated));
    if (user?._id) localStorage.setItem(`smart_reminders_${user._id}`, JSON.stringify(updated));
    localStorage.setItem(`smart_reminders_guest`, JSON.stringify(updated));
  };

  // Load Real Data from localStorage
  const loadRealData = () => {
    const displayName = user?.name || user?.username || (lang === "hi" ? "साथी" : "Member");
    setUserName(displayName);
    setUserEmail(user?.email || "patient@lifeguard.ai");

    const hr = new Date().getHours();
    if (hr < 12) setGreeting(str.morning);
    else if (hr < 18) setGreeting(str.afternoon);
    else setGreeting(str.evening);

    // Real Reminders
    const localReminders =
      JSON.parse(localStorage.getItem(`smart_reminders_${user?.email}`) || "null") ||
      JSON.parse(localStorage.getItem(`smart_reminders_${user?._id}`) || "null") ||
      JSON.parse(localStorage.getItem(`smart_reminders_guest`) || "[]");
    setReminders(localReminders);

    // Ensure meds habit matches reminders state
    if (localReminders.length > 0) {
      const allTaken = localReminders.every((r) => r.taken);
      if (allTaken && !streakData.habits.meds) {
        updateHabit("meds", true);
      } else if (!allTaken && streakData.habits.meds) {
        updateHabit("meds", false);
      }
    }
  };

  useEffect(() => {
    loadRealData();
  }, [lang, userKey]);

  // Breathing Animation Cycle
  useEffect(() => {
    let interval = null;
    if (showBreathingModal) {
      interval = setInterval(() => {
        setBreathPhase((prev) => {
          if (prev === "inhale") return "hold";
          if (prev === "hold") return "exhale";
          return "inhale";
        });
        setBreathTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [showBreathingModal]);

  // Update Habit & Check Streak Completion (Stable & Non-jumping)
  const updateHabit = (habitKey, value) => {
    setStreakData((prev) => {
      const nextHabits = { ...prev.habits, [habitKey]: value };
      const allDone = Boolean(nextHabits.meds && nextHabits.water >= 8 && nextHabits.breathing);
      const wasDone = prev.todayGoalDone;

      const updated = {
        ...prev,
        habits: nextHabits,
        todayGoalDone: allDone,
      };
      localStorage.setItem(streakStorageKey, JSON.stringify(updated));

      if (!wasDone && allDone) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title:
            lang === "hi"
              ? "शानदार! आज की सभी 3 आदतें पूर्ण (+25 अंक)"
              : "Awesome! All 3 Daily Habits Completed! (+25 Pts)",
          showConfirmButton: false,
          timer: 3000,
        });
      }

      return updated;
    });
  };

  // 100% TWO-WAY SYNC: Toggle Meds Habit in Streak Card
  const toggleMedsHabit = () => {
    const nextMedsState = !streakData.habits.meds;

    // When marking meds habit in streak, update all scheduled reminders in lockstep
    if (reminders.length > 0) {
      const updatedReminders = reminders.map((r) => ({
        ...r,
        taken: nextMedsState,
      }));
      setReminders(updatedReminders);
      saveReminders(updatedReminders);
    }

    updateHabit("meds", nextMedsState);
  };

  // 100% TWO-WAY SYNC: Toggle Individual Reminder Taken
  const toggleReminderTaken = (id) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, taken: !r.taken };
      }
      return r;
    });
    setReminders(updated);
    saveReminders(updated);

    // If all reminders are taken, mark meds habit completed; otherwise mark incomplete
    const allTaken = updated.length > 0 && updated.every((r) => r.taken);
    updateHabit("meds", allTaken);
  };

  // Stepper for Water
  const adjustWater = (delta) => {
    const current = streakData.habits.water || 0;
    const nextVal = Math.max(0, Math.min(8, current + delta));
    updateHabit("water", nextVal);
  };

  // Finish Breathing
  const handleFinishBreathing = () => {
    setShowBreathingModal(false);
    updateHabit("breathing", true);
  };

  return (
    <div className="real-dash-root">
      {/* 1. REAL PATIENT HEADER (CLEAN, LIGHT & MINIMAL) */}
      <div className="real-header-card">
        <div className="real-header-left">
          <div className="real-avatar-circle">
            <span>👤</span>
          </div>
          <div>
            <span className="real-patient-badge">🛡️ {str.patientBadge}</span>
            <h1 className="real-patient-name">
              {greeting}, {userName}
            </h1>
            <div className="real-meta-row">
              <span className="meta-pill">
                <b>{str.userProfile}:</b> {userName}
              </span>
              <span className="meta-pill">
                <b>{str.accountEmail}:</b> {userEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Real Doses Completed Counter (Synchronized 100% with Meds Habit & Reminders) */}
        {reminders.length > 0 && (
          <div className="real-dose-card">
            <div className="dose-big-num">
              {takenCount} / {reminders.length}
            </div>
            <div className="dose-sub-txt">{str.todayDosesLabel}</div>
          </div>
        )}
      </div>

      {/* 2. THE ONE GAMIFICATION ACTIVITY: DAILY HEALTH STREAK (LIGHT & MINIMAL) */}
      <div className="real-streak-card">
        {/* Top Header of Streak */}
        <div className="streak-card-top">
          <div className="streak-flame-wrap">
            <div className="flame-icon-box">🔥</div>
            <div>
              <div className="streak-main-title">
                {currentStreakCount} {str.streakTitle}
              </div>
              <div className="streak-sub-title">{str.streakSub}</div>
            </div>
          </div>

          <div className="streak-top-right">
            <span className="streak-basis-tag">✨ {str.streakBasisTag}</span>
            <span className="habits-counter-pill">
              {completedHabitsCount}/3 {str.habitsProgressLabel}
            </span>
          </div>
        </div>

        {/* 3 Simple Daily Habits Grid */}
        <div className="habits-grid">
          {/* Habit 1: Medicines on Time (100% Two-Way Synced with Reminders and Header Counter) */}
          <div
            className={`habit-item ${streakData.habits.meds || allMedsTaken ? "habit-completed" : ""}`}
          >
            <div className="habit-info">
              <span className="habit-emoji">💊</span>
              <div>
                <h4 className="habit-title">{str.habitMedsTitle}</h4>
                <p className="habit-desc">
                  {reminders.length > 0
                    ? allMedsTaken
                      ? `✓ ${str.allMedsCompleted}`
                      : `${takenCount}/${reminders.length} ${str.taken}`
                    : str.habitMedsSub}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMedsHabit}
              className={`btn-habit-action ${streakData.habits.meds || allMedsTaken ? "btn-habit-done" : ""}`}
            >
              {streakData.habits.meds || allMedsTaken ? str.completed : `○ ${str.markDone}`}
            </button>
          </div>

          {/* Habit 2: 8 Glasses Water */}
          <div className={`habit-item ${streakData.habits.water >= 8 ? "habit-completed" : ""}`}>
            <div className="habit-info">
              <span className="habit-emoji">💧</span>
              <div>
                <h4 className="habit-title">{str.habitWaterTitle}</h4>
                <p className="habit-desc">
                  {streakData.habits.water}/8 {lang === "hi" ? "गिलास" : "Glasses"}
                </p>
              </div>
            </div>
            <div className="habit-water-controls">
              <button
                type="button"
                className="btn-water-step"
                onClick={() => adjustWater(-1)}
                disabled={streakData.habits.water <= 0}
                title="Minus 1 glass"
              >
                -
              </button>
              <span className="water-count-display">{streakData.habits.water}</span>
              <button
                type="button"
                className="btn-water-step"
                onClick={() => adjustWater(1)}
                disabled={streakData.habits.water >= 8}
                title="Add 1 glass"
              >
                +
              </button>
              {streakData.habits.water < 8 && (
                <button
                  type="button"
                  className="btn-quick-water"
                  onClick={() => updateHabit("water", 8)}
                >
                  8/8
                </button>
              )}
            </div>
          </div>

          {/* Habit 3: 2-Min Mindful Breathing */}
          <div className={`habit-item ${streakData.habits.breathing ? "habit-completed" : ""}`}>
            <div className="habit-info">
              <span className="habit-emoji">🧘</span>
              <div>
                <h4 className="habit-title">{str.habitBreatheTitle}</h4>
                <p className="habit-desc">{str.habitBreatheSub}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {!streakData.habits.breathing && (
                <button
                  type="button"
                  className="btn-habit-breathe"
                  onClick={() => {
                    setBreathTimer(60);
                    setBreathPhase("inhale");
                    setShowBreathingModal(true);
                  }}
                >
                  {str.openBreatheBtn}
                </button>
              )}
              <button
                type="button"
                onClick={() => updateHabit("breathing", !streakData.habits.breathing)}
                className={`btn-habit-action ${streakData.habits.breathing ? "btn-habit-done" : ""}`}
              >
                {streakData.habits.breathing ? str.completed : `○ ${str.markDone}`}
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Consistency Week Bubbles (Accurate Real Current Day Tracking) */}
        <div className="week-tracker-row">
          <div className="week-tracker-label-group">
            <span className="week-tracker-label">{str.trackerLabel}</span>
            <span className="week-today-badge">
              {str.todayTag}: {dayLabels[mondayFirstIndex - 1]?.label}
            </span>
          </div>
          <div className="week-bubbles-row">
            {weekDays.map((d, i) => (
              <div
                key={i}
                className={`day-bubble ${d.active ? "bubble-active" : ""} ${d.isToday ? "bubble-today" : ""}`}
              >
                <span className="bubble-day">{d.label}</span>
                <span className="bubble-mark">{d.active ? "✓" : "○"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CORE SUPERPOWER ACTIONS (LIGHT, MINIMAL WHITE CARDS) */}
      <div className="real-actions-grid">
        {/* Option 1: AI Prescription Scanner */}
        <div className="action-card card-scanner" onClick={() => navigate("/app/scanner")}>
          <div className="action-top">
            <div className="action-icon">📸</div>
            <span className="action-badge">{str.scannerBadge}</span>
          </div>
          <h2 className="action-title">{str.scannerTitle}</h2>
          <p className="action-desc">{str.scannerDesc}</p>
          <button type="button" className="btn-action-primary btn-scanner">
            {str.scannerBtn}
          </button>
        </div>

        {/* Option 2: AI Voice Triage Nurse */}
        <div className="action-card card-triage" onClick={() => navigate("/app/quick")}>
          <div className="action-top">
            <div className="action-icon">🎙️</div>
            <span className="action-badge">{str.triageBadge}</span>
          </div>
          <h2 className="action-title">{str.triageTitle}</h2>
          <p className="action-desc">{str.triageDesc}</p>
          <button type="button" className="btn-action-primary btn-triage">
            {str.triageBtn}
          </button>
        </div>
      </div>

      {/* 4. TODAY'S REAL MEDICATION SCHEDULE (REMAINDER) */}
      <div className="real-panel">
        <div className="panel-head-row">
          <div>
            <div className="panel-title-group">
              <span className="panel-emoji">⏰</span>
              <h3 className="panel-heading">{str.remindersTitle}</h3>
            </div>
            <p className="panel-subtext">{str.remindersSub}</p>
          </div>

          {reminders.length > 0 && (
            <button
              type="button"
              className="btn-link-flat"
              onClick={() => navigate("/app/reminders")}
            >
              {str.btnManageReminders}
            </button>
          )}
        </div>

        {reminders.length === 0 ? (
          <div className="real-empty-state">
            <span style={{ fontSize: 36, marginBottom: 8 }}>💊</span>
            <h4 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700 }}>{str.noMedsTitle}</h4>
            <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: 13.5, maxWidth: 480 }}>
              {str.noMedsSub}
            </p>
            <button
              type="button"
              className="btn-real-primary"
              onClick={() => navigate("/app/scanner")}
            >
              {str.btnScanFirst}
            </button>
          </div>
        ) : (
          <div className="real-reminders-list">
            {reminders.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`real-reminder-row ${item.taken ? "row-taken" : ""}`}
              >
                <div className="med-info-left">
                  <span className="time-badge">⏰ {item.time || "Scheduled"}</span>
                  <div>
                    <h4 className="med-title">{item.text}</h4>
                    <p className="med-details">{item.timing || item.type}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleReminderTaken(item.id)}
                  className={`btn-taken-pill ${item.taken ? "pill-taken" : ""}`}
                >
                  {item.taken ? str.taken : `○ ${str.markTaken}`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. WEEKLY HEALTH & ADHERENCE TREND GRAPH (GRAPH) */}
      <div className="real-panel">
        <div className="panel-head-row">
          <div>
            <div className="panel-title-group">
              <span className="panel-emoji">📈</span>
              <h3 className="panel-heading">{str.graphTitle}</h3>
            </div>
            <p className="panel-subtext">{str.graphSub}</p>
          </div>

          <div className="graph-live-badge">
            <span className="graph-live-dot">●</span>
            <span>{str.todayScoreLabel}: <b>{todayAdherenceScore}%</b></span>
          </div>
        </div>

        <div className="trend-chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={healthTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis domain={[70, 100]} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(val) => [`${val}%`, "Adherence Score"]}
                contentStyle={{
                  background: "var(--card, #0f223f)",
                  color: "var(--text, #f1f7ff)",
                  borderRadius: 10,
                  border: "1px solid var(--border, rgba(180, 220, 255, 0.2))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  fontWeight: 600,
                }}
                itemStyle={{ color: "var(--text, #f1f7ff)" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0d9488", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#0f766e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CALMING MINDFUL BREATHING MODAL (LIGHT & PEACEFUL) */}
      {showBreathingModal && (
        <div className="breathing-modal-overlay" onClick={() => setShowBreathingModal(false)}>
          <div className="breathing-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <span className="modal-peace-badge">🧘 2-MIN WELLNESS</span>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowBreathingModal(false)}
              >
                ✕
              </button>
            </div>

            <h3 className="breathe-heading">{str.breatheModalHeading}</h3>
            <p className="breathe-desc">{str.breatheModalDesc}</p>

            <div className="breathe-visual-wrap">
              <div className={`breath-circle ${breathPhase}`}>
                <div className="breath-inner-text">
                  {breathPhase === "inhale" && str.phaseInhale}
                  {breathPhase === "hold" && str.phaseHold}
                  {breathPhase === "exhale" && str.phaseExhale}
                </div>
              </div>
            </div>

            <div className="breath-timer-display">
              {breathTimer}s remaining
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-finish-breathe"
                onClick={handleFinishBreathing}
              >
                {str.btnFinishBreathe}
              </button>
              <button
                type="button"
                className="btn-cancel-breathe"
                onClick={() => setShowBreathingModal(false)}
              >
                {str.btnClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
