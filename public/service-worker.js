// LifeGuard Service Worker — Full PWA Offline & Background Reminders Support
const CACHE_NAME = "lifeguard-pwa-v1";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/alarm.mp3"
];

// 1. INSTALL
self.addEventListener("install", (event) => {
  console.log("[PWA] Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA] Precaching app shell assets");
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[PWA] Precaching some assets skipped:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE
self.addEventListener("activate", (event) => {
  console.log("[PWA] Service Worker activated");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[PWA] Clearing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH — Stale-While-Revalidate for static assets, network-first for navigation & API
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass API calls, external SDKs, chrome extensions
  if (
    url.pathname.startsWith("/api") ||
    url.origin !== self.location.origin ||
    req.method !== "GET"
  ) {
    return;
  }

  // Navigation requests (HTML pages)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        return networkResponse;
      });
    })
  );
});

// 4. SMART REMINDERS & MEDICINE NOTIFICATIONS
self.addEventListener("message", (event) => {
  if (!event.data) return;

  const { type, title, body, time, medId } = event.data;

  if (type === "SCHEDULE_REMINDER" || time) {
    const delay = new Date(time).getTime() - Date.now();
    if (delay <= 0) return;

    console.log("[PWA] Reminder scheduled in Service Worker:", title, "in", Math.round(delay / 1000), "s");

    setTimeout(() => {
      self.registration.showNotification(title || "⏰ LifeGuard Medication Reminder", {
        body: body || "It is time for your scheduled clinical medication.",
        icon: "/icon-192.png",
        badge: "/favicon.png",
        data: { medId, url: "/app/reminders" },
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: "taken", title: "✅ Mark as Taken" },
          { action: "snooze", title: "⏳ Snooze (5m)" },
          { action: "open", title: "Open App" }
        ],
      });
    }, delay);
  }
});

// 5. NOTIFICATION CLICKS
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};

  if (action === "snooze") {
    setTimeout(() => {
      self.registration.showNotification("⏰ Snoozed Medication Alert", {
        body: "Your snoozed reminder is due now!",
        requireInteraction: true,
        icon: "/icon-192.png",
        badge: "/favicon.png",
        data: { url: "/app/reminders" }
      });
    }, 5 * 60 * 1000); // 5 min
    return;
  }

  // Open or focus LifeGuard window
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes("/app") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(data.url || "/app");
      }
    })
  );
});
