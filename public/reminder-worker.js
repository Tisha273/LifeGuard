// public/reminder-worker.js

self.addEventListener("install", () => {
  console.log("Service Worker installed for Smart Reminders ✅");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated 🩵");
  event.waitUntil(self.clients.claim());
});

// 📩 RECEIVE REMINDER DATA FROM APP
self.addEventListener("message", (event) => {
  const { title, body, time } = event.data;

  const delay = new Date(time).getTime() - Date.now();
  if (delay <= 0) return;

  console.log("⏰ Reminder scheduled in worker");

  setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",

      // 🔥 POPUP-LIKE BEHAVIOR
      requireInteraction: true, // stays on screen
      vibrate: [300, 100, 300, 100, 300],

      // 🔘 ACTION BUTTONS
      actions: [
        { action: "open", title: "Open LifeGuard" },
        { action: "snooze", title: "Snooze 5 min" },
      ],
    });
  }, delay);
});

// 🔘 HANDLE BUTTON CLICKS
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "snooze") {
    setTimeout(() => {
      self.registration.showNotification("⏰ Snoozed Reminder", {
        body: "Your reminder is back!",
        requireInteraction: true,
        icon: "/icon-192.png",
      });
    }, 5 * 60 * 1000); // 5 minutes
  } else {
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});
