const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Reminder = require("../models/Reminder");
const MedicalWallet = require("../models/MedicalWallet");
const CommunityPost = require("../models/CommunityPost");
const UserSettings = require("../models/UserSettings");
const QuickCheck = require("../models/QuickCheck");

// JSON API
router.get("/json", async (req, res) => {
  try {
    const [users, reminders, wallet, posts, settings, quickChecks] = await Promise.all([
      User.find({}, "-password").sort({ createdAt: -1 }).lean(),
      Reminder.find({}).sort({ createdAt: -1 }).lean(),
      MedicalWallet.find({}, "-fileData").sort({ createdAt: -1 }).lean(),
      CommunityPost.find({}).sort({ createdAt: -1 }).lean(),
      UserSettings.find({}).sort({ updatedAt: -1 }).lean(),
      QuickCheck.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      database: "lifeguard",
      counts: {
        users: users.length,
        reminders: reminders.length,
        medicalWallet: wallet.length,
        communityPosts: posts.length,
        userSettings: settings.length,
        heartChecks: quickChecks.length,
      },
      data: {
        users,
        reminders,
        medicalWallet: wallet,
        communityPosts: posts,
        userSettings: settings,
        heartChecks: quickChecks,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HTML Visual Database Inspector
router.get("/", async (req, res) => {
  try {
    const [users, reminders, wallet, posts, settings, quickChecks] = await Promise.all([
      User.find({}, "-password").sort({ createdAt: -1 }).lean(),
      Reminder.find({}).sort({ createdAt: -1 }).lean(),
      MedicalWallet.find({}, "-fileData").sort({ createdAt: -1 }).lean(),
      CommunityPost.find({}).sort({ createdAt: -1 }).lean(),
      UserSettings.find({}).sort({ updatedAt: -1 }).lean(),
      QuickCheck.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    const isAtlas = (process.env.MONGO_URI || "").includes("mongodb+srv");
    const dbTypeLabel = isAtlas ? "MongoDB Atlas Cloud" : "Local Persistent WiredTiger";
    const dbUriDisplay = isAtlas ? "MongoDB Atlas (Cluster0)" : "mongodb://127.0.0.1:27017";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>LifeGuard MongoDB Inspector</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background: #0f172a; color: #e2e8f0; padding: 24px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #334155; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .title-box h1 { font-size: 24px; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
        .badge { background: #0284c7; color: white; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .uri-banner { background: #1e293b; border: 1px solid #38bdf8; border-radius: 8px; padding: 12px 18px; margin-bottom: 24px; font-family: monospace; font-size: 13px; color: #7dd3fc; display: flex; justify-content: space-between; align-items: center; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; text-align: center; }
        .stat-card .num { font-size: 28px; font-weight: 700; color: #38bdf8; }
        .stat-card .label { font-size: 13px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
        .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid #334155; overflow-x: auto; padding-bottom: 8px; }
        .tab-btn { background: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap; }
        .tab-btn.active { background: #0284c7; color: white; border-color: #38bdf8; }
        .tab-content { display: none; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; overflow-x: auto; }
        .tab-content.active { display: block; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
        th { background: #0f172a; color: #94a3b8; padding: 12px; border-bottom: 1px solid #334155; }
        td { padding: 12px; border-bottom: 1px solid #334155; vertical-align: top; }
        tr:hover td { background: #24324a; }
        .id-pill { font-family: monospace; font-size: 11px; background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #94a3b8; }
        .empty-msg { text-align: center; padding: 40px; color: #64748b; font-style: italic; }
        .refresh-btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .link-btn { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title-box">
            <h1>🍃 LifeGuard MongoDB Inspector</h1>
            <span class="badge">${dbTypeLabel}</span>
          </div>
          <div style="display: flex; gap: 10px;">
            <a href="http://localhost:3000/app/quick" target="_blank" class="link-btn">❤️ Open Heart Check</a>
            <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Data</button>
          </div>
        </div>

        <div class="uri-banner">
          <div>
            <strong>Database Target:</strong> <code>${dbUriDisplay}</code> &nbsp;|&nbsp; <strong>Database:</strong> <code>lifeguard</code>
          </div>
          <span style="color: #10b981;">● Online & Synchronized</span>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="num">${users.length}</div>
            <div class="label">Users</div>
          </div>
          <div class="stat-card">
            <div class="num">${quickChecks.length}</div>
            <div class="label">Heart Checks</div>
          </div>
          <div class="stat-card">
            <div class="num">${reminders.length}</div>
            <div class="label">Reminders</div>
          </div>
          <div class="stat-card">
            <div class="num">${wallet.length}</div>
            <div class="label">Wallet Files</div>
          </div>
          <div class="stat-card">
            <div class="num">${posts.length}</div>
            <div class="label">Community Posts</div>
          </div>
          <div class="stat-card">
            <div class="num">${settings.length}</div>
            <div class="label">Settings Records</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn active" onclick="showTab('heartchecks')">🎙️ Voice Triage & Checks (${quickChecks.length})</button>
          <button class="tab-btn" onclick="showTab('users')">👥 Users (${users.length})</button>
          <button class="tab-btn" onclick="showTab('reminders')">⏰ Reminders (${reminders.length})</button>
          <button class="tab-btn" onclick="showTab('wallet')">📁 Medical Wallet (${wallet.length})</button>
          <button class="tab-btn" onclick="showTab('community')">💬 Community (${posts.length})</button>
          <button class="tab-btn" onclick="showTab('settings')">⚙️ Settings (${settings.length})</button>
        </div>

        <!-- VOICE TRIAGE & CHECKS TAB -->
        <div id="tab-heartchecks" class="tab-content active">
          ${quickChecks.length === 0 ? '<div class="empty-msg">No triage records saved yet. Perform a check at http://localhost:3000/app/quick and click "Save to Medical Wallet & Records"!</div>' : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Symptoms / Speech</th>
                <th>Triage Urgency & System</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${quickChecks.map(qc => {
                let badgeHtml = qc.result || '-';
                try {
                  if (typeof qc.result === 'string' && qc.result.startsWith('{')) {
                    const parsed = JSON.parse(qc.result);
                    const color = parsed.level === 'EMERGENCY' ? '#ef4444' : parsed.level === 'URGENT_CLINIC' ? '#f59e0b' : '#10b981';
                    badgeHtml = `<span style="display:inline-block; padding:4px 10px; border-radius:8px; font-weight:700; color:${color}; border:1px solid ${color}40; background:${color}15;">${parsed.badge || parsed.level}</span> <span style="font-size:12px; color:#64748b; margin-left:6px;">${parsed.system || ''}</span>`;
                  }
                } catch(e) {}
                return `
                <tr>
                  <td><span class="id-pill">${qc._id}</span></td>
                  <td><span class="id-pill">${qc.userId || qc.owner || 'N/A'}</span></td>
                  <td style="max-width: 340px;">${Array.isArray(qc.symptoms) ? qc.symptoms.join(', ') : (qc.symptoms || '-')}</td>
                  <td>${badgeHtml}</td>
                  <td>${qc.createdAt ? new Date(qc.createdAt).toLocaleString() : 'N/A'}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
          `}
        </div>

        <!-- USERS TAB -->
        <div id="tab-users" class="tab-content">
          ${users.length === 0 ? '<div class="empty-msg">No registered users found.</div>' : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><span class="id-pill">${u._id}</span></td>
                  <td><strong>${u.name || '-'}</strong></td>
                  <td>${u.email || '-'}</td>
                  <td>${u.role || 'user'}</td>
                  <td>${u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          `}
        </div>

        <!-- REMINDERS TAB -->
        <div id="tab-reminders" class="tab-content">
          ${reminders.length === 0 ? '<div class="empty-msg">No reminders scheduled yet. Add one in the Reminders page!</div>' : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Medicine / Title</th>
                <th>Dosage</th>
                <th>Time</th>
                <th>User ID</th>
                <th>Voice / Ringtone</th>
              </tr>
            </thead>
            <tbody>
              ${reminders.map(r => `
                <tr>
                  <td><span class="id-pill">${r._id}</span></td>
                  <td><strong>${r.title || r.medicineName || 'Medicine'}</strong></td>
                  <td>${r.dosage || '-'}</td>
                  <td><code>${r.time || '-'}</code></td>
                  <td><span class="id-pill">${r.userId || r.user || 'N/A'}</span></td>
                  <td>${r.voiceEnabled !== false ? '🔊 Enabled' : 'Muted'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          `}
        </div>

        <!-- WALLET TAB -->
        <div id="tab-wallet" class="tab-content">
          ${wallet.length === 0 ? '<div class="empty-msg">No medical wallet files stored yet. Upload prescriptions or reports in Wallet!</div>' : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Owner ID</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              ${wallet.map(w => `
                <tr>
                  <td><span class="id-pill">${w._id}</span></td>
                  <td><strong>${w.title || '-'}</strong></td>
                  <td><span class="badge">${w.category || 'General'}</span></td>
                  <td>📄 ${w.fileName || 'document'}</td>
                  <td>${w.fileSize || '-'}</td>
                  <td><span class="id-pill">${w.owner || w.userId || 'N/A'}</span></td>
                  <td>${w.createdAt ? new Date(w.createdAt).toLocaleString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          `}
        </div>

        <!-- COMMUNITY TAB -->
        <div id="tab-community" class="tab-content">
          ${posts.length === 0 ? '<div class="empty-msg">No community posts yet. Create a post in the Community tab!</div>' : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Author</th>
                <th>Content</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${posts.map(p => `
                <tr>
                  <td><span class="id-pill">${p._id}</span></td>
                  <td><strong>${p.author || 'Anonymous'}</strong></td>
                  <td style="max-width: 400px;">${(p.content || '').replace(/</g, '&lt;')}</td>
                  <td>❤️ ${(p.likedBy && p.likedBy.length) || p.likes || 0}</td>
                  <td>💬 ${(p.comments && p.comments.length) || 0}</td>
                  <td>${p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          `}
        </div>

        <!-- SETTINGS TAB -->
        <div id="tab-settings" class="tab-content">
          ${settings.length === 0 ? '<div class="empty-msg">No settings records saved yet. Save preferences in Settings!</div>' : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Dark Mode</th>
                <th>Language</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              ${settings.map(s => `
                <tr>
                  <td><span class="id-pill">${s._id}</span></td>
                  <td><span class="id-pill">${s.userId || '-'}</span></td>
                  <td>${s.darkMode ? '🌙 Dark' : '☀️ Light'}</td>
                  <td>${s.language || 'en'}</td>
                  <td>${s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          `}
        </div>

      </div>

      <script>
        function showTab(name) {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          if (event && event.target) {
            event.target.classList.add('active');
          }
          const el = document.getElementById('tab-' + name);
          if (el) el.classList.add('active');
        }
      </script>
    </body>
    </html>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send(`<h3>Error loading MongoDB Inspector:</h3><p>${err.message}</p>`);
  }
});

module.exports = router;
