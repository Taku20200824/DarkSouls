// Electron shell for LORDRAN TRACKER: spawns the Next.js standalone server as a
// local-only (127.0.0.1) child process and shows it in a native window. No
// Firebase project or Steam API key is required to install and use the app —
// see src/lib/server/env.ts (isDesktopApp/dataDir/sessionSecret) for the
// zero-config local-storage + session-secret behavior this relies on.
const { app, BrowserWindow, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const http = require("node:http");
const fs = require("node:fs");

let serverProcess = null;
let mainWindow = null;
let currentUrl = null;

function findFreePort(preferred) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", () => resolve(findFreePort(0))); // preferred port busy -> let the OS pick one
    srv.listen(preferred, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error("Server did not start in time"));
        setTimeout(tryOnce, 250);
      });
    };
    tryOnce();
  });
}

function serverEntry() {
  // Packaged app: build/after-pack.cjs places the standalone server under resources/app-server
  // (electron-builder's own extraResources/node_modules collection gets confused by this
  // project's layout, so that hook copies it by hand — see electron-builder.yml). Dev
  // (`npm run electron:dev`): read it straight from .next/standalone, built locally with
  // ELECTRON_BUILD=1.
  return app.isPackaged
    ? path.join(process.resourcesPath, "app-server", "server.js")
    : path.join(__dirname, "..", ".next", "standalone", "server.js");
}

async function startServer() {
  const port = await findFreePort(47831);
  const appUrl = `http://127.0.0.1:${port}`;

  // A double-clicked GUI app has no console, so "inherit" stdio is unreliable (can make
  // the child fail to spawn at all). Log to a file in userData instead, for diagnostics.
  const logFile = path.join(app.getPath("userData"), "server.log");
  const logStream = fs.createWriteStream(logFile, { flags: "a" });
  logStream.write(`\n--- launch ${new Date().toISOString()} (port ${port}) ---\n`);

  serverProcess = spawn(process.execPath, [serverEntry()], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1", // run the bundled Electron binary as plain Node for the server child
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      APP_URL: appUrl,
      LORDRAN_DESKTOP: "1",
      LORDRAN_DATA_DIR: app.getPath("userData"),
      // The real Documents folder, including a OneDrive or other redirect, for save discovery.
      LORDRAN_DOCUMENTS_DIR: app.getPath("documents"),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  serverProcess.stdout.pipe(logStream);
  serverProcess.stderr.pipe(logStream);
  serverProcess.on("exit", (code) => {
    if (code && code !== 0 && mainWindow) {
      mainWindow.webContents.loadURL(
        `data:text/html,${encodeURIComponent(`<body style="background:#050506;color:#e6d19c;font-family:sans-serif;padding:3rem">Server exited unexpectedly (code ${code}). Please restart LORDRAN TRACKER.<br><br><small>Log: ${logFile}</small></body>`)}`,
      );
    }
  });
  await waitForServer(appUrl);
  return appUrl;
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#050506",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Save sync runs from the page and must keep its pace behind the fullscreen game.
      backgroundThrottling: false,
    },
  });

  // Steam sign-in redirects through steamcommunity.com and back to our own
  // localhost callback; everything else external opens in the OS browser
  // instead of inside the app window.
  const allowedHosts = new Set(["127.0.0.1", "localhost", "steamcommunity.com"]);
  mainWindow.webContents.on("will-navigate", (event, target) => {
    const host = new URL(target).hostname;
    if (!allowedHosts.has(host)) {
      event.preventDefault();
      shell.openExternal(target);
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.loadURL(url);
}

// Checks the public Blob store (electron-builder.yml "publish") for a newer version, asks
// before downloading anything, and only restarts to install once the user agrees again.
// Silent about anything short of an actual update — no releases yet, no network, etc. are
// not errors worth interrupting someone over.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

function setUpAutoUpdate() {
  autoUpdater.on("update-available", async (info) => {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "LORDRAN TRACKER",
      message: `Шинэ хувилбар бэлэн байна: v${info.version}`,
      detail: "Татаж аваад шинэчлэх үү?",
      buttons: ["Шинэчлэх", "Дараа нь"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.downloadUpdate();
  });

  autoUpdater.on("update-downloaded", async () => {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "LORDRAN TRACKER",
      message: "Шинэчлэл татагдлаа. Апп-ыг дахин эхлүүлж суулгах уу?",
      buttons: ["Одоо дахин эхлүүлэх", "Дараа нь"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on("error", (err) => {
    const logFile = path.join(app.getPath("userData"), "server.log");
    fs.appendFileSync(logFile, `\n--- auto-update error ${new Date().toISOString()} ---\n${err.stack ?? err}\n`);
  });

  if (app.isPackaged) autoUpdater.checkForUpdates().catch(() => {});
}

// Two instances would run two servers over one local data file, each overwriting the other.
if (!app.requestSingleInstanceLock()) app.quit();

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  if (!app.hasSingleInstanceLock()) return;
  try {
    currentUrl = await startServer();
    createWindow(currentUrl);
    setUpAutoUpdate();
  } catch (err) {
    console.error(err);
    const logFile = path.join(app.getPath("userData"), "server.log");
    dialog.showErrorBox("LORDRAN TRACKER", `Could not start the local server.\n\n${err.message}\n\nLog: ${logFile}`);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && currentUrl) createWindow(currentUrl);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
