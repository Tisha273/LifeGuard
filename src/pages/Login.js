import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import api from "../api";

export default function Login({ onSuccess, switchToSignup }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError("Please enter your email or username.");
      return;
    }
    if (!pass) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/users/login", {
        email: cleanIdentifier,
        password: pass,
      });

      localStorage.setItem("lg_user", JSON.stringify(res.data.user));
      localStorage.setItem("lg_token", res.data.token);
      localStorage.setItem("lg_auth", "true");

      onSuccess();
    } catch (err) {
      console.error("Login failed:", err);
      const serverMessage = err.response?.data?.message;

      if (err.response?.status === 400) {
        if (serverMessage === "User not found") {
          setError("No account found with this username or email. Please sign up first.");
        } else if (serverMessage === "Wrong password") {
          setError("Incorrect password. Please try again.");
        } else {
          setError(serverMessage || "Invalid login credentials. Please try again.");
        }
      } else if (!err.response) {
        setError("Unable to connect to the backend server. Make sure the server is running on http://localhost:5000.");
      } else {
        setError(serverMessage || "Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  useEffect(() => {
    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id:
              "770031219524-2q6noqjlpma47sve6b5i7p141hua5fpu.apps.googleusercontent.com",
            callback: handleGoogle,
          });

          const btnEl = document.getElementById("googleBtn");
          if (btnEl) {
            btnEl.innerHTML = "";
            window.google.accounts.id.renderButton(btnEl, {
              theme: "outline",
              size: "large",
              width: 358,
              shape: "pill",
            });
          }
        } catch (e) {
          console.warn("Google Sign-In initialization note:", e);
        }
      }
    };

    initGoogle();
    const timer = setTimeout(initGoogle, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogle = async (response) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/users/google-login", {
        token: response.credential,
      });

      localStorage.setItem("lg_user", JSON.stringify(res.data.user));
      localStorage.setItem("lg_token", res.data.token);
      localStorage.setItem("lg_auth", "true");

      onSuccess();
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google authentication failed. Please try again or use standard login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">LG</div>
          <h1>Welcome Back</h1>
          <p className="sub">Log in to manage your health and records</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label htmlFor="login-identifier">Email or Username</label>
            <input
              id="login-identifier"
              type="text"
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError("");
              }}
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setError("");
              }}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner"></span>
                <span>Logging in...</span>
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div id="googleBtn" className="auth-google-wrapper"></div>

        <p className="switch-text">
          Don't have an account?{" "}
          <span onClick={switchToSignup}>Sign Up</span>
        </p>

        <div>
          <span
            className="auth-back-link"
            onClick={() => navigate("/")}
          >
            ← Back to Homepage
          </span>
        </div>
      </div>
    </div>
  );
}
