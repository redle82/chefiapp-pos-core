/**
 * ChefIApp Desktop — Electron preload script
 *
 * Exposes a minimal bridge so the frontend can detect it's running in Electron
 * and access desktop-specific features (WebUSB permissions are handled by
 * the main process session config).
 *
 * Security: contextIsolation=true, nodeIntegration=false, sandbox=true.
 */

import { contextBridge } from "electron";

/**
 * Minimal bridge exposed as window.electronBridge.
 * The frontend uses this to detect Electron runtime and show desktop-specific UI.
 */
const bridge = {
  isElectron: true as const,
  platform: process.platform,
  version: process.env.npm_package_version ?? "0.0.0",
};

contextBridge.exposeInMainWorld("electronBridge", bridge);

// Legacy detection flag used by ElectronAdminGuard
contextBridge.exposeInMainWorld("__CHEFIAPP_ELECTRON", true);
