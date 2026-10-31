import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LangContext } from "../App";
import Swal from "sweetalert2";
import api from "../api";
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

const getTodayStr = () => new Date().toISOString().split("T")[0];

const initStreakData = (userKey) => {
  const todayStr = getTodayStr();
  try {
    const raw = localStorage.getItem(`lg_streak_${userKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === todayStr) {
        return {
          baseStreak: typeof parsed.baseStreak === "number" ? parsed.baseStreak : 0,
          todayGoalDone: Boolean(parsed.todayGoalDone),
          habits: {
            meds: Boolean(parsed.habits?.meds),
            water: typeof parsed.habits?.water === "number" ? parsed.habits.water : 0,
            breathing: Boolean(parsed.habits?.breathing),
          },
          completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
          history: parsed.history || {},
          date: todayStr,
        };
      } else {
        // Date changed (new day rollover)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newBase = typeof parsed.baseStreak === "number" ? parsed.baseStreak : 0;
        if (parsed.todayGoalDone && parsed.date === yesterdayStr) {
          newBase = newBase + 1;
        } else if (parsed.date !== yesterdayStr) {
          newBase = 0; // missed consecutive days
        }

        const newObj = {
          baseStreak: newBase,
          todayGoalDone: false,
          habits: {
            meds: false,
            water: 0,
            breathing: false,
          },
          completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
          history: {
            ...(parsed.history || {}),
            [parsed.date]: parsed.todayGoalDone ? 100 : (parsed.score || 0),
          },
          date: todayStr,
        };
        localStorage.setItem(`lg_streak_${userKey}`, JSON.stringify(newObj));
        return newObj;
      }
    }
  } catch (e) {
    console.warn("Failed to parse streakData:", e);
  }

  // Brand-new user default: 0 streak, 0 water, 0 habits completed
  return {
    baseStreak: 0,
    todayGoalDone: false,
    habits: {
      meds: false,
      water: 0,
      breathing: false,
    },
    completedDays: [],
    history: {},
    date: todayStr,
  };
};

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
  const [streakData, setStreakData] = useState(() => initStreakData(userKey));

  // Reset streak data if user account switches
  useEffect(() => {
    setStreakData(initStreakData(userKey));
  }, [userKey]);

  const completedHabitsCount =
    (streakData.habits.meds || allMedsTaken ? 1 : 0) +
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
    const isToday = d.dayNum === mondayFirstIndex;
    const isCompleted = streakData.completedDays?.includes(d.dayNum);
    return {
      label: d.label,
      isToday,
      active: isToday ? streakData.todayGoalDone : Boolean(isCompleted),
    };
  });

  // Current Display Streak: 0 for new user, advances only when habits are completed
  const baseStreak = typeof streakData.baseStreak === "number" ? streakData.baseStreak : 0;
  const currentStreakCount = streakData.todayGoalDone
    ? baseStreak + 1
    : baseStreak;

  // Calculate Today's Real-Time Adherence Score based on user actions:
  // Meds: 50% • Water (up to 8 glasses): 25% • Mindful Breathing: 25%
  const medsScore = reminders.length > 0
    ? (takenCount / reminders.length) * 50
    : (streakData.habits.meds ? 50 : 0);
  const waterScore = Math.min(25, ((streakData.habits.water || 0) / 8) * 25);
  const breathScore = streakData.habits.breathing ? 25 : 0;
  const todayAdherenceScore = Math.round(medsScore + waterScore + breathScore);

  // 7-Day Health & Adherence Trend Graph Data (Calculated dynamically)
  const healthTrendData = dayLabels.map((d) => {
    if (d.dayNum === mondayFirstIndex) {
      return { day: d.label, score: todayAdherenceScore };
    }
    const pastScore = streakData.history?.[d.label] || (streakData.completedDays?.includes(d.dayNum) ? 100 : 0);
    return {
      day: d.label,
      score: d.dayNum < mondayFirstIndex ? pastScore : 0,
    };
  });

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

  // Save Reminders strictly to current user's key
  const saveReminders = (updated) => {
    const userReminderKey = userKey === "guest" ? "smart_reminders_guest" : `smart_reminders_${userKey}`;
    localStorage.setItem(userReminderKey, JSON.stringify(updated));
  };

  // Load Real Data from localStorage and Backend API
  const loadRealData = () => {
    const displayName = user?.name || user?.username || (lang === "hi" ? "साथी" : "Member");
    setUserName(displayName);
    setUserEmail(user?.email || "");

    const hr = new Date().getHours();
    if (hr < 12) setGreeting(str.morning);
    else if (hr < 18) setGreeting(str.afternoon);
    else setGreeting(str.evening);

    // Load Reminders strictly for this specific user (NEVER fall back to guest/demo data)
    const userReminderKey = userKey === "guest" ? "smart_reminders_guest" : `smart_reminders_${userKey}`;
    const localReminders = JSON.parse(localStorage.getItem(userReminderKey) || "[]");
    setReminders(localReminders);

    // Ensure meds habit matches actual reminders state
    if (localReminders.length > 0) {
      const allTaken = localReminders.every((r) => r.taken);
      if (allTaken !== streakData.habits.meds) {
        updateHabit("meds", allTaken);
      }
    }

    // Also fetch latest reminders from backend API if user is logged in
    if (user?._id || user?.id) {
      api.get(`/reminders/${user._id || user.id}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            const formatted = res.data.map((r) => ({
              id: r._id,
              text: r.medicineName,
              time: r.time,
              timing: r.dosage,
              taken: Boolean(r.isCompleted || r.taken),
            }));
            setReminders(formatted);
            localStorage.setItem(userReminderKey, JSON.stringify(formatted));
          }
        })
        .catch(() => {});
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

  // Update Habit & Check Streak Completion (Accurate & Stable)
  const updateHabit = (habitKey, value) => {
    setStreakData((prev) => {
      const nextHabits = { ...prev.habits, [habitKey]: value };
      const allDone = Boolean(nextHabits.meds && nextHabits.water >= 8 && nextHabits.breathing);
      const wasDone = prev.todayGoalDone;

      const currentDayNum = mondayFirstIndex;
      const nextCompletedDays = [...(prev.completedDays || [])];
      if (allDone && !nextCompletedDays.includes(currentDayNum)) {
        nextCompletedDays.push(currentDayNum);
      } else if (!allDone && nextCompletedDays.includes(currentDayNum)) {
        const idx = nextCompletedDays.indexOf(currentDayNum);
        if (idx !== -1) nextCompletedDays.splice(idx, 1);
      }

      const updated = {
        ...prev,
        habits: nextHabits,
        todayGoalDone: allDone,
        completedDays: nextCompletedDays,
        history: {
          ...(prev.history || {}),
          [dayLabels[currentDayNum - 1]?.label]: allDone ? 100 : todayAdherenceScore,
        },
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

        {/* Real Doses Completed Counter */}
        {reminders.length > 0 ? (
          <div className="real-dose-card">
            <div className="dose-big-num">
              {takenCount} / {reminders.length}
            </div>
            <div className="dose-sub-txt">{str.todayDosesLabel}</div>
          </div>
        ) : (
          <div className="real-dose-card" style={{ opacity: 0.85 }}>
            <div className="dose-big-num" style={{ fontSize: 18, color: "#94a3b8" }}>
              0
            </div>
            <div className="dose-sub-txt">
              {lang === "hi" ? "कोई सक्रिय रिमाइंडर नहीं" : "No Active Reminders"}
            </div>
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
                    : (streakData.habits.meds ? `✓ ${str.allMedsCompleted}` : (lang === "hi" ? "कोई सक्रिय दवा रिमाइंडर नहीं" : "No active medication scheduled"))}
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
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
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
