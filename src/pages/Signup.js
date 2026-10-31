import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import api from "../api";

export default function Signup({ onSuccess, switchToLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUser) {
      setError("Please choose a username.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (pass.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (pass !== confirmPass) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/users/signup", {
        name: trimmedUser,
        email: trimmedEmail,
        password: pass,
      });

      // Clear any pending state and navigate new user to login
      navigate("/auth/login", {
        replace: true,
        state: {
          successMessage: "Account created successfully! Please log in with your credentials.",
          registeredIdentifier: trimmedUser,
        },
      });
    } catch (err) {
      console.error("Signup error:", err);
      const serverMessage = err.response?.data?.message;

      if (err.response?.status === 400) {
        setError(serverMessage || "Invalid registration information.");
      } else if (!err.response) {
        setError("Unable to connect to the backend server. Make sure the server is running on http://localhost:5000.");
      } else {
        setError(serverMessage || "Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">LG</div>
          <h1>Create an Account</h1>
          <p className="sub">Join LifeGuard to monitor and protect your health</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="auth-field">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password (min 6 characters)</label>
            <input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPass}
              onChange={(e) => {
                setConfirmPass(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
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
                <span>Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="switch-text">
          Already have an account?{" "}
          <span onClick={switchToLogin}>Log In</span>
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
