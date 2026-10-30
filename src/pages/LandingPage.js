import React, { useEffect } from "react";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";


// import hero from "../assets/images/hero.jpeg";
// import f1 from "../assets/images/feature1.jpeg";
// import f2 from "../assets/images/feature2.jpeg";
// import f3 from "../assets/images/feature3.jpeg";

export default function LandingPage() {
  const navigate = useNavigate();
   useEffect(() => {
    const auth = localStorage.getItem("lg_auth");
    if (auth === "true") navigate("/app");
  }, []);


  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.18 }
    );
    reveals.forEach(el => revealObserver.observe(el));

    const onScroll = () => {
      const circle = document.getElementById("magicCircle");
      const text = document.getElementById("magicText");
      const section = document.querySelector(".scroll-circle-section");
      if (!circle || !text || !section) return;

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      let progress = (vh - rect.top) / (rect.height + vh);
      progress = Math.min(Math.max(progress, 0), 1);

      const lane = Math.floor(progress * 2);
      const laneProgress = (progress * 2) % 1;
      const maxX = window.innerWidth * 0.55;
      const yOffset = lane * 120;
      const x =
        lane === 0 ? laneProgress * maxX : maxX - laneProgress * maxX;
      const rotation = progress * 720;

      circle.style.transform = `translate(${x}px, ${yOffset}px) rotate(${rotation}deg)`;

      const scale = 1 + progress * 1.5;
      text.style.transform = `translate(-50%, -50%) scale(${scale})`;
      text.style.opacity = Math.sin(progress * Math.PI);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-root">

      {/* ================= HERO ================= */}
      {/* <section className="hero" style={{ backgroundImage: `url(${hero})` }}> */}
      <section className="hero hero-premium">
       <div className="landing-navbar">
  <div
    className="landing-brand"
    onClick={() => navigate("/")}
  >
    <div className="landing-logo-box">LG</div>

    <div className="landing-brand-text">
      <div className="landing-brand-title">LifeGuard</div>
      <div className="landing-brand-sub">AI Health Companion</div>
    </div>
  </div>

  <div className="landing-nav-actions">
    <button
      className="landing-nav-btn landing-nav-login"
      onClick={() => navigate("/auth/login")}
    >
      Log In
    </button>
    <button
      className="landing-nav-btn landing-nav-signup"
      onClick={() => navigate("/auth/signup")}
    >
      Get Started
    </button>
  </div>
</div>



        <div className="hero-overlay" />

        <div className="hero-flex">

          {/* LEFT */}
          <div className="hero-content">
            <div className="hero-right-words">
  <span>MONITOR</span>
  <span>PREDICT</span>
  <span>PROTECT</span>
</div>

            

            
            {/* <h1>
              LifeGuardAI - <span className="highlight-orange">Where AI</span> <br />
              meets <span className="highlight-teal">Life protection</span>
            </h1> */}
          {/* <h1 */}
<h1 className="hero-title">
  LifeGuard<span>AI</span> <br />
  <span className="accent-orange">Where AI</span> meets{" "}
  <span className="accent-teal">Life Protection</span>
</h1>



            {/* <p>'LifeGuard AI is a smart health companion that predicts early health risks and keeps users aware with quick assessments and alerts. It makes health tracking simple, engaging, and accessible for everyone.'
               </p> */}
               <p className="hero-sub">
  LifeGuard AI predicts early health risks and keeps users safe
  through real-time monitoring, quick checks, and smart alerts.
</p>


            <div className="hero-buttons" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <button
                className="primary"
                onClick={() => navigate("/auth/signup")}
              >
                Register Free
              </button>
              <button
                className="primary"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#0b2545",
                  border: "2px solid #cbd5e1",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
                onClick={() => navigate("/auth/login")}
              >
                Log In to Account →
              </button>
            </div>
          {/* </div>

          RIGHT MEDICAL ANIMATION */}
          {/* <div className="hero-image-box glass"> */}
            {/* <div className="floating-glow"></div> */}

            {/* <img 
              src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
              className="hero-medical-img"
              alt="medical" 
            /> */}

            {/* <div className="pulse-pill">AI • Monitoring</div>
            <div className="pulse-pill2">Real-Time Safety ✓</div> */}
          </div>
        </div>
      </section>


      {/* ================= FEATURES ================= */}
<section className="features-section reveal">
  <h2 className="features-title">Core Capabilities</h2>

  <div className="features-grid">
    <div className="feature-card">
      <span>🎤</span>
      <h3>Voice-Based Symptoms</h3>
      <p>Users can speak symptoms naturally in their own language.</p>
    </div>

    <div className="feature-card">
      <span>🧠</span>
      <h3>AI Interpretation</h3>
      <p>AI understands patterns instead of relying only on keywords.</p>
    </div>

    <div className="feature-card">
      <span>🔍</span>
      <h3>Explainable Results</h3>
      <p>Users see why the AI reached a specific conclusion.</p>
    </div>
  </div>
</section>


      {/* ================= WHAT WE DO ================= */}
      <section className="what-we-do reveal">
        <p className="small-head">What we do</p>

        <h1 className="main-head" style={{ color: "#0b2545" }}>
  Lifeguard <span style={{ color: "#00c2a8" }}>AI</span>
</h1>

        <p className="desc">
          LifeGuard AI helps users detect health risks early and stay aware through smart monitoring and alerts.
        </p>

        {/* <div className="action-row">
          <button className="explore-btn">Explore Now</button>
          <button className="arrow-btn">➜</button>
        </div> */}

        <div className="auto-scroll-wrapper">
          <div className="auto-scroll-track">
            <img src={"https://www.shutterstock.com/image-vector/online-psychological-help-sad-elderly-600nw-2336077359.jpg"} className="scroll-img" alt="" />
            <img src={"https://img.freepik.com/free-vector/hand-drawn-ai-healthcare-illustration_23-2151180669.jpg?semt=ais_hybrid&w=740&q=80"} className="scroll-img" alt="" />
            <img src={"https://i0.wp.com/3.144.42.188/wp-content/uploads/2020/10/shutterstock_262816118.jpg?resize=640%2C425"} className="scroll-img" alt="" />
            <img src={"https://www.shutterstock.com/image-vector/online-psychological-help-sad-elderly-600nw-2336077359.jpg"} className="scroll-img" alt="" />
            <img src={"https://img.freepik.com/free-vector/hand-drawn-ai-healthcare-illustration_23-2151180669.jpg?semt=ais_hybrid&w=740&q=80"} className="scroll-img" alt="" />
            <img src={"https://i0.wp.com/3.144.42.188/wp-content/uploads/2020/10/shutterstock_262816118.jpg?resize=640%2C425"} className="scroll-img" alt="" />
          </div>
        </div>
      </section>


      {/* ================= WHY ================= */}
      <section className="section reveal">
        <h2>Why LifeGuard AI?</h2>
        <p className="section-text">
          It makes healthcare simple, engaging, and accessible with AI, voice support, and a personalized health dashboard.
        </p>
      </section>


      {/* ================= SCROLL STORY ================= */}
      <section className="scroll-circle-section">
        <div className="scroll-circle-wrapper">
          <div className="scroll-circle" id="magicCircle">➜</div>
          <div className="scroll-word" id="magicText">
            Protect Every Life
          </div>
        </div>
      </section>

      <div className="pulse-ring"></div>

      {/* ================= FOOTER ================= */}
      <footer className="final-footer medical-footer">
        <div className="footer-top">
          <h2>LifeGuard AI</h2>
          <p>Clinical-Grade Safety • Real-Time AI Monitoring</p>
        </div>

        <div className="footer-links-area">
          <div>
            <h4>Solutions</h4>
            <a>Hospitals & Clinics</a>
            <a>Public Swimming Facilities</a>
            <a>Schools & Universities</a>
            <a>Private Pools</a>
          </div>

          <div>
            <h4>Support</h4>
            <a>Emergency Response</a>
            <a>Installation Guide</a>
            <a>Maintenance & Updates</a>
          </div>

          <div>
            <h4>Compliance</h4>
            <a>Privacy & Data Security</a>
            <a>Medical Safety Standards</a>
          </div>
        </div>

        <p className="copy">
          © 2025 LifeGuard AI • Built to Save Lives • Healthcare Safe
        </p>
      </footer>

    </div>
  );
}