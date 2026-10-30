// Quick terminal viewer for LifeGuard MongoDB Database
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });
const mongoose = require("mongoose");

const User = require("./models/User");
const Reminder = require("./models/Reminder");
const MedicalWallet = require("./models/MedicalWallet");
const CommunityPost = require("./models/CommunityPost");
const UserSettings = require("./models/UserSettings");
const QuickCheck = require("./models/QuickCheck");

async function viewDatabase() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lifeguard";
  console.log("\n=======================================================");
  console.log("       LIFEGUARD MONGODB DATABASE INSPECTOR            ");
  console.log("=======================================================");
  console.log(`Connecting to: ${uri}\n`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log("Connected to MongoDB successfully!\n");

    // 1. Users
    const users = await User.find({}, "-password").lean();
    console.log(`👥 USERS (${users.length} found):`);
    if (users.length === 0) {
      console.log("   (No users found)");
    } else {
      users.forEach((u, i) => {
        console.log(`   ${i + 1}. [${u._id}] ${u.name} (${u.email}) - Role: ${u.role || "user"}`);
      });
    }
    console.log("");

    // 2. Reminders
    const reminders = await Reminder.find({}).lean();
    console.log(`⏰ REMINDERS (${reminders.length} found):`);
    if (reminders.length === 0) {
      console.log("   (No reminders found)");
    } else {
      reminders.forEach((r, i) => {
        console.log(`   ${i + 1}. [${r._id}] ${r.title || r.medicineName || "Medicine"} | Time: ${r.time} | User: ${r.userId || r.user || "N/A"}`);
      });
    }
    console.log("");

    // 3. Medical Wallet
    const walletDocs = await MedicalWallet.find({}, "-fileData").lean();
    console.log(`📁 MEDICAL WALLET DOCUMENTS (${walletDocs.length} found):`);
    if (walletDocs.length === 0) {
      console.log("   (No wallet documents found)");
    } else {
      walletDocs.forEach((w, i) => {
        console.log(`   ${i + 1}. [${w._id}] ${w.title || "Doc"} | Category: ${w.category || "General"} | File: ${w.fileName || "N/A"} (${w.fileSize || "N/A"}) | User: ${w.owner || w.userId || "N/A"}`);
      });
    }
    console.log("");

    // 4. Community Posts
    const posts = await CommunityPost.find({}).lean();
    console.log(`💬 COMMUNITY POSTS (${posts.length} found):`);
    if (posts.length === 0) {
      console.log("   (No community posts found)");
    } else {
      posts.forEach((p, i) => {
        const likes = (p.likedBy && p.likedBy.length) || p.likes || 0;
        const comments = (p.comments && p.comments.length) || 0;
        console.log(`   ${i + 1}. [${p._id}] By: ${p.author || "Anonymous"} | "${(p.content || "").substring(0, 50)}..." | 👍 ${likes} likes | 💬 ${comments} comments`);
      });
    }
    console.log("");

    // 5. User Settings
    const settings = await UserSettings.find({}).lean();
    console.log(`⚙️  USER SETTINGS (${settings.length} found):`);
    if (settings.length === 0) {
      console.log("   (No custom settings found)");
    } else {
      settings.forEach((s, i) => {
        console.log(`   ${i + 1}. [${s._id}] User: ${s.userId} | DarkMode: ${s.darkMode} | Lang: ${s.language}`);
      });
    }
    console.log("");

    // 6. Heart Checks
    const heartChecks = await QuickCheck.find({}).lean();
    console.log(`❤️  HEART CHECKS (${heartChecks.length} found):`);
    if (heartChecks.length === 0) {
      console.log("   (No heart checks recorded yet)");
    } else {
      heartChecks.forEach((h, i) => {
        console.log(`   ${i + 1}. [${h._id}] Result: ${h.result} | Date: ${h.createdAt}`);
      });
    }

    console.log("\n=======================================================");
    console.log("MongoDB Compass Connection URI: mongodb://127.0.0.1:27017");
    console.log("Database Name: lifeguard");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("❌ Error viewing database:", err.message);
    console.log("\nTip: Make sure the LifeGuard backend is running (npm run server).");
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

viewDatabase();
