import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-container">

      {/* LOGO */}
      <div className="logo">
        LifeGuard<span>AI</span>
      </div>

      {/* 3 DOT MENU */}
      {!open && (
        <div className="menu-dot" onClick={() => setOpen(true)}>
          ⋮
        </div>
      )}

      {/* POPUP MENU */}
      {open && (
        <div className="popup">
          <Link to="/" onClick={() => setOpen(false)}>
            Home
          </Link>

          {/* ⭐ FEATURES ADDED BACK */}
          <Link to="/auth/login" onClick={() => setOpen(false)}>
            Features
          </Link>

          <Link to="/auth/login" onClick={() => setOpen(false)}>
            Login
          </Link>

          <Link to="/auth/signup" onClick={() => setOpen(false)}>
            Signup
          </Link>

          <button className="close-btn" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>
      )}
    </header>
  );
}