import React, { useState, useEffect } from "react";
import "./InstallPrompt.css";

// Global holder for deferred prompt so other pages (Settings, Sidebar) can access it
let globalDeferredPrompt = null;

export function triggerGlobalInstall(onSuccess, onFallback) {
  if (globalDeferredPrompt) {
    globalDeferredPrompt.prompt();
    globalDeferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted the install prompt");
        if (onSuccess) onSuccess();
      } else {
        console.log("[PWA] User dismissed the install prompt");
      }
      globalDeferredPrompt = null;
    });
  } else {
    // Dispatch custom event to show prompt/instructions
    window.dispatchEvent(new CustomEvent("pwa-show-install-modal"));
    if (onFallback) onFallback();
  }
}

export function isAppInstalled() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export default function InstallPrompt({ lang = "en" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  useEffect(() => {
    // 1. Check if already installed
    if (isAppInstalled()) {
      setInstalled(true);
      return;
    }

    // 2. Check if dismissed recently (within 24 hours)
    const dismissedAt = localStorage.getItem("lg_pwa_dismissed_at");
    const isDismissed =
      dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000;

    // 3. Listen for native browser install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      console.log("[PWA] LifeGuard was successfully installed!");
      setInstalled(true);
      setIsVisible(false);
      globalDeferredPrompt = null;
    };

    // 4. Custom trigger from Settings or Sidebar
    const handleCustomTrigger = () => {
      if (globalDeferredPrompt) {
        globalDeferredPrompt.prompt();
        globalDeferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === "accepted") {
            setInstalled(true);
            setIsVisible(false);
          }
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
        });
      } else if (isIOS) {
        setShowIosModal(true);
      } else {
        setShowIosModal(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwa-show-install-modal", handleCustomTrigger);

    // If iOS and not dismissed and not installed, show after 3 seconds
    if (isIOS && !isDismissed && !isAppInstalled()) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa-show-install-modal", handleCustomTrigger);
    };
  }, [isIOS]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          setIsVisible(false);
          setInstalled(true);
        }
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
      });
    } else {
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("lg_pwa_dismissed_at", Date.now().toString());
  };

  if (installed || (!isVisible && !showIosModal)) {
    return null;
  }

  const isHindi = lang === "hi";

  return (
    <>
      {/* Floating Bottom Install Banner */}
      {isVisible && !showIosModal && (
        <div className="pwa-install-banner">
          <div className="pwa-banner-left">
            <div className="pwa-app-icon">
              <img src="/icon-192.png" alt="LifeGuard" />
            </div>
            <div className="pwa-banner-text">
              <div className="pwa-app-name">LifeGuard App</div>
              <div className="pwa-app-desc">
                {isHindi
                  ? "होम स्क्रीन पर ऐप इंस्टॉल करें — तेज और ऑफलाइन उपलब्ध!"
                  : "Install app for instant home screen access & voice reminders!"}
              </div>
            </div>
          </div>

          <div className="pwa-banner-actions">
            <button
              onClick={handleInstallClick}
              className="pwa-btn-install"
              type="button"
            >
              <span>📲</span>
              <span>{isHindi ? "इंस्टॉल करें" : "Install App"}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="pwa-btn-close"
              type="button"
              title="Dismiss"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Manual Instructions Modal for iOS Safari / Fallback */}
      {showIosModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowIosModal(false)}>
          <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-modal-header">
              <div className="pwa-modal-title-row">
                <img src="/icon-192.png" alt="LifeGuard" className="pwa-modal-icon" />
                <div>
                  <h3 className="pwa-modal-title">
                    {isHindi ? "लाइफगार्ड ऐप इंस्टॉल करें" : "Install LifeGuard App"}
                  </h3>
                  <p className="pwa-modal-subtitle">
                    {isHindi
                      ? "अपने फोन या कंप्यूटर की होम स्क्रीन पर लगाएं"
                      : "Add to Home Screen for the full native app experience"}
                  </p>
                </div>
              </div>
              <button
                className="pwa-modal-close-btn"
                onClick={() => setShowIosModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="pwa-steps-list">
              {isIOS ? (
                <>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">1</div>
                    <div className="pwa-step-text">
                      {isHindi ? (
                        <>Safari के निचले मेनू में <strong>शेयर बटन (Share ⎋)</strong> पर टैप करें।</>
                      ) : (
                        <>Tap the <strong>Share button (⎋)</strong> at the bottom of Safari.</>
                      )}
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">2</div>
                    <div className="pwa-step-text">
                      {isHindi ? (
                        <>नीचे स्क्रॉल करें और <strong>'होम स्क्रीन में जोड़ें' (Add to Home Screen ⊞)</strong> चुनें।</>
                      ) : (
                        <>Scroll down and tap <strong>'Add to Home Screen' (⊞)</strong>.</>
                      )}
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">3</div>
                    <div className="pwa-step-text">
                      {isHindi ? (
                        <>ऊपर दाईं ओर <strong>'जोड़ें' (Add)</strong> पर टैप करें — ऐप तैयार है!</>
                      ) : (
                        <>Tap <strong>'Add'</strong> in the top right corner — done!</>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">1</div>
                    <div className="pwa-step-text">
                      {isHindi ? (
                        <>ब्राउज़र के ऊपरी कोने में <strong>तीन डॉट्स (⋮)</strong> या <strong>इंस्टॉल आइकन (⊕)</strong> पर क्लिक करें।</>
                      ) : (
                        <>Click the <strong>Install icon (⊕)</strong> in your browser address bar or menu (⋮).</>
                      )}
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">2</div>
                    <div className="pwa-step-text">
                      {isHindi ? (
                        <><strong>'LifeGuard इंस्टॉल करें' (Install LifeGuard)</strong> पर क्लिक करें।</>
                      ) : (
                        <>Select <strong>'Install LifeGuard'</strong> to add to your desktop or phone home screen.</>
                      )}
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">3</div>
                    <div className="pwa-step-text">
                      {isHindi ? (
                        <>अब लाइफगार्ड बिना किसी ब्राउज़र बार के पूरी स्क्रीन पर एक रियल ऐप की तरह चलेगा।</>
                      ) : (
                        <>LifeGuard will launch in fullscreen standalone window with native push alerts!</>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              className="pwa-modal-done-btn"
              onClick={() => setShowIosModal(false)}
            >
              {isHindi ? "समझ गया" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
