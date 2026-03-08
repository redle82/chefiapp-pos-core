/**
 * ChefIApp Desktop — Electron main process
 *
 * Thin shell that loads the merchant-portal frontend.
 * Handles: single instance lock, protocol handler (chefiapp-pos://),
 * pairing state persistence, window management.
 *
 * Ref: docs/architecture/DESKTOP_DISTRIBUTION_CONTRACT.md
 * Regra: "Electron é shell; a lógica continua no frontend e no Core."
 */

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  shell,
} from "electron";
import log from "electron-log/main";
import Store from "electron-store";
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

// ─── Constants ──────────────────────────────────────────────────────────

const APP_NAME = "ChefIApp Desktop";
const PROTOCOL_SCHEME = "chefiapp-pos";
const LEGACY_PROTOCOL_SCHEME = "chefiapp";
const SUPPORTED_PROTOCOL_SCHEMES = [PROTOCOL_SCHEME, LEGACY_PROTOCOL_SCHEME];

function hasSupportedProtocolPrefix(value: string): boolean {
  return SUPPORTED_PROTOCOL_SCHEMES.some((scheme) =>
    value.startsWith(`${scheme}://`),
  );
}

function isSupportedProtocol(protocolWithColon: string): boolean {
  return SUPPORTED_PROTOCOL_SCHEMES.some(
    (scheme) => protocolWithColon === `${scheme}:`,
  );
}
const DEV_SERVER_URL =
  process.env.CHEFIAPP_DEV_SERVER_URL?.trim() || "http://localhost:5175";
const CORE_RPC_BASE =
  process.env.CHEFIAPP_CORE_RPC_BASE ?? "http://localhost:3001/rest/v1/rpc";
const DESKTOP_LAUNCH_ACK_BASE =
  process.env.CHEFIAPP_DESKTOP_LAUNCH_ACK_BASE?.trim() ||
  "http://localhost:4320/desktop/launch-acks";
const DESKTOP_LAUNCH_ACK_SECRET =
  process.env.CHEFIAPP_DESKTOP_LAUNCH_ACK_SECRET?.trim() || "";
const DESKTOP_LAUNCH_ACK_TIMEOUT_MS = 5_000;
const DESKTOP_HEARTBEAT_INTERVAL_MS = 30_000;
const PRINT_WORKER_INTERVAL_MS = 4000;
const PRINT_MAX_ATTEMPTS = 3;
const IS_DEV = process.env.ELECTRON_DEV === "true" || !app.isPackaged;
const ALLOW_MULTI_INSTANCE = process.env.CHEFIAPP_ALLOW_MULTI_INSTANCE === "1";
const DESKTOP_BRIDGE_PORT = Number(
  process.env.CHEFIAPP_DESKTOP_BRIDGE_PORT ?? "4310",
);

/**
 * Path to the bundled frontend in production builds.
 */
const FRONTEND_INDEX_PATH = path.join(
  app.getAppPath(),
  "resources",
  "frontend",
  "index.html",
);
const HAS_BUNDLED_FRONTEND = !IS_DEV && existsSync(FRONTEND_INDEX_PATH);

/**
 * True only in development. Packaged builds must always use bundled frontend.
 */
const USE_DEV_SERVER = IS_DEV;

// Prevent Chrome's IPC flooding protection from throttling history.pushState/
// replaceState inside the renderer. Without this, React Router + Sentry +
// StrictMode can trigger "Throttling navigation to prevent the browser from
// hanging" which freezes the UI. Safe in Electron — the protection exists for
// multi-tab browsers, not single-window desktop shells.
app.commandLine.appendSwitch("disable-ipc-flooding-protection");

/** Minimum window dimensions per DESKTOP_DISTRIBUTION_CONTRACT */
const TPV_WINDOW = {
  kind: "tpv" as const,
  width: 1280,
  height: 800,
  minWidth: 1024,
  minHeight: 600,
};
const KDS_WINDOW = {
  kind: "kds" as const,
  width: 1600,
  height: 900,
  minWidth: 1200,
  minHeight: 700,
};

// ─── Persistent Store ───────────────────────────────────────────────────

interface TerminalConfig {
  terminalId: string;
  restaurantId: string;
  terminalType: "TPV" | "KDS";
  terminalName: string;
  pairedAt: string;
}

interface DesktopLaunchDeepLinkInfo {
  nonce: string | null;
  moduleId: OperationalModule;
  receivedAt: string;
}

interface DesktopLaunchAckInfo {
  nonce: string;
  moduleId: OperationalModule;
  sentAt: string;
  success: boolean;
}

interface DesktopDiagnostics {
  lastDeepLink?: DesktopLaunchDeepLinkInfo;
  lastAck?: DesktopLaunchAckInfo;
  lastHeartbeatAt?: string;
}

interface KdsPanelLayoutEntry {
  presetId: string;
  restaurantId: string | null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNonEmptyText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`VALIDATION_ERROR_${field.toUpperCase()}_TYPE`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`VALIDATION_ERROR_${field.toUpperCase()}_EMPTY`);
  }
  return trimmed;
}

function assertTerminalConfigPayload(payload: unknown): TerminalConfig {
  if (!isObjectRecord(payload)) {
    throw new Error("VALIDATION_ERROR_TERMINAL_CONFIG_OBJECT_REQUIRED");
  }
  const terminalTypeRaw = asNonEmptyText(payload.terminalType, "terminalType");
  if (terminalTypeRaw !== "TPV" && terminalTypeRaw !== "KDS") {
    throw new Error("VALIDATION_ERROR_TERMINAL_TYPE_INVALID");
  }
  return {
    terminalId: asNonEmptyText(payload.terminalId, "terminalId"),
    restaurantId: asNonEmptyText(payload.restaurantId, "restaurantId"),
    terminalType: terminalTypeRaw,
    terminalName: asNonEmptyText(payload.terminalName, "terminalName"),
    pairedAt: asNonEmptyText(payload.pairedAt, "pairedAt"),
  };
}

function assertOperationalModulePayload(payload: unknown): OperationalModule {
  if (payload === "tpv" || payload === "kds") return payload;
  throw new Error("VALIDATION_ERROR_MODULE_ID_INVALID");
}

function sanitizeOpenKdsPanelOptions(payload: unknown): {
  presetId?: "kitchen" | "bar" | "late" | "delivery";
  duplicateFromPanelId?: string;
  targetDisplayId?: number | "current";
  alwaysOnTop?: boolean;
} {
  if (payload === undefined) return {};
  if (!isObjectRecord(payload)) {
    throw new Error("VALIDATION_ERROR_OPEN_KDS_OPTIONS_OBJECT_REQUIRED");
  }
  const presetRaw = payload.presetId;
  const normalizedPreset = normalizeKdsPanelPreset(
    typeof presetRaw === "string" ? presetRaw : null,
  );

  if (presetRaw !== undefined && normalizedPreset === null) {
    throw new Error("VALIDATION_ERROR_KDS_PRESET_INVALID");
  }

  if (
    payload.duplicateFromPanelId !== undefined &&
    typeof payload.duplicateFromPanelId !== "string"
  ) {
    throw new Error("VALIDATION_ERROR_DUPLICATE_FROM_PANEL_ID_TYPE");
  }

  if (
    payload.targetDisplayId !== undefined &&
    payload.targetDisplayId !== "current" &&
    typeof payload.targetDisplayId !== "number"
  ) {
    throw new Error("VALIDATION_ERROR_TARGET_DISPLAY_ID_TYPE");
  }

  if (
    payload.alwaysOnTop !== undefined &&
    typeof payload.alwaysOnTop !== "boolean"
  ) {
    throw new Error("VALIDATION_ERROR_ALWAYS_ON_TOP_TYPE");
  }

  return {
    presetId: normalizedPreset ?? undefined,
    duplicateFromPanelId:
      typeof payload.duplicateFromPanelId === "string"
        ? payload.duplicateFromPanelId
        : undefined,
    targetDisplayId:
      payload.targetDisplayId === "current" ||
      typeof payload.targetDisplayId === "number"
        ? payload.targetDisplayId
        : undefined,
    alwaysOnTop:
      typeof payload.alwaysOnTop === "boolean"
        ? payload.alwaysOnTop
        : undefined,
  };
}

function assertPrintLabelPayload(payload: unknown): {
  html: string;
  printerTarget?: string | null;
} {
  if (!isObjectRecord(payload)) {
    throw new Error("VALIDATION_ERROR_PRINT_PAYLOAD_OBJECT_REQUIRED");
  }
  const html = asNonEmptyText(payload.html, "html");
  if (html.length > 500_000) {
    throw new Error("VALIDATION_ERROR_PRINT_HTML_TOO_LARGE");
  }
  return {
    html,
    printerTarget:
      payload.printerTarget === null ||
      typeof payload.printerTarget === "string"
        ? payload.printerTarget
        : undefined,
  };
}

function buildDesktopLaunchAckSignature(
  nonce: string,
  moduleId: OperationalModule,
  timestampMs: number,
): string | null {
  if (!DESKTOP_LAUNCH_ACK_SECRET) return null;
  const material = `${nonce}.${moduleId}.${timestampMs}`;
  return createHmac("sha256", DESKTOP_LAUNCH_ACK_SECRET)
    .update(material, "utf8")
    .digest("hex");
}

const store = new Store<{
  terminal?: TerminalConfig;
  lastRoute?: string;
  diagnostics?: DesktopDiagnostics;
  kdsPanelsLayout?: KdsPanelLayoutEntry[];
}>({
  name: "chefiapp-desktop",
  encryptionKey: "chefiapp-desktop-v1", // Basic obfuscation; not security-critical
});

type StoreKey = "terminal" | "lastRoute" | "diagnostics" | "kdsPanelsLayout";

type StoreCompat = {
  get: (key: StoreKey) => unknown;
  set: (key: StoreKey, value: unknown) => void;
  delete: (key: StoreKey) => void;
};

const storeCompat = store as unknown as StoreCompat;

type OperationalModule = "tpv" | "kds";
type KdsPanelPreset = "kitchen" | "bar" | "late" | "delivery";

function normalizeModuleFromEnv(
  value: string | undefined,
): OperationalModule | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "tpv" || normalized === "kds") return normalized;
  return null;
}

function routeFromModule(moduleId: OperationalModule): "/op/tpv" | "/op/kds" {
  return moduleId === "kds" ? "/op/kds" : "/op/tpv";
}

function normalizeKdsPanelPreset(value: string | null): KdsPanelPreset | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "kitchen" ||
    normalized === "bar" ||
    normalized === "late" ||
    normalized === "delivery"
  ) {
    return normalized;
  }
  return null;
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAllowedOperationalPath(
  pathname: string,
  allowedRoute: "/op/tpv" | "/op/kds",
): boolean {
  if (
    pathname === "/electron/setup" ||
    pathname.startsWith("/electron/setup?")
  ) {
    return true;
  }
  return pathname === allowedRoute || pathname.startsWith(`${allowedRoute}/`);
}

function extractPathnameFromUrl(url: string): string {
  if (USE_DEV_SERVER) {
    if (!url.startsWith(DEV_SERVER_URL)) return "";
    const pathname = url.slice(DEV_SERVER_URL.length);
    return pathname.startsWith("/") ? pathname : `/${pathname}`;
  }

  if (!url.startsWith("file:")) return "";
  const hashIndex = url.indexOf("#");
  if (hashIndex < 0) return "/";
  const hash = url.slice(hashIndex + 1);
  if (!hash) return "/";
  return hash.startsWith("/") ? hash : `/${hash}`;
}

function isInternalAppUrl(url: string): boolean {
  if (USE_DEV_SERVER) {
    if (!url.startsWith(DEV_SERVER_URL)) return false;
    const path = extractPathnameFromUrl(url);
    if (!path) return true;
    // Apenas superfícies operacionais e fluxo de setup vivem dentro do shell.
    if (path === "/electron/setup" || path.startsWith("/electron/setup?")) {
      return true;
    }
    if (path.startsWith("/op/tpv") || path.startsWith("/op/kds")) {
      return true;
    }
    // Qualquer outra rota (incl. /admin, /dashboard, etc.) é tratada como externa.
    return false;
  }
  // Production: parse hash and apply same operational allowlist.
  if (!url.startsWith("file:")) return false;
  const path = extractPathnameFromUrl(url);
  if (!path || path === "/") return true;
  if (path === "/electron/setup" || path.startsWith("/electron/setup?")) {
    return true;
  }
  if (path.startsWith("/op/tpv") || path.startsWith("/op/kds")) {
    return true;
  }
  return false;
}

function normalizeForcedStartRoute(
  forcedStartUrlRaw: string | undefined,
  forcedModule: OperationalModule | null,
): string | null {
  const allowedRoute = forcedModule ? routeFromModule(forcedModule) : null;
  const raw = forcedStartUrlRaw?.trim();

  if (raw && raw.startsWith("/")) {
    if (!allowedRoute) return raw;
    if (isAllowedOperationalPath(raw, allowedRoute)) return raw;
    return allowedRoute;
  }

  if (allowedRoute) return allowedRoute;
  return null;
}

const startupModule = normalizeModuleFromEnv(process.env.CHEFIAPP_MODULE);
let pendingDeepLinkUrl: string | null =
  process.argv.find((arg) => hasSupportedProtocolPrefix(arg)) ?? null;
if (IS_DEV && startupModule) {
  const isolatedUserDataPath = path.join(
    app.getPath("userData"),
    startupModule,
  );
  app.setPath("userData", isolatedUserDataPath);
}

function readTerminalConfig(): TerminalConfig | null {
  const value = storeCompat.get("terminal");
  return (value as TerminalConfig | undefined) ?? null;
}

function writeTerminalConfig(config: TerminalConfig): void {
  storeCompat.set("terminal", config);
}

function clearTerminalConfig(): void {
  storeCompat.delete("terminal");
}

function readDiagnostics(): DesktopDiagnostics {
  const value = storeCompat.get("diagnostics");
  return (value as DesktopDiagnostics | undefined) ?? {};
}

function writeDiagnostics(next: DesktopDiagnostics): void {
  storeCompat.set("diagnostics", next);
}

function patchDiagnostics(partial: Partial<DesktopDiagnostics>): void {
  const current = readDiagnostics();
  writeDiagnostics({ ...current, ...partial });
}

function readKdsPanelsLayout(): KdsPanelLayoutEntry[] {
  const value = storeCompat.get("kdsPanelsLayout");
  return (value as KdsPanelLayoutEntry[] | undefined) ?? [];
}

function writeKdsPanelsLayout(layout: KdsPanelLayoutEntry[]): void {
  storeCompat.set("kdsPanelsLayout", layout);
}

// ─── Desktop HTTP Bridge (healthcheck + commands) ───────────────────────────

let desktopBridgeServer: http.Server | null = null;

function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Requested-With",
  );
}

function startDesktopBridge(): void {
  if (desktopBridgeServer) return;

  desktopBridgeServer = http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.statusCode = 400;
        setCorsHeaders(res);
        res.end("Bad Request");
        return;
      }

      const url = new URL(
        req.url,
        `http://127.0.0.1:${DESKTOP_BRIDGE_PORT ?? 4310}`,
      );
      const { pathname } = url;

      if (req.method === "OPTIONS") {
        setCorsHeaders(res);
        res.statusCode = 204;
        res.end();
        return;
      }

      if (pathname === "/chefiapp/health" && req.method === "GET") {
        setCorsHeaders(res);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        const terminal = readTerminalConfig();
        const payload = {
          running: true,
          version: app.getVersion(),
          instanceId: app.getPath("userData"),
          kdsEnabled: true,
          terminalType: terminal?.terminalType ?? null,
          restaurantId: terminal?.restaurantId ?? null,
        };
        res.end(JSON.stringify(payload));
        return;
      }

      if (pathname === "/chefiapp/open-kds-panel" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString("utf-8");
        });
        req.on("end", async () => {
          setCorsHeaders(res);
          res.setHeader("Content-Type", "application/json");
          try {
            const parsed = body.trim().length > 0 ? JSON.parse(body) : {};
            const options = sanitizeOpenKdsPanelOptions(parsed);
            await openKdsPanelInternal(options);
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            log.warn("[desktop-bridge] open-kds-panel failed", {
              error: err instanceof Error ? err.message : String(err),
            });
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            const isValidationError =
              errorMessage.startsWith("VALIDATION_ERROR_") ||
              err instanceof SyntaxError;
            res.statusCode = isValidationError ? 400 : 500;
            res.end(
              JSON.stringify({
                ok: false,
                error: isValidationError
                  ? errorMessage
                  : "INTERNAL_SERVER_ERROR",
              }),
            );
          }
        });
        return;
      }

      // Unknown route
      setCorsHeaders(res);
      res.statusCode = 404;
      res.end("Not Found");
    } catch (err) {
      setCorsHeaders(res);
      res.statusCode = 500;
      res.end("Internal Server Error");
      log.error("[desktop-bridge] unhandled error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  desktopBridgeServer.on("error", (err) => {
    log.warn("[desktop-bridge] server error", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  desktopBridgeServer.listen(DESKTOP_BRIDGE_PORT, "127.0.0.1", () => {
    log.info("[desktop-bridge] HTTP bridge listening", {
      port: DESKTOP_BRIDGE_PORT,
    });
  });
}

function stopDesktopBridge(): void {
  if (!desktopBridgeServer) return;
  desktopBridgeServer.close(() => {
    log.info("[desktop-bridge] HTTP bridge stopped");
  });
  desktopBridgeServer = null;
}

async function sendDesktopLaunchAck(params: {
  nonce: string;
  moduleId: OperationalModule;
}): Promise<void> {
  const { nonce, moduleId } = params;
  if (!DESKTOP_LAUNCH_ACK_BASE) return;
  const launchAckSentAt = new Date().toISOString();
  const diagnostics = readDiagnostics();
  const lastDeepLinkReceivedAt = diagnostics.lastDeepLink?.receivedAt ?? null;
  const isPackaged = app.isPackaged;
  const appVersion = app.getVersion();
  const terminal = readTerminalConfig();
  const ackTimestampMs = Date.now();
  const ackSignature = buildDesktopLaunchAckSignature(
    nonce,
    moduleId,
    ackTimestampMs,
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, DESKTOP_LAUNCH_ACK_TIMEOUT_MS);
  try {
    const res = await fetch(DESKTOP_LAUNCH_ACK_BASE, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(ackSignature
          ? {
              "x-chefiapp-ack-ts": String(ackTimestampMs),
              "x-chefiapp-ack-signature": ackSignature,
            }
          : {}),
      },
      body: JSON.stringify({
        nonce,
        moduleId,
        deviceId: terminal?.terminalId ?? null,
        restaurantId: terminal?.restaurantId ?? null,
        isPackaged,
        appVersion,
        lastDeepLinkReceivedAt,
        launchAckSentAt,
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text();
      log.warn("[desktop-launch-ack] failed", {
        status: res.status,
        body: text.slice(0, 500),
      });
      return;
    }
    patchDiagnostics({
      lastAck: {
        nonce,
        moduleId,
        sentAt: launchAckSentAt,
        success: true,
      },
    });
    log.info("[desktop-launch-ack] recorded", {
      nonce,
      moduleId,
      deviceId: terminal?.terminalId ?? null,
    });
  } catch (err) {
    clearTimeout(timeout);
    patchDiagnostics({
      lastAck: {
        nonce,
        moduleId,
        sentAt: launchAckSentAt,
        success: false,
      },
    });
    log.warn("[desktop-launch-ack] error", {
      nonce,
      moduleId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function sendDesktopHeartbeat(): Promise<void> {
  const terminal = readTerminalConfig();
  if (!terminal) return;
  try {
    await callCoreRpc("device_heartbeat", {
      p_terminal_id: terminal.terminalId,
      p_meta: {
        source: "desktop-app",
        terminal_type: terminal.terminalType,
      },
    });
    const now = new Date().toISOString();
    patchDiagnostics({ lastHeartbeatAt: now });
    log.info("[desktop-heartbeat] sent", {
      terminalId: terminal.terminalId,
      type: terminal.terminalType,
    });
  } catch (err) {
    log.warn("[desktop-heartbeat] failed", {
      terminalId: terminal.terminalId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

let heartbeatTimer: NodeJS.Timeout | null = null;

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    void sendDesktopHeartbeat();
  }, DESKTOP_HEARTBEAT_INTERVAL_MS);
  void sendDesktopHeartbeat();
}

function stopHeartbeat() {
  if (!heartbeatTimer) return;
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

// ─── Logging ────────────────────────────────────────────────────────────

log.initialize();
log.transports.file.level = "info";
log.transports.console.level = IS_DEV ? "debug" : "warn";

// ─── Single Instance Lock ───────────────────────────────────────────────

const gotLock = ALLOW_MULTI_INSTANCE ? true : app.requestSingleInstanceLock();
if (!gotLock) {
  log.info("Another instance is already running — quitting.");
  app.quit();
}

// ─── Protocol Handler Registration ──────────────────────────────────────

const registerProtocolClient = () => {
  // Em dev não registamos protocolos para não sujar o LaunchServices
  // com o Electron cru de node_modules. O handler oficial é sempre o
  // app empacotado instalado em /Applications via electron-builder.
  if (IS_DEV) {
    log.info("[protocol] skip registration in dev", {
      schemes: SUPPORTED_PROTOCOL_SCHEMES,
      execPath: process.execPath,
    });
    return;
  }

  const registrationStatus = SUPPORTED_PROTOCOL_SCHEMES.map((scheme) => ({
    scheme,
    ok: app.setAsDefaultProtocolClient(scheme),
  }));
  log.info("[protocol] registered (packaged)", {
    registrationStatus,
  });
};

registerProtocolClient();

// ─── Window Management ─────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

// ─── Multi-window registry (TPV + KDS como módulos principais) ─────────

const moduleWindows = new Map<OperationalModule, BrowserWindow>();

// ─── KDS panel windows (instâncias adicionais/presets) ─────────────────

type KdsPanelWindowMeta = {
  win: BrowserWindow;
  presetId: string;
  restaurantId: string | null;
};

const kdsPanelWindows = new Map<number, KdsPanelWindowMeta>();

const lastKdsPanelOpenAtByKey = new Map<string, number>();

/** Returns any alive operational window (fallback when mainWindow is gone). */
function getAnyAliveWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  for (const win of moduleWindows.values()) {
    if (!win.isDestroyed()) return win;
  }
  for (const meta of kdsPanelWindows.values()) {
    if (!meta.win.isDestroyed()) return meta.win;
  }
  return null;
}

/** Register a window in the module registry and wire its close handler. */
function registerModuleWindow(
  moduleId: OperationalModule,
  win: BrowserWindow,
): void {
  // If there's already a window for this module, close the old one first.
  const prev = moduleWindows.get(moduleId);
  if (prev && !prev.isDestroyed()) {
    prev.destroy();
  }
  moduleWindows.set(moduleId, win);
  win.on("closed", () => {
    moduleWindows.delete(moduleId);
    if (mainWindow === win) {
      mainWindow = getAnyAliveWindow();
    }
  });
}

let printWorkerTimer: NodeJS.Timeout | null = null;
let printWorkerRunning = false;

type PrintFunction = "kitchen" | "receipt" | "labels";

type PendingPrintJob = {
  id: string;
  restaurant_id: string;
  type: "kitchen_ticket" | "receipt" | "z_report" | "label";
  print_function?: PrintFunction | null;
  payload?: Record<string, unknown>;
  attempt_count: number;
};

type Assignment = {
  id: string;
  transport: "spooler" | "tcp9100";
  target: string;
  print_function: PrintFunction;
};

type DesktopPrinter = {
  name: string;
  isDefault: boolean;
  status: string;
};

async function callCoreRpc<T>(rpc: string, payload: Record<string, unknown>) {
  const res = await fetch(`${CORE_RPC_BASE}/${rpc}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RPC_${rpc.toUpperCase()}_${res.status}: ${body}`);
  }

  return (await res.json()) as T;
}

function derivePrintFunction(job: PendingPrintJob): PrintFunction {
  if (job.print_function === "kitchen") return "kitchen";
  if (job.print_function === "receipt") return "receipt";
  if (job.print_function === "labels") return "labels";
  if (job.type === "kitchen_ticket") return "kitchen";
  if (job.type === "receipt") return "receipt";
  return "labels";
}

function payloadToPrintableText(payload?: Record<string, unknown>): string {
  if (!payload) return "";
  const directText = payload.text;
  if (typeof directText === "string" && directText.trim()) return directText;
  const rawText = payload.raw_text;
  if (typeof rawText === "string" && rawText.trim()) return rawText;
  return JSON.stringify(payload, null, 2);
}

function parseTcpTarget(target: string): { host: string; port: number } {
  const [hostPart, portPart] = target.split(":");
  const host = hostPart?.trim();
  const port = Number(portPart ?? "9100");
  if (!host || Number.isNaN(port) || port <= 0) {
    throw new Error(`INVALID_TCP_TARGET: ${target}`);
  }
  return { host, port };
}

function payloadToRawBuffer(payload?: Record<string, unknown>): Buffer {
  if (!payload) return Buffer.from("", "utf-8");

  const rawBase64 = payload.raw_base64;
  if (typeof rawBase64 === "string" && rawBase64.trim()) {
    return Buffer.from(rawBase64, "base64");
  }

  const rawText = payload.raw_text;
  if (typeof rawText === "string") {
    return Buffer.from(rawText, "utf-8");
  }

  const text = payloadToPrintableText(payload);
  return Buffer.from(`${text}\n`, "utf-8");
}

async function printViaTcp9100(
  target: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const { host, port } = parseTcpTarget(target);
  const buffer = payloadToRawBuffer(payload);

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.write(buffer, (err) => {
        if (err) {
          socket.destroy();
          reject(err);
          return;
        }
        socket.end();
      });
    });

    socket.setTimeout(5000);

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("TCP_PRINT_TIMEOUT"));
    });

    socket.on("error", (err) => {
      reject(err);
    });

    socket.on("close", (hadError) => {
      if (!hadError) resolve();
    });
  });
}

async function printViaSpooler(
  target: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const html =
    typeof payload?.html === "string" && payload.html.trim()
      ? payload.html
      : `<!doctype html><html><body><pre>${payloadToPrintableText(
          payload,
        )}</pre></body></html>`;

  const result = await printLabelHtml({
    html,
    printerTarget: target,
  });

  if (!result.ok) {
    throw new Error(result.error ?? "SPOOLER_PRINT_FAILED");
  }
}

async function executePrint(
  assignment: Assignment,
  payload?: Record<string, unknown>,
): Promise<void> {
  if (assignment.transport === "tcp9100") {
    await printViaTcp9100(assignment.target, payload);
    return;
  }
  await printViaSpooler(assignment.target, payload);
}

