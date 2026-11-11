// Electron shell for LORDRAN TRACKER: spawns the Next.js standalone server as a
// local-only (127.0.0.1) child process and shows it in a native window. No
// Firebase project or Steam API key is required to install and use the app —
// see src/lib/server/env.ts (isDesktopApp/dataDir/sessionSecret) for the
// zero-config local-storage + session-secret behavior this relies on.
const { app, BrowserWindow, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { spawn, execFileSync } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const http = require("node:http");
const fs = require("node:fs");

let serverProcess = null;
let mainWindow = null;
let currentUrl = null;
let titleLabel = null; // update-progress text kept in the window title over the page's own <title>
let stoppingServer = false;

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
      // Microsoft Store (MSIX) install: the Store delivers updates, so the UI says so.
      LORDRAN_STORE: process.windowsStore ? "1" : "",
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
    if (stoppingServer) return; // we killed it on purpose (quit / install update)
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

  mainWindow.webContents.on("did-finish-load", drawBanner);
  mainWindow.on("page-title-updated", (event) => {
    if (!titleLabel) return;
    event.preventDefault();
    mainWindow.setTitle(`${BASE_TITLE} — ${titleLabel}`);
  });

  mainWindow.loadURL(url);
}

// Checks the public Blob store (electron-builder.yml "publish") for a newer version, asks
// before downloading anything, and only restarts to install once the user agrees again.
// Silent about anything short of an actual update — no releases yet, no network, etc. are
// not errors worth interrupting someone over.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

const BASE_TITLE = "LORDRAN TRACKER";

let bannerState = null; // { pct, text, tone } — re-drawn after page reloads

/** In-page progress bar pinned to the bottom of the window (runs in the page, no Node access). */
function drawBanner() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const state = JSON.stringify(bannerState);
  mainWindow.webContents.executeJavaScript(`(() => {
    const s = ${state};
    let el = document.getElementById("lt-update-banner");
    if (!s) { el && el.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "lt-update-banner";
      el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;width:min(460px,calc(100vw - 32px));padding:12px 16px;border:1px solid rgba(255,145,66,.55);border-radius:6px;background:rgba(11,10,13,.96);box-shadow:0 12px 40px rgba(0,0,0,.8);font:13px/1.4 system-ui,sans-serif;color:#edd5a1;pointer-events:none";
      el.innerHTML = '<div data-t style="display:flex;justify-content:space-between;gap:12px"></div><div style="margin-top:8px;height:6px;border-radius:3px;background:#2a2520;overflow:hidden"><div data-b style="height:100%;width:0;background:linear-gradient(90deg,#c2410c,#f59e0b);transition:width .3s"></div></div>';
      document.body.appendChild(el);
    }
    el.style.borderColor = s.tone === "error" ? "rgba(238,109,96,.7)" : "rgba(255,145,66,.55)";
    el.querySelector("[data-t]").textContent = s.text;
    el.querySelector("[data-b]").style.width = Math.round(s.pct * 100) + "%";
  })()`).catch(() => {});
}

function setProgress(fraction, label, tone) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setProgressBar(fraction); // taskbar bar; -1 removes it
  titleLabel = label ?? null;
  if (label) mainWindow.setTitle(`${BASE_TITLE} — ${label}`);
  else mainWindow.setTitle(mainWindow.webContents.getTitle() || BASE_TITLE);
  bannerState = label ? { pct: Math.max(0, fraction), text: label, tone } : null;
  drawBanner();
}

/**
 * The local server is the same "Lordran Tracker.exe" binary (ELECTRON_RUN_AS_NODE), and
 * the NSIS installer refuses to run while any process of that name is alive ("Lordran
 * Tracker could not be closed"). A plain kill() returns before the process is gone, so
 * kill the whole tree synchronously and only then hand over to the installer.
 */
function stopServerSync() {
  const proc = serverProcess;
  serverProcess = null;
  stoppingServer = true;
  if (!proc || proc.exitCode !== null || !proc.pid) return;
  try {
    if (process.platform === "win32") execFileSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    else proc.kill("SIGKILL");
  } catch {
    // Already gone.
  }
}

function setUpAutoUpdate() {
  let downloading = false;
  let targetVersion = "";

  autoUpdater.on("update-available", async (info) => {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: BASE_TITLE,
      message: `Шинэ хувилбар бэлэн байна: v${info.version}`,
      detail: "Татаж аваад шинэчлэх үү? Татаж байх үед app-ийг ашиглаж болно — явцыг цонхны доод хэсэгт харуулна.",
      buttons: ["Шинэчлэх", "Дараа нь"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response !== 0) return;
    downloading = true;
    setProgress(0, `v${info.version} татаж байна… 0%`);
    targetVersion = info.version;
    autoUpdater.downloadUpdate().catch(() => {}); // failures arrive via the "error" event
  });

  autoUpdater.on("download-progress", (p) => {
    const pct = Math.max(0, Math.min(100, p.percent || 0));
    const mb = (n) => (n / 1048576).toFixed(0);
    setProgress(pct / 100, `v${targetVersion} татаж байна… ${Math.floor(pct)}% (${mb(p.transferred)} / ${mb(p.total)} MB)`);
  });

  autoUpdater.on("update-downloaded", async () => {
    downloading = false;
    setProgress(1, `v${targetVersion} татагдлаа — суулгахад бэлэн`);
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: BASE_TITLE,
      message: "Шинэчлэл татагдлаа. Апп-ыг дахин эхлүүлж суулгах уу?",
      buttons: ["Одоо дахин эхлүүлэх", "Дараа нь"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response !== 0) { setProgress(-1); return; }
    setProgress(1, "Суулгаж байна… app автоматаар дахин нээгдэнэ");
    stopServerSync();
    // isSilent=false keeps the installer's own progress window; isForceRunAfter relaunches the app.
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
  });

  autoUpdater.on("error", (err) => {
    const logFile = path.join(app.getPath("userData"), "server.log");
    fs.appendFileSync(logFile, `\n--- auto-update error ${new Date().toISOString()} ---\n${err.stack ?? err}\n`);
    // Only interrupt for a download the user asked for; a failed background check stays silent.
    if (!downloading) return;
    downloading = false;
    setProgress(-1);
    dialog.showMessageBox(mainWindow, {
      type: "error",
      title: BASE_TITLE,
      message: "Шинэчлэл татаж чадсангүй.",
      detail: `Интернэт холболтоо шалгаад app-ийг дахин нээнэ үү, эсвэл сайтаас шинэ хувилбарыг татаж суулгана уу.\n\n${err.message ?? err}`,
    });
  });

  // Store installs update through the Microsoft Store; a GitHub installer would replace the
  // package with a separate NSIS install, so never self-update there.
  if (app.isPackaged && !process.windowsStore) autoUpdater.checkForUpdates().catch(() => {});
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

app.on("before-quit", stopServerSync);
