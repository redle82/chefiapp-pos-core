/**
 * ChefIApp Desktop — Electron preload script
 *
 * Exposes a minimal bridge to the renderer via contextBridge.
 * The merchant-portal frontend accesses this via `window.electronBridge`.
 *
 * Security: contextIsolation=true, nodeIntegration=false, sandbox=true.
 * Only IPC invoke calls are exposed — no direct Node.js access.
 */

import { contextBridge, ipcRenderer } from "electron";

export interface TerminalConfig {
  terminalId: string;
  restaurantId: string;
  terminalType: "TPV" | "KDS";
  terminalName: string;
  pairedAt: string;
}

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  isElectron: true;
  isDev: boolean;
}

export interface DesktopPrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
}

export interface DesktopDiagnosticsStatus {
  terminal: TerminalConfig | null;
  diagnostics: {
    lastDeepLink?: {
      nonce: string | null;
      moduleId: "tpv" | "kds";
      receivedAt: string;
    };
    lastAck?: {
      nonce: string;
      moduleId: "tpv" | "kds";
      sentAt: string;
      success: boolean;
    };
    lastHeartbeatAt?: string;
  };
  appVersion: string;
  isPackaged: boolean;
}

export interface ElectronBridge {
  getTerminalConfig: () => Promise<TerminalConfig | null>;
  setTerminalConfig: (config: TerminalConfig) => Promise<void>;
  clearTerminalConfig: () => Promise<void>;
  getAppInfo: () => Promise<AppInfo>;
  getPrinters: () => Promise<DesktopPrinterInfo[]>;
  navigateToApp: (app: "tpv" | "kds") => Promise<void>;
  closeApp: () => void;
  printLabel: (payload: {
    html: string;
    printerTarget?: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  getDiagnostics: () => Promise<DesktopDiagnosticsStatus>;
  openKDSPanel: (options: {
    presetId?: "kitchen" | "bar" | "late" | "delivery";
    duplicateFromPanelId?: string;
    targetDisplayId?: number | "current";
    alwaysOnTop?: boolean;
  }) => Promise<void>;
  setWindowTitle: (title: string) => Promise<void>;
}

const bridge: ElectronBridge = {
  getTerminalConfig: () => ipcRenderer.invoke("get-terminal-config"),
  setTerminalConfig: (config) =>
    ipcRenderer.invoke("set-terminal-config", config),
  clearTerminalConfig: () => ipcRenderer.invoke("clear-terminal-config"),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  navigateToApp: (app) => ipcRenderer.invoke("navigate-to-app", app),
  closeApp: () => {
    ipcRenderer.send("close-app");
  },
  printLabel: (payload) => ipcRenderer.invoke("print-label-html", payload),
  getDiagnostics: () => ipcRenderer.invoke("get-diagnostics"),
  openKDSPanel: (options) => ipcRenderer.invoke("open-kds-panel", options),
  setWindowTitle: (title) => ipcRenderer.invoke("set-window-title", title),
};

contextBridge.exposeInMainWorld("electronBridge", bridge);
// Sinal inequívoco para isolamento Admin: frontend sabe que está em Electron (preload corre antes do bundle).
contextBridge.exposeInMainWorld("__CHEFIAPP_ELECTRON", true);