async function processPendingPrintJobs(): Promise<void> {
  const terminal = readTerminalConfig();
  if (!terminal) return;
  if (printWorkerRunning) return;

  printWorkerRunning = true;
  try {
    const jobs = await callCoreRpc<PendingPrintJob[]>(
      "list_pending_print_jobs",
      {
        p_station_id: terminal.terminalId,
        p_limit: 10,
      },
    );

    for (const listedJob of jobs ?? []) {
      const claim = await callCoreRpc<{
        ok: boolean;
        claimed: boolean;
        job?: PendingPrintJob;
      }>("claim_print_job", {
        p_job_id: listedJob.id,
        p_station_id: terminal.terminalId,
      });

      if (!claim?.claimed || !claim.job) continue;

      const printFunction = derivePrintFunction(claim.job);

      try {
        const resolved = await callCoreRpc<{
          found: boolean;
          assignment?: Assignment;
        }>("resolve_printer_assignment", {
          p_restaurant_id: claim.job.restaurant_id,
          p_print_function: printFunction,
          p_station_id: terminal.terminalId,
        });

        if (!resolved.found || !resolved.assignment) {
          throw new Error(`ASSIGNMENT_NOT_FOUND:${printFunction}`);
        }

        await executePrint(resolved.assignment, claim.job.payload);

        await callCoreRpc("set_print_job_status", {
          p_job_id: claim.job.id,
          p_status: "sent",
          p_error_message: null,
        });

        log.info("[print-agent] job sent", {
          jobId: claim.job.id,
          function: printFunction,
          transport: resolved.assignment.transport,
          target: resolved.assignment.target,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "PRINT_FAILED";

        await callCoreRpc("mark_print_job_retry", {
          p_job_id: claim.job.id,
          p_station_id: terminal.terminalId,
          p_error_message: message,
          p_retry_seconds: 20,
          p_max_attempts: PRINT_MAX_ATTEMPTS,
        });

        log.error("[print-agent] job failed", {
          jobId: claim.job.id,
          function: printFunction,
          status: "failed",
          error: message,
        });
      }
    }
  } catch (err) {
    log.error("[print-agent] loop error", err);
  } finally {
    printWorkerRunning = false;
  }
}

function startPrintWorker() {
  if (printWorkerTimer) return;
  printWorkerTimer = setInterval(() => {
    void processPendingPrintJobs();
  }, PRINT_WORKER_INTERVAL_MS);
  void processPendingPrintJobs();
  log.info("[print-agent] started");
  startHeartbeat();
}

function stopPrintWorker() {
  if (!printWorkerTimer) return;
  clearInterval(printWorkerTimer);
  printWorkerTimer = null;
  log.info("[print-agent] stopped");
  stopHeartbeat();
}

async function printLabelHtml(payload: {
  html: string;
  printerTarget?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(payload.html)}`,
    );

    const result = await new Promise<{ ok: boolean; error?: string }>(
      (resolve) => {
        printWindow.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: payload.printerTarget ?? undefined,
          },
          (success, failureReason) => {
            if (success) {
              resolve({ ok: true });
            } else {
              resolve({ ok: false, error: failureReason || "PRINT_FAILED" });
            }
          },
        );
      },
    );

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "PRINT_FAILED";
    return { ok: false, error: message };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.destroy();
    }
  }
}

function getPreloadPath(): string {
  return path.join(__dirname, "preload.js");
}

/**
 * Resolve the URL to load in the BrowserWindow.
 * Dev: Vite dev server. Prod: local file served via custom protocol or file://.
 */
function resolveUrl(route: string): string {
  if (USE_DEV_SERVER) {
    return `${DEV_SERVER_URL}${route}`;
  }
  // Production: load from packaged frontend dist
  return FRONTEND_INDEX_PATH;
}

function createWindow(
  config: typeof TPV_WINDOW | typeof KDS_WINDOW,
): BrowserWindow {
  const isKDS = config.kind === "kds";

  const win = new BrowserWindow({
    width: config.width,
    height: config.height,
    minWidth: "minWidth" in config ? config.minWidth : undefined,
    minHeight: "minHeight" in config ? config.minHeight : undefined,
    fullscreen: false,
    frame: true,
    // TPV keeps compact macOS titlebar; KDS uses native frame controls.
    titleBarStyle: isKDS ? undefined : "hiddenInset",
    title: APP_NAME,
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Disable service workers in Electron — avoids stale content conflicts
      // The frontend detects isElectron() and skips SW registration
    },
  });

  // Append Electron + ChefIApp to user-agent for isElectron() detection
  const ua = win.webContents.getUserAgent();
  win.webContents.setUserAgent(`${ua} ChefIApp-Desktop/${app.getVersion()}`);

  // Open external links in system browser and block app-internal new-window escapes
  win.webContents.setWindowOpenHandler(({ url }) => {
    const attemptedPath = extractPathnameFromUrl(url);

    // Sempre abrir rotas de Admin no browser externo, mesmo em dev sem CHEFIAPP_MODULE.
    if (attemptedPath && isAdminPath(attemptedPath)) {
      if (startupModule) {
        log.warn("[boot] blocked navigation (operational isolation)", {
          module: startupModule,
          allowedRoute: routeFromModule(startupModule),
          reason: "setWindowOpenHandler-admin",
          attemptedUrl: url,
        });
      }
      log.info("[boot] opened externally", {
        attemptedUrl: url,
        reason: "admin-in-operational-runtime",
      });
      void shell.openExternal(url);

      if (startupModule) {
        const allowedRoute = routeFromModule(startupModule);
        if (USE_DEV_SERVER) {
          void win.webContents.loadURL(`${DEV_SERVER_URL}${allowedRoute}`);
        } else {
          void win.webContents.loadFile(resolveUrl("/"), {
            hash: allowedRoute,
          });
        }
        log.info("[boot] forced back to", {
          route: allowedRoute,
          reason: "setWindowOpenHandler-admin",
        });
      }

      return { action: "deny" };
    }

    // Never allow app-internal URLs to open in new windows.
    if (url.startsWith(DEV_SERVER_URL) || url.startsWith("file:")) {
      if (startupModule) {
        const allowedRoute = routeFromModule(startupModule);
        if (USE_DEV_SERVER) {
          void win.webContents.loadURL(`${DEV_SERVER_URL}${allowedRoute}`);
        } else {
          void win.webContents.loadFile(resolveUrl("/"), {
            hash: allowedRoute,
          });
        }
      }
      return { action: "deny" };
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const forceAllowedRouteIfNeeded = (reason: string) => {
    // Use startupModule when set (dev isolation mode); otherwise infer from window kind.
    // V4 fix: KDS windows must return to /op/kds, not /op/tpv.
    const allowedRoute: "/op/tpv" | "/op/kds" = startupModule
      ? routeFromModule(startupModule)
      : isKDS
      ? "/op/kds"
      : "/op/tpv";
    if (USE_DEV_SERVER) {
      void win.webContents.loadURL(`${DEV_SERVER_URL}${allowedRoute}`);
    } else {
      void win.webContents.loadFile(resolveUrl("/"), {
        hash: allowedRoute,
      });
    }
    log.info("[boot] forced back to", {
      route: allowedRoute,
      reason,
    });
  };

  // Global guard: never allow the main app window to navigate away from
  // ChefIApp routes. External URLs must open in the system browser.
  const blockExternalMainFrameNavigation = (
    reason: string,
    event: Electron.Event,
    url: string,
  ) => {
    if (isInternalAppUrl(url)) return;

    event.preventDefault();

    if (url.startsWith("http://") || url.startsWith("https://")) {
      log.info("[boot] opened externally", {
        attemptedUrl: url,
        reason,
      });
      void shell.openExternal(url);
    } else {
      log.warn("[boot] blocked non-app navigation protocol", {
        attemptedUrl: url,
        reason,
      });
    }

    forceAllowedRouteIfNeeded(reason);
  };

  win.webContents.on("will-navigate", (event, url) => {
    blockExternalMainFrameNavigation("global-will-navigate", event, url);
  });

  win.webContents.on("will-redirect", (event, url) => {
    blockExternalMainFrameNavigation("global-will-redirect", event, url);
  });

  // Regra OS: rotas /admin nunca vivem dentro da janela operacional.
  // Se a app tentar navegar para /admin dentro deste window, abrimos no browser
  // do sistema e voltamos para a superfície operacional (TPV por omissão).
  win.webContents.on("did-navigate-in-page", (_event, url) => {
    const path = extractPathnameFromUrl(url);
    if (!path || !isAdminPath(path)) return;

    const externalUrl =
      USE_DEV_SERVER &&
      !url.startsWith("http://") &&
      !url.startsWith("https://")
        ? `${DEV_SERVER_URL}${path}`
        : url;

    log.info(
      "[boot] admin route attempted in operational window; opening externally",
      {
        attemptedUrl: url,
        resolvedExternalUrl: externalUrl,
      },
    );

    if (
      externalUrl.startsWith("http://") ||
      externalUrl.startsWith("https://")
    ) {
      void shell.openExternal(externalUrl);
    }

    forceAllowedRouteIfNeeded("admin-in-main-window");
  });

  // DevTools in dev
  if (IS_DEV) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  // Enforce operational isolation when CHEFIAPP_MODULE is set.
  // Prevents Electron from landing on Admin routes ("/admin") when launching TPV/KDS.
  // Applies in dev (Vite) and in packaged builds (file:// + hash routes).
  if (startupModule) {
    const allowedRoute = routeFromModule(startupModule);

    const isAllowedUrl = (url: string): boolean => {
      // External links handled elsewhere
      if (url.startsWith("http://") || url.startsWith("https://")) return true;

      const path = extractPathnameFromUrl(url);
      if (!path) return true;

      if (isAllowedOperationalPath(path, allowedRoute)) return true;

      if (
        USE_DEV_SERVER &&
        (url.includes("/@vite") ||
          url.includes("/assets/") ||
          url.includes("/src/"))
      ) {
        return true;
      }

      if (USE_DEV_SERVER) {
        if (!url.startsWith(DEV_SERVER_URL)) return true;
        return false;
      }

      // Packaged build: SPA uses hash routing (index.html#/op/tpv)
      if (url.startsWith("file:")) {
        // allow the bare index load; the app will immediately route via hash
        if (url.endsWith("index.html") || url.includes("index.html#"))
          return true;
        return false;
      }

      // Any other protocol is not app-internal
      return true;
    };

    const redirectToAllowed = (reason: string, url: string) => {
      const path = extractPathnameFromUrl(url);
      log.warn("[boot] blocked navigation (operational isolation)", {
        module: startupModule,
        allowedRoute,
        reason,
        attemptedUrl: url,
      });

      if (path && isAdminPath(path)) {
        log.info("[boot] opened externally", {
          attemptedUrl: url,
          reason: "admin-in-operational-runtime",
        });
        void shell.openExternal(url);
      }

      if (USE_DEV_SERVER) {
        void win.webContents.loadURL(`${DEV_SERVER_URL}${allowedRoute}`);
      } else {
        void win.webContents.loadFile(resolveUrl("/"), { hash: allowedRoute });
      }
      log.info("[boot] forced back to", {
        route: allowedRoute,
        reason,
      });
    };

    win.webContents.on("will-navigate", (event, url) => {
      if (!isAllowedUrl(url)) {
        event.preventDefault();
        redirectToAllowed("will-navigate", url);
      }
    });

    win.webContents.on("will-redirect", (event, url) => {
      if (!isAllowedUrl(url)) {
        event.preventDefault();
        redirectToAllowed("will-redirect", url);
      }
    });

    win.webContents.on("did-navigate-in-page", (_event, url) => {
      if (!isAllowedUrl(url)) {
        redirectToAllowed("did-navigate-in-page", url);
      }
    });
  }

  win.webContents.on(
    "did-fail-load",
    (_event, code, description, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      log.error("[boot] did-fail-load", {
        code,
        description,
        url: validatedURL,
      });
    },
  );

  win.webContents.on("did-finish-load", () => {
    log.info("[boot] did-finish-load", {
      finalUrl: win.webContents.getURL(),
    });
  });

  return win;
}

async function loadApp(): Promise<void> {
  const terminal = readTerminalConfig();

  const forcedModule = normalizeModuleFromEnv(process.env.CHEFIAPP_MODULE);
  const forcedStartUrlRaw = process.env.CHEFIAPP_START_URL?.trim();
  const forcedRoute = normalizeForcedStartRoute(
    forcedStartUrlRaw,
    forcedModule,
  );

  const defaultRoute = terminal
    ? terminal.terminalType === "KDS"
      ? "/op/kds"
      : "/op/tpv"
    : "/electron/setup";

  const pairedModule: OperationalModule | null = terminal
    ? terminal.terminalType === "KDS"
      ? "kds"
      : "tpv"
    : null;

  const hasMismatch = Boolean(
    terminal && forcedModule && pairedModule && pairedModule !== forcedModule,
  );

  const route = hasMismatch
    ? `/electron/setup?reason=module_mismatch&paired=${pairedModule}&requested=${forcedModule}`
    : forcedRoute ?? defaultRoute;

  log.info("[boot] startUrl resolved", {
    forcedModule,
    forcedStartUrl: forcedStartUrlRaw ?? null,
    defaultRoute,
    hasMismatch,
    resolvedRoute: route,
  });

  const isKdsRoute = (
    forcedModule ? routeFromModule(forcedModule) : defaultRoute
  ).startsWith("/op/kds");
  const bootModuleId: OperationalModule = isKdsRoute ? "kds" : "tpv";
  const windowConfig = isKdsRoute ? KDS_WINDOW : TPV_WINDOW;
  mainWindow = createWindow(windowConfig);
  registerModuleWindow(bootModuleId, mainWindow);

  log.info("[boot] startup context", {
    isDev: IS_DEV,
    devServerUrl: DEV_SERVER_URL,
    allowMultiInstance: ALLOW_MULTI_INSTANCE,
    userDataPath: app.getPath("userData"),
    pairedTerminalType: terminal?.terminalType ?? null,
    pairedTerminalId: terminal?.terminalId ?? null,
    forcedModule,
    forcedStartUrl: forcedStartUrlRaw ?? null,
    finalRoute: route,
  });

  if (hasMismatch) {
    log.warn("[boot] module mismatch detected; redirecting to setup", {
      pairedModule,
      forcedModule,
    });
  }

  if (terminal && !hasMismatch) {
    startPrintWorker();
    log.info(
      `Loading paired terminal: ${terminal.terminalType} (${terminal.terminalId})`,
    );

    if (USE_DEV_SERVER) {
      await mainWindow.loadURL(resolveUrl(route));
    } else {
      await mainWindow.loadFile(resolveUrl("/"), { hash: route });
    }
    // Restaurar layout de painéis KDS previamente abertos neste terminal.
    const layout = readKdsPanelsLayout();
    for (const entry of layout) {
      await openKdsPanelInternal({ presetId: entry.presetId });
    }
  } else {
    stopPrintWorker();
    log.info("Showing setup flow.", {
      hasTerminal: Boolean(terminal),
      hasMismatch,
    });

    if (USE_DEV_SERVER) {
      await mainWindow.loadURL(resolveUrl(route));
    } else {
      await mainWindow.loadFile(resolveUrl("/"), { hash: route });
    }
  }
}

// ─── IPC Handlers ───────────────────────────────────────────────────────

ipcMain.handle("get-terminal-config", (): TerminalConfig | null => {
  return readTerminalConfig();
});

ipcMain.handle(
  "set-terminal-config",
  (_event: IpcMainInvokeEvent, configRaw: unknown): void => {
    const config = assertTerminalConfigPayload(configRaw);
    writeTerminalConfig(config);
    log.info(`Terminal paired: ${config.terminalType} (${config.terminalId})`);
    startPrintWorker();
  },
);

ipcMain.handle("clear-terminal-config", (): void => {
  clearTerminalConfig();
  log.info("Terminal config cleared (unpaired).");
  stopPrintWorker();
  stopHeartbeat();
});

ipcMain.handle("get-app-info", () => ({
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  isElectron: true,
  isDev: IS_DEV,
}));

ipcMain.handle("get-diagnostics", () => {
  const terminal = readTerminalConfig();
  const diagnostics = readDiagnostics();
  return {
    terminal,
    diagnostics,
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
  };
});

ipcMain.handle(
  "set-window-title",
  (_event: IpcMainInvokeEvent, title: string): void => {
    const senderWindow = BrowserWindow.fromWebContents(_event.sender);
    if (!senderWindow || senderWindow.isDestroyed()) return;
    senderWindow.setTitle(title);
  },
);

// Use ipcMain.on (not .handle) — fire-and-forget pattern.
// .handle requires a response back to the renderer, but closing the window
// destroys the IPC channel before the response is sent, causing a deadlock.
ipcMain.on("close-app", (event) => {
  const sender = BrowserWindow.fromWebContents(event.sender);
  log.info("[IPC] close-app requested by renderer", {
    windowCount: moduleWindows.size,
  });

  if (sender && moduleWindows.size > 1) {
    // Other module window(s) still open — close only this one.
    sender.close();
    return;
  }

  // Last window (or couldn't identify sender) — full exit.
  stopPrintWorker();
  app.exit(0);
});

ipcMain.handle("get-printers", async (): Promise<DesktopPrinter[]> => {
  const win = getAnyAliveWindow();
  if (!win) return [];
  const printers = await win.webContents.getPrintersAsync();
  return printers.map((printer) => ({
    name: printer.name,
    isDefault: Boolean(
      (printer as unknown as { isDefault?: unknown }).isDefault,
    ),
    status: String(
      (printer as unknown as { status?: unknown }).status ?? "unknown",
    ),
  }));
});

ipcMain.handle(
  "navigate-to-app",
  async (_event: IpcMainInvokeEvent, appTypeRaw: unknown): Promise<void> => {
    const appType = assertOperationalModulePayload(appTypeRaw);
    const moduleId: OperationalModule = appType;
    const route = routeFromModule(moduleId);
    log.info(`[navigate-to-app] requested: ${route}`);

    // Multi-window: find or create the target module's window.
    let targetWindow = moduleWindows.get(moduleId);

    if (targetWindow && !targetWindow.isDestroyed()) {
      if (targetWindow.isMinimized()) targetWindow.restore();
      targetWindow.focus();
      return;
    }

    // Create a new window for the target module.
    const cfg = moduleId === "kds" ? KDS_WINDOW : TPV_WINDOW;
    targetWindow = createWindow(cfg);
    registerModuleWindow(moduleId, targetWindow);

    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = targetWindow;
    }

    if (USE_DEV_SERVER) {
      await targetWindow.loadURL(`${DEV_SERVER_URL}${route}`);
    } else {
      await targetWindow.loadFile(resolveUrl("/"), { hash: route });
    }
  },
);

async function openKdsPanelInternal(
  options: {
    presetId?: string;
    duplicateFromPanelId?: string;
    targetDisplayId?: number | "current";
    alwaysOnTop?: boolean;
  } = {},
): Promise<void> {
  const presetId =
    typeof options.presetId === "string" && options.presetId.trim()
      ? options.presetId.trim()
      : "kitchen";

  const terminal = readTerminalConfig();
  const restaurantId = terminal?.restaurantId ?? null;
  const key = `${restaurantId ?? "none"}:${presetId}`;
  const now = Date.now();
  const last = lastKdsPanelOpenAtByKey.get(key);
  if (last && now - last < 400) {
    // Debounce rajadas de clique no mesmo preset.
    return;
  }
  lastKdsPanelOpenAtByKey.set(key, now);

  // Se já existir painel para este preset+restaurante, focar em vez de criar outro.
  for (const meta of kdsPanelWindows.values()) {
    if (
      !meta.win.isDestroyed() &&
      meta.presetId === presetId &&
      meta.restaurantId === restaurantId
    ) {
      if (meta.win.isMinimized()) meta.win.restore();
      meta.win.focus();
      return;
    }
  }

  const route = "/op/kds";
  const search = `?panel=${encodeURIComponent(presetId)}`;

  const cfg = KDS_WINDOW;
  const win = createWindow(cfg);

  if (options.alwaysOnTop) {
    win.setAlwaysOnTop(true, "screen-saver");
  }

  const meta: KdsPanelWindowMeta = { win, presetId, restaurantId };
  kdsPanelWindows.set(win.id, meta);

  // Persist layout por terminal para restaurar no próximo boot.
  const currentLayout = readKdsPanelsLayout();
  const exists = currentLayout.some(
    (entry) =>
      entry.presetId === presetId && entry.restaurantId === restaurantId,
  );
  if (!exists) {
    writeKdsPanelsLayout([
      ...currentLayout,
      { presetId, restaurantId: restaurantId ?? null },
    ]);
  }

  win.on("closed", () => {
    kdsPanelWindows.delete(win.id);
    const layout = readKdsPanelsLayout().filter(
      (entry) =>
        !(entry.presetId === presetId && entry.restaurantId === restaurantId),
    );
    writeKdsPanelsLayout(layout);
    if (mainWindow === win) {
      mainWindow = getAnyAliveWindow();
    }
  });

  // Surface isolation: block admin routes inside KDS panel windows.
  // If React Router navigates to /admin/*, force back to /op/kds.
  win.webContents.on("did-navigate-in-page", (_event, url) => {
    const navPath = extractPathnameFromUrl(url);
    if (!navPath || !isAdminPath(navPath)) return;

    log.info("[kds-panel] admin route blocked in KDS window", {
      attemptedUrl: url,
      presetId,
    });

    if (USE_DEV_SERVER) {
      void win.webContents.loadURL(`${DEV_SERVER_URL}${route}${search}`);
    } else {
      void win.webContents.loadFile(resolveUrl("/"), {
        hash: `${route}${search}`,
      });
    }
  });

  if (USE_DEV_SERVER) {
    await win.loadURL(`${DEV_SERVER_URL}${route}${search}`);
  } else {
    await win.loadFile(resolveUrl("/"), {
      hash: `${route}${search}`,
    });
  }
}

ipcMain.handle(
  "open-kds-panel",
  async (
    _event: IpcMainInvokeEvent,
    optionsRaw: unknown = {},
  ): Promise<void> => {
    const options = sanitizeOpenKdsPanelOptions(optionsRaw);
    await openKdsPanelInternal(options);
  },
);

ipcMain.handle(
  "print-label-html",
  async (_event: IpcMainInvokeEvent, payloadRaw: unknown) => {
    const payload = assertPrintLabelPayload(payloadRaw);
    return printLabelHtml(payload);
  },
);

// ─── Deep Link Handling ─────────────────────────────────────────────────

function handleDeepLink(url: string): void {
  log.info(`Deep link received: ${url}`);
  try {
    const parsed = new URL(url);
    if (!isSupportedProtocol(parsed.protocol)) return;

    const appParam = parsed.searchParams.get("app");
    if (appParam === "tpv" || appParam === "kds") {
      const moduleId: OperationalModule = appParam;
      const requestedPanelPreset = normalizeKdsPanelPreset(
        parsed.searchParams.get("panel"),
      );
      const route = routeFromModule(moduleId);
      const nonce = parsed.searchParams.get("nonce") ?? undefined;
      const receivedAt = new Date().toISOString();
      patchDiagnostics({
        lastDeepLink: {
          nonce: nonce ?? null,
          moduleId,
          receivedAt,
        },
      });
      if (nonce) {
        void sendDesktopLaunchAck({ nonce, moduleId });
      }

      // Operational isolation: when CHEFIAPP_MODULE is set (dev mode),
      // ignore deep links for other modules (handled by a separate process).
      if (startupModule && moduleId !== startupModule) {
        log.info("[deep-link] ignored in isolated mode", {
          startupModule,
          requestedModule: moduleId,
        });

        if (requestedPanelPreset && app.isReady()) {
          void openKdsPanelInternal({
            presetId: requestedPanelPreset,
          }).catch((err) => {
            log.error(
              "Failed to open KDS panel from deep-link (isolated):",
              err,
            );
          });
        }
        return;
      }

      // ── Multi-window: find or create a dedicated window per module ──
      let targetWindow = moduleWindows.get(moduleId);

      if (targetWindow && !targetWindow.isDestroyed()) {
        // Window already open for this module — just focus.
        if (targetWindow.isMinimized()) targetWindow.restore();
        targetWindow.focus();
      } else if (app.isReady()) {
        // Create a new window for this module.
        const cfg = moduleId === "kds" ? KDS_WINDOW : TPV_WINDOW;
        targetWindow = createWindow(cfg);
        registerModuleWindow(moduleId, targetWindow);

        if (!mainWindow || mainWindow.isDestroyed()) {
          mainWindow = targetWindow;
        }

        if (USE_DEV_SERVER) {
          void targetWindow.loadURL(`${DEV_SERVER_URL}${route}`);
        } else {
          void targetWindow.loadFile(resolveUrl("/"), { hash: route });
        }
        targetWindow.focus();
      } else {
        // App not ready yet: persist and replay after window creation.
        pendingDeepLinkUrl = url;
      }

      if (requestedPanelPreset && app.isReady()) {
        void openKdsPanelInternal({
          presetId: requestedPanelPreset,
        }).catch((err) => {
          log.error("Failed to open KDS panel from deep-link:", err);
        });
      }
    }
  } catch (err) {
    log.error("Failed to parse deep link:", err);
  }
}

// macOS: open-url event
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Windows/Linux: second-instance args contain the deep link
app.on("second-instance", (_event, argv) => {
  const deepLink = argv.find((arg) => hasSupportedProtocolPrefix(arg));
  if (deepLink) {
    pendingDeepLinkUrl = deepLink;
    handleDeepLink(deepLink);
    return; // handleDeepLink already focuses the right window
  }
  // No deep link — focus any existing window.
  const win = getAnyAliveWindow();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// ─── App Lifecycle ──────────────────────────────────────────────────────

app.whenReady().then(async () => {
  log.info(`${APP_NAME} v${app.getVersion()} starting`, {
    isDev: IS_DEV,
    useDevServer: USE_DEV_SERVER,
    hasBundledFrontend: HAS_BUNDLED_FRONTEND,
    frontendIndexPath: FRONTEND_INDEX_PATH,
  });

  if (app.isPackaged && !HAS_BUNDLED_FRONTEND) {
    const message =
      "Frontend bundle missing in packaged app. Aborting startup to avoid non-deterministic runtime.";
    log.error("[boot] fatal packaged startup guard", {
      frontendIndexPath: FRONTEND_INDEX_PATH,
      message,
    });
    dialog.showErrorBox(APP_NAME, message);
    app.quit();
    return;
  }

  startDesktopBridge();
  await loadApp();

  // Replay startup deep link captured before app/window was ready.
  if (pendingDeepLinkUrl) {
    const startupDeepLink = pendingDeepLinkUrl;
    pendingDeepLinkUrl = null;
    handleDeepLink(startupDeepLink);
  }

  app.on("activate", () => {
    // macOS: re-create window when dock icon clicked and no windows exist
    if (BrowserWindow.getAllWindows().length === 0) {
      loadApp();
    }
  });
});

app.on("window-all-closed", () => {
  stopPrintWorker();
  stopDesktopBridge();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
