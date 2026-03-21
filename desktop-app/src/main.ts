/**
 * ChefIApp Desktop — Electron main process
 *
 * Thin shell that loads chefiapp.com directly.
 * Electron is just a container providing: WebUSB for printers, fullscreen, kiosk mode.
 * All logic, auth, and assets are served by Vercel CDN.
 */

import { app, BrowserWindow, session } from "electron";
import path from "node:path";

// ─── Constants ──────────────────────────────────────────────────────────

const PRODUCTION_URL = "https://chefiapp.com/op/tpv";
const DEV_URL = process.env.CHEFIAPP_DEV_URL?.trim() || "http://localhost:5177/op/tpv";
const IS_DEV = process.env.NODE_ENV === "development" || !app.isPackaged;

// Allowed hostnames for navigation (security: prevent hijacking)
const ALLOWED_HOSTS = [
  "chefiapp.com",
  "localhost",
  "supabase.co",
  "stripe.com",
  "accounts.google.com",
  "appleid.apple.com",
];

// ─── Single instance lock ───────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ─── Window ─────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: "ChefIApp POS",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    backgroundColor: "#0a0a0a",
  });

  // Load the web app
  const url = IS_DEV ? DEV_URL : PRODUCTION_URL;
  mainWindow.loadURL(url);

  // Open DevTools in development
  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  // ─── Permissions: WebUSB for receipt printers ───────────────────────

  session.defaultSession.setPermissionCheckHandler((_webContents, _permission) => true);
  session.defaultSession.setDevicePermissionHandler(() => true);

  // ─── Keyboard shortcuts ─────────────────────────────────────────────

  mainWindow.webContents.on("before-input-event", (_event, input) => {
    if (!mainWindow) return;
    if (input.key === "F11") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // ─── Navigation guard ───────────────────────────────────────────────

  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    try {
      const parsed = new URL(navigationUrl);
      const isAllowed = ALLOWED_HOSTS.some((host) => parsed.hostname.includes(host));
      if (!isAllowed) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // Prevent new windows (open in-app instead)
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    try {
      const parsed = new URL(targetUrl);
      const isAllowed = ALLOWED_HOSTS.some((host) => parsed.hostname.includes(host));
      if (isAllowed && mainWindow) {
        mainWindow.loadURL(targetUrl);
      }
    } catch {
      // ignore malformed URLs
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ──────────────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
