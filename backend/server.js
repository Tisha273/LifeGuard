const path = require("path");
// Load backend/.env specifically
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* ================= ROUTES ================= */
const userRoutes = require("./routes/userRoutes");
const communityRoutes = require("./routes/communityRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const medicalWalletRoutes = require("./routes/medicalWalletRoutes");
const quickCheckRoutes = require("./routes/quickCheckRoutes");
const triageRoutes = require("./routes/triageRoutes");
const scannerRoutes = require("./routes/scannerRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const aiCheckRoutes = require("./routes/aiCheck");
const heartPredictionRoutes = require("./routes/heartPredictionRoutes");
const dbViewRoute = require("./routes/dbViewRoute");

app.use("/api/users", userRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/medical-wallet", medicalWalletRoutes);
app.use("/api/quick-check", quickCheckRoutes);
app.use("/api/triage", triageRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api", aiCheckRoutes);
app.use("/api/heart-prediction", heartPredictionRoutes);
app.use("/api/db-view", dbViewRoute);

/* ================= HEALTH ROUTE ================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "LifeGuard Backend",
    dbConnected: mongoose.connection.readyState === 1,
    time: new Date().toISOString(),
  });
});

/* ================= SERVE FRONTEND (PRODUCTION / CLOUD) ================= */
const fs = require("fs");
const buildPath = path.join(__dirname, "../build");

if (fs.existsSync(buildPath)) {
  console.log("📦 Serving compiled React PWA from:", buildPath);
  app.use(express.static(buildPath));

  // Express 5 compatible SPA fallback
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(buildPath, "index.html"));
    }
    next();
  });
} else {
  /* ================= TEST ROUTE ================= */
  app.get("/", (req, res) => {
    res.send("🚀 Lifeguard Backend Running Successfully (Run 'npm run build' to serve the React PWA)");
  });
}

/* ================= DEMO USER SEEDER ================= */
async function seedDemoUser() {
  try {
    const existingDemo = await User.findOne({
      $or: [{ email: "demo@lifeguard.com" }, { name: "demo" }],
    });

    if (!existingDemo) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await User.create({
        name: "demo",
        email: "demo@lifeguard.com",
        password: hashedPassword,
        role: "user",
        settings: {
          gender: "Not specified",
          avatar: "",
          darkMode: false,
          accent: "teal",
          notifications: { email: true, alerts: true },
          aiConsent: true,
        },
      });
      console.log("🌱 Demo account seeded:");
      console.log("   📧 Email: demo@lifeguard.com");
      console.log("   👤 Username: demo");
      console.log("   🔑 Password: password123");
    }
  } catch (err) {
    console.warn("⚠️ Demo user seeding note:", err.message);
  }
}

/* ================= MONGODB CONNECTION ================= */
let memoryServer = null;

async function connectDB() {
  const customMongoUri = process.env.MONGO_URI;

  if (customMongoUri && customMongoUri.trim() !== "") {
    try {
      console.log("🔄 Connecting to configured MongoDB URI...");
      await mongoose.connect(customMongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("☁️ MongoDB Atlas / Custom DB Connected Successfully");
      await seedDemoUser();
      return;
    } catch (err) {
      console.warn("⚠️ Could not connect to configured MONGO_URI:", err.message);
      console.log("🔄 Starting embedded development MongoDB database instead...");
    }
  }

  // Automatic Embedded Development Database (Persistent to disk)
  try {
    const fs = require("fs");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    console.log("🚀 Starting embedded development MongoDB instance...");
    if (memoryServer) {
      try {
        await memoryServer.stop();
      } catch (e) {}
      memoryServer = null;
    }

    const dbDir = path.join(__dirname, ".mongo_data");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const preferredPort = process.env.MONGO_PORT ? parseInt(process.env.MONGO_PORT, 10) : 27017;
    const serverOptions = {
      binary: {
        downloadDir: path.join(__dirname, "node_modules", ".cache", "mongodb-memory-server"),
      },
      instance: {
        dbPath: dbDir,
        storageEngine: "wiredTiger",
        dbName: "lifeguard",
        port: preferredPort,
      },
    };

    try {
      memoryServer = await MongoMemoryServer.create(serverOptions);
    } catch (portErr) {
      console.warn(`⚠️ Port ${preferredPort} was busy or unavailable (${portErr.message}). Retrying on dynamic port...`);
      delete serverOptions.instance.port;
      memoryServer = await MongoMemoryServer.create(serverOptions);
    }

    const uri = memoryServer.getUri("lifeguard");
    await mongoose.connect(uri);
    console.log("=================================================================");
    console.log("💾 MongoDB Connected (Saved persistently on disk):", uri);
    console.log("🧭 Open in MongoDB Compass: " + uri.replace("/lifeguard", ""));
    console.log("🌐 Visual Web Inspector:   http://localhost:" + (process.env.PORT || 5000) + "/api/db-view");
    console.log("💻 Terminal DB Inspector:  npm run db:view");
    console.log("☁️ (To use cloud MongoDB Atlas, add MONGO_URI in backend/.env)");
    console.log("=================================================================");
    await seedDemoUser();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
}

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
  });

  const cleanup = async (callback) => {
    console.log("\n🛑 Shutting down server gracefully...");
    try {
      await mongoose.disconnect();
    } catch (e) {}
    if (memoryServer) {
      try {
        await memoryServer.stop();
      } catch (e) {}
      memoryServer = null;
    }
    server.close(() => {
      if (typeof callback === "function") callback();
      else process.exit(0);
    });
  };

  process.on("SIGINT", () => cleanup());
  process.on("SIGTERM", () => cleanup());
  process.once("SIGUSR2", () => {
    cleanup(() => {
      process.kill(process.pid, "SIGUSR2");
    });
  });
});

module.exports = app;
