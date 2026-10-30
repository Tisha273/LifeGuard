import React, { useState, useEffect, useRef, useContext } from "react";
import Swal from "sweetalert2";
import { LangContext } from "../App";
import api from "../api";
import "./Reminders.css";

/* ================= WEB AUDIO API RINGTONE SYNTHESIZER ================= */
class RingtonePlayer {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.intervalId = null;
    this.audioElement = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    if (!this.audioElement) {
      try {
        this.audioElement = new Audio("/alarm.mp3");
        this.audioElement.preload = "auto";
      } catch (e) {}
    }
  }

  // Melodic 4-note repeating chime ringtone
  playChimePulse() {
    if (!this.audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.audioCtx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);

        gain.gain.setValueAtTime(0, now + idx * 0.16);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.16 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.38);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.4);
      });
    } catch (e) {
      console.warn("Chime synth note:", e);
    }
  }

  start() {
    this.init();
    this.isPlaying = true;

    // Try playing alarm.mp3 concurrently
    if (this.audioElement) {
      try {
        this.audioElement.currentTime = 0;
        this.audioElement.loop = true;
        this.audioElement.play().catch(() => {});
      } catch (e) {}
    }

    // Play initial chime
    this.playChimePulse();

    // Repeat chime ringtone every 1.5 seconds
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playChimePulse();
      }
    }, 1500);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
    }
  }
}

const ringtoneInstance = new RingtonePlayer();

/* ================= TEXT-TO-SPEECH (VOICE REMINDER) ================= */
function speakReminderVoice(title, type, lang = "en") {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // clear previous speech

    let textToSpeak = "";
    if (lang === "hi") {
      textToSpeak = `ध्यान दें! यह आपके ${type || "दवाई"} का रिमाइंडर है: ${title}। कृपया इसे समय पर लें।`;
    } else {
      textToSpeak = `Attention! It is time for your ${type || "medicine"} reminder: ${title}. Please take your medicine now.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(lang === "hi" ? "hi" : "en")
    );
    if (matchedVoice) utterance.voice = matchedVoice;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Voice speech error:", err);
  }
}

export default function SmartReminders() {
  const { lang } = useContext(LangContext);

  const t = {
    en: {
      badge: "Voice & Ringtone Enabled",
      title: "Smart Medical Reminders",
      subtitle: "Never miss critical medications. Voice announcements and audible ringtones alert you on time.",
      audioStatus: "Audio & Voice Status: Ready",
      testAlarmBtn: "Test Alarm & Voice Now",
      scheduleTitle: "Schedule New Reminder",
      quickTestBtn: "⚡ Quick Test (+1 Min)",
      categoryLabel: "Category",
      nameLabel: "Reminder Name / Medication",
      namePlaceholder: "e.g. Paracetamol 500mg",
      dateLabel: "Date",
      timeLabel: "Time (24h)",
      setReminderBtn: "⏰ Set Reminder",
      activeTitle: "Active Scheduled Reminders",
      noRemindersTitle: "No reminders scheduled yet.",
      noRemindersSub: "Add a reminder above to get timely audio and voice alerts.",
      testBtn: "🔊 Test",
      ringingTitle: "Reminder Ringing!",
      scheduledAlert: "Scheduled Alert",
      scheduledFor: "Scheduled for today at",
      playingNotice: "🔊 Voice announcement and ringtone playing...",
      dismissBtn: "✓ Mark Taken & Dismiss",
      snoozeBtn: "💤 Snooze (5m)",
      snoozedTitle: "⏰ Snoozed",
      snoozedMsg: "Reminder snoozed for 5 minutes",
      catMedicine: "Medicine 💊",
      catDoctor: "Doctor Check-up 🩺",
      catBP: "BP Test 💓",
      catWater: "Water Intake 💧",
      catExercise: "Exercise / Walk 🏃",
    },
    hi: {
      badge: "आवाज और रिंगटोन सक्षम",
      title: "स्मार्ट दवा रिमाइंडर",
      subtitle: "कभी भी आवश्यक दवाएं न भूलें। समय पर आवाज और सुरीली रिंगटोन आपको अलर्ट करेगी।",
      audioStatus: "ऑडियो और वॉइस स्थिति: सक्रिय",
      testAlarmBtn: "अलार्म और आवाज टेस्ट करें",
      scheduleTitle: "नया रिमाइंडर जोड़ें",
      quickTestBtn: "⚡ तुरंत टेस्ट (+1 मिनट)",
      categoryLabel: "श्रेणी",
      nameLabel: "दवा या रिमाइंडर का नाम",
      namePlaceholder: "जैसे: पैरासिटामोल 500mg, बीपी की गोली",
      dateLabel: "तारीख",
      timeLabel: "समय (24 घंटे)",
      setReminderBtn: "⏰ रिमाइंडर सेट करें",
      activeTitle: "सक्रिय शेड्यूल किए गए रिमाइंडर",
      noRemindersTitle: "अभी कोई रिमाइंडर शेड्यूल नहीं है।",
      noRemindersSub: "समय पर ऑडियो और वॉइस अलर्ट पाने के लिए ऊपर नया रिमाइंडर जोड़ें।",
      testBtn: "🔊 टेस्ट",
      ringingTitle: "रिमाइंडर बज रहा है!",
      scheduledAlert: "दवा का निर्धारित समय",
      scheduledFor: "आज का निर्धारित समय",
      playingNotice: "🔊 आवाज में सूचना और रिंगटोन बज रही है...",
      dismissBtn: "✓ दवा ले ली और बंद करें",
      snoozeBtn: "💤 5 मिनट बाद याद दिलाएं",
      snoozedTitle: "⏰ स्नूज़ किया गया",
      snoozedMsg: "रिमाइंडर 5 मिनट के लिए आगे बढ़ाया गया",
      catMedicine: "दवा 💊",
      catDoctor: "डॉक्टर चेकअप 🩺",
      catBP: "बीपी जांच 💓",
      catWater: "पानी पीना 💧",
      catExercise: "व्यायाम / टहलना 🏃",
    },
  };

  const str = t[lang] || t.en;

  const user = JSON.parse(localStorage.getItem("lg_user") || "{}");
  const userKey = user?.email || "guest";
  const STORAGE_KEY = `smart_reminders_${userKey}`;

  const [reminders, setReminders] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null); // when alarm is ringing
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  // New Reminder input state
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTimePlus = (mins = 2) => {
    const d = new Date(Date.now() + mins * 60000);
    return d.toTimeString().slice(0, 5);
  };

  const [newReminder, setNewReminder] = useState({
    type: "Medicine 💊",
    text: "",
    date: getTodayDate(),
    time: getCurrentTimePlus(2),
  });

  const remindersRef = useRef(reminders);
  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  /* ================= INIT & LOAD ================= */
  useEffect(() => {
    fetchReminders();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    const unlock = () => {
      ringtoneInstance.init();
      setSoundUnlocked(true);
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get(`/reminders/${user._id || user.id}`);
      const formatted = res.data.map((r) => ({
        id: r._id,
        text: r.medicineName,
        type: r.dosage,
        date: r.repeatDays?.[0] || getTodayDate(),
        time: r.time,
        notified: false,
      }));
      setReminders(formatted);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
    } catch (err) {
      // Fallback to local storage
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setReminders(cached);
    }
  };

  /* ================= TRIGGER ALARM (RINGTONE + VOICE) ================= */
  const triggerAlarm = (reminder) => {
    setActiveAlert(reminder);

    // 1. Play Ringtone
    ringtoneInstance.start();

    // 2. Announce Voice with slight natural offset
    setTimeout(() => {
      speakReminderVoice(reminder.text, reminder.type, lang);
    }, 1200);

    // 3. System Notification if backgrounded
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`⏰ LifeGuard Reminder: ${reminder.text}`, {
          body: `Time for your ${reminder.type}.`,
          icon: "/icon-192.png",
        });
      } catch (e) {}
    }
  };

  const stopActiveAlarm = () => {
    ringtoneInstance.stop();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setActiveAlert(null);
  };

  const handleSnooze = (minutes = 5) => {
    stopActiveAlarm();
    if (!activeAlert) return;

    const snoozedTime = getCurrentTimePlus(minutes);
    const updated = reminders.map((r) =>
      r.id === activeAlert.id ? { ...r, time: snoozedTime, notified: false } : r
    );
    setReminders(updated);
    Swal.fire({
      title: "⏰ Snoozed",
      text: `Reminder snoozed for ${minutes} minutes (will ring at ${snoozedTime})`,
      icon: "info",
      timer: 2500,
    });
  };

  /* ================= BACKGROUND TIME CHECKER ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentDate = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const currentHHMM = now.toTimeString().slice(0, 5); // HH:MM

      remindersRef.current.forEach((r) => {
        // Trigger if date & time match and hasn't notified yet for this minute
        if (r.date === currentDate && r.time === currentHHMM && !r.notified) {
          triggerAlarm(r);

          // Mark notified
          const updated = remindersRef.current.map((x) =>
            x.id === r.id ? { ...x, notified: true } : x
          );
          setReminders(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [lang]);

  /* ================= ADD REMINDER ================= */
  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.text.trim()) {
      Swal.fire("Please enter medicine or reminder name", "", "warning");
      return;
    }

    try {
      ringtoneInstance.init(); // ensure sound is unlocked

      await api.post("/reminders", {
        userId: user._id || user.id,
        medicineName: newReminder.text.trim(),
        dosage: newReminder.type,
        time: newReminder.time,
        repeatDays: [newReminder.date],
      });

      await fetchReminders();

      Swal.fire({
        title: "⏰ Reminder Scheduled!",
        text: `Set for ${newReminder.date} at ${newReminder.time}. Voice and ringtone are active!`,
        icon: "success",
        timer: 2500,
      });

      setNewReminder({
        type: newReminder.type,
        text: "",
        date: getTodayDate(),
        time: getCurrentTimePlus(2),
      });
    } catch (err) {
      console.error("Add reminder error:", err);
      // Fallback local addition
      const localItem = {
        id: "local_" + Date.now(),
        text: newReminder.text.trim(),
        type: newReminder.type,
        date: newReminder.date,
        time: newReminder.time,
        notified: false,
      };
      const updated = [localItem, ...reminders];
      setReminders(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      Swal.fire("Reminder Saved", "Reminder is active with voice and ringtone.", "success");
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteReminder = async (id) => {
    const res = await Swal.fire({
      title: "Delete Reminder?",
      text: "Are you sure you want to remove this reminder?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    });

    if (!res.isConfirmed) return;

    try {
      await api.delete(`/reminders/${id}`);
      fetchReminders();
    } catch (err) {
      const updated = reminders.filter((r) => r.id !== id);
      setReminders(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <div className="reminders-container">
      {/* Header */}
      <div className="reminders-header">
        <h1 className="reminders-title">{str.title}</h1>
        <p className="reminders-subtitle">{str.subtitle}</p>
      </div>

      {/* Add Reminder Card */}
      <div className="reminders-form-card">
        <div className="reminders-form-title">
          <span>➕ {str.scheduleTitle}</span>
        </div>

        <form onSubmit={handleAddReminder}>
          <div className="reminders-input-grid">
            <div className="reminders-field">
              <label>{str.categoryLabel}</label>
              <select
                className="reminders-select"
                value={newReminder.type}
                onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
              >
                <option value="Medicine 💊">{str.catMedicine}</option>
                <option value="Doctor Check-up 🩺">{str.catDoctor}</option>
                <option value="Blood Pressure Test 💓">{str.catBP}</option>
                <option value="Water Intake 💧">{str.catWater}</option>
                <option value="Exercise / Walk 🏃">{str.catExercise}</option>
              </select>
            </div>

            <div className="reminders-field" style={{ flex: 2 }}>
              <label>{str.nameLabel}</label>
              <input
                type="text"
                className="reminders-input"
                placeholder={str.namePlaceholder}
                value={newReminder.text}
                onChange={(e) => setNewReminder({ ...newReminder, text: e.target.value })}
                required
              />
            </div>

            <div className="reminders-field">
              <label>{str.dateLabel}</label>
              <input
                type="date"
                className="reminders-input"
                value={newReminder.date}
                onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                required
              />
            </div>

            <div className="reminders-field">
              <label>{str.timeLabel}</label>
              <input
                type="time"
                className="reminders-input"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="add-reminder-btn">
              <span>{str.setReminderBtn}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Reminders List */}
      <div>
        <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", color: "#1e293b" }}>
          {str.activeTitle} ({reminders.length})
        </h3>

        {reminders.length === 0 ? (
          <div className="reminders-empty">
            <p style={{ fontSize: "28px", margin: "0 0 10px 0" }}>⏰</p>
            <p style={{ margin: 0, fontWeight: "600" }}>{str.noRemindersTitle}</p>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
              {str.noRemindersSub}
            </p>
          </div>
        ) : (
          <div className="reminders-list-section">
            {reminders.map((r) => (
              <div className="reminder-item-card" key={r.id}>
                <div className="reminder-item-left">
                  <div className="reminder-type-badge">
                    {r.type.includes("💊")
                      ? "💊"
                      : r.type.includes("🩺")
                      ? "🩺"
                      : r.type.includes("💧")
                      ? "💧"
                      : "⏰"}
                  </div>
                  <div className="reminder-details">
                    <span className="reminder-name">{r.text}</span>
                    <span className="reminder-meta">
                      <span>🏷️ {r.type}</span>
                      <span>📅 {r.date}</span>
                      <span>⏰ {r.time}</span>
                    </span>
                  </div>
                </div>

                <div className="reminder-actions">
                  <button
                    type="button"
                    className="reminder-test-single-btn"
                    onClick={() => triggerAlarm(r)}
                    title={str.testBtn}
                  >
                    {str.testBtn}
                  </button>
                  <button
                    type="button"
                    className="reminder-delete-btn"
                    onClick={() => handleDeleteReminder(r.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= ALARM ACTIVE RINGING MODAL ================= */}
      {activeAlert && (
        <div className="ringing-overlay">
          <div className="ringing-card">
            <div className="ringing-bell-anim">🔔</div>

            <h2 className="ringing-title">{str.ringingTitle}</h2>
            <p className="ringing-subtitle">
              {activeAlert.type} — {str.scheduledAlert}
            </p>

            <div className="ringing-details-box">
              <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
                {activeAlert.text}
              </div>
              <div style={{ marginTop: "6px", color: "#64748b" }}>
                {str.scheduledFor} <strong>{activeAlert.time}</strong>
              </div>
              <div style={{ marginTop: "4px", fontSize: "12px", color: "#0d9488" }}>
                {str.playingNotice}
              </div>
            </div>

            <div className="ringing-actions">
              <button
                type="button"
                className="dismiss-alarm-btn"
                onClick={stopActiveAlarm}
              >
                {str.dismissBtn}
              </button>

              <button
                type="button"
                className="snooze-alarm-btn"
                onClick={() => handleSnooze(5)}
              >
                {str.snoozeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
