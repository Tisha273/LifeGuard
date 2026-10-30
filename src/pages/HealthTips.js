import React from "react";

export default function HealthTips() {
  return (
    <div>
      <h2>💡 Detailed Health Tips</h2>
      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Hydration Matters 💧</h3>
        <p>
          Staying hydrated keeps your energy up and supports digestion, 
          skin health, and immune function. Try carrying a reusable water 
          bottle to remind yourself to drink regularly.
        </p>
        <h3 style={{ marginTop: "15px" }}>Balanced Diet 🥦</h3>
        <p>
          Eat a mix of fruits, vegetables, and proteins daily. Avoid skipping 
          breakfast — it's your energy starter!
        </p>
        <h3 style={{ marginTop: "15px" }}>Daily Movement 🏃‍♀</h3>
        <p>
          Aim for at least 30 minutes of light exercise — walking, yoga, or stretching 
          can make a huge difference.
        </p>
      </div>
    </div>
  );
}