const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const http = require("http");

let mainWindow = null;
let serverStarted = false;

function checkServer(port, callback) {
  const req = http.get(`http://localhost:${port}/api/health`, (res) => {
    if (res.statusCode === 200) callback(true);
    else callback(false);




    
  });
  req.on("error", () => callback(false));
  req.setTimeout(800, () => {
    req.abort();
    callback(false);
  });
}

function startBackendServer() {
  if (serverStarted) return;
  serverStarted = true;
  try {
    console.log("🚀 Starting LifeGuard backend server inside Electron...");
    require("./backend/server.js");
  } catch (err) {
    console.error("Failed to start backend server:", err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    title: "LifeGuard — AI Clinical Health Companion",
    icon: path.join(__dirname, "public", "icon-512.png"),
    backgroundColor: "#071424",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  startBackendServer();

  const targetUrl = "http://localhost:5000";
  let attempts = 0;

  const tryLoad = () => {
    checkServer(5000, (ready) => {
      if (ready || attempts > 25) {
        mainWindow.loadURL(targetUrl);
        mainWindow.once("ready-to-show", () => {
          mainWindow.show();
        });
      } else {
        attempts++;
        setTimeout(tryLoad, 300);
      }
    });
  };

  tryLoad();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
