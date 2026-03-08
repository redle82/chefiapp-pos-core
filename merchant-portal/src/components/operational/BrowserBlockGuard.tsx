/**
 * BrowserBlockGuard — Route-level guard that blocks plain browser access
 * to operational modules (TPV, KDS, AppStaff).
 *
 * These modules MUST run as installed applications:
 *   - TPV / KDS  → Electron/Tauri desktop app (NOT PWA standalone)
 *   - AppStaff   → Mobile app (Expo/React Native)
 *
 * Only Admin runs in the browser.
 *
 * Lei O1 (OPERATIONAL_DEVICE_ONLY_CONTRACT): PWA standalone is NOT desktop app;
 * "Open in app" from Chrome opens PWA, which must be blocked for /op/tpv, /op/kds.
 *
 * Ref: docs/contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md
 */

import * as Sentry from "@sentry/react";
import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  isDesktopApp,
  isElectron,
  isInstalledApp,
  isStandalone,
  isTauri,
} from "../../core/operational/platformDetection";
import styles from "./BrowserBlockGuard.module.css";

/* ------------------------------------------------------------------ */
/*  Platform detection — imported from core/operational/platformDetection */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BrowserBlockGuardProps {
  /** The platform the module requires. Affects the block-screen message. */
  requiredPlatform: "desktop" | "mobile";
  /** Human-readable module label for the block screen (e.g. "TPV", "KDS", "AppStaff"). */
  moduleLabel: string;
}

type OperationalGuardRuntime =
  | "electron"
  | "tauri"
  | "standalone-pwa"
  | "browser";

type OperationalGuardDecision = "ALLOW" | "BLOCK";

type OperationalGuardTelemetryPayload = {
  pathname: string;
  decision: OperationalGuardDecision;
  runtime: OperationalGuardRuntime;
  guard: "operational";
};

type TelemetryOptions = {
  isDev?: boolean;
  random?: () => number;
  sentryApi?: { addBreadcrumb?: (crumb: Record<string, unknown>) => void };
  warn?: (message?: unknown, ...optionalParams: unknown[]) => void;
  log?: (message?: unknown, ...optionalParams: unknown[]) => void;
};

function detectRuntime(): OperationalGuardRuntime {
  if (isElectron()) return "electron";
  if (isTauri()) return "tauri";
  if (isStandalone()) return "standalone-pwa";
  return "browser";
}

export function emitOperationalGuardTelemetry(
  payload: OperationalGuardTelemetryPayload,
  options: TelemetryOptions = {},
) {
  const isDev = options.isDev ?? import.meta.env.DEV;
  const random = options.random ?? Math.random;
  const sentryApi = options.sentryApi ?? Sentry;
  const warn = options.warn ?? console.warn;
  const log = options.log ?? console.log;

  if (isDev) {
    log("[OP_GUARD][DEV]", payload);
    return;
  }

  const shouldEmit =
    payload.decision === "BLOCK" || payload.runtime === "standalone-pwa";

  if (!shouldEmit) {
    return;
  }

  if (typeof sentryApi?.addBreadcrumb === "function" && random() < 0.1) {
    sentryApi.addBreadcrumb({
      category: "op-guard",
      level: "warning",
      message: "operational_guard_decision",
      data: payload,
    });
    return;
  }

  warn(`[OP_GUARD] ${JSON.stringify(payload)}`);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BrowserBlockGuard({
  requiredPlatform,
  moduleLabel,
}: BrowserBlockGuardProps) {
  const location = useLocation();
  const isDesktop = requiredPlatform === "desktop";
  const isDesktopRuntime = isDesktopApp();
  const isPwaStandalone = isStandalone();
  const isTrialQuery =
    new URLSearchParams(location.search).get("mode") === "trial";
  const isAllowed = isDesktop
    ? isDesktopRuntime || isTrialQuery
    : isInstalledApp(requiredPlatform);

  const runtime = detectRuntime();
  const decision: OperationalGuardDecision = isAllowed ? "ALLOW" : "BLOCK";
  const moduleId = moduleLabel.toLowerCase() === "kds" ? "kds" : "tpv";

  const desktopDownloadHref = useMemo(() => {
    const base = String(
      import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE ?? "",
    ).trim();
    const macFile = String(
      import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE ?? "ChefIApp-Desktop.dmg",
    ).trim();
    const windowsFile = String(
      import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE ??
        "ChefIApp-Desktop-Setup.exe",
    ).trim();

    if (!base) return "/admin/devices";

    const osFile = /windows|win64|win32/i.test(navigator.userAgent)
      ? windowsFile
      : macFile;

    if (!osFile) return "/admin/devices";

    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanFile = osFile.startsWith("/") ? osFile.slice(1) : osFile;
    return `${cleanBase}/${cleanFile}`;
  }, []);

  const handleOpenDesktopApp = () => {
    if (!isDesktop) return;

    const deepLink = `chefiapp://open?app=${moduleId}`;
    let didBlur = false;

    const onBlur = () => {
      didBlur = true;
    };

    window.addEventListener("blur", onBlur);
    window.location.assign(deepLink);

    window.setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      if (didBlur) {
        window.close();
      }
    }, 2000);
  };

  useEffect(() => {
    emitOperationalGuardTelemetry({
      pathname: location.pathname,
      decision,
      runtime,
      guard: "operational",
    });
  }, [decision, location.pathname, runtime]);

  // ── Allow only explicit operational runtimes ──
  if (isAllowed) {
    return <Outlet />;
  }

  // ── Block: plain browser ──
  const subtitleDesktop = isPwaStandalone
    ? `PWA instalado no navegador não é a aplicação Desktop. Use o instalador do painel Admin para descarregar a aplicação ${moduleLabel} real.`
    : `O módulo ${moduleLabel} requer a aplicação desktop ChefIApp. Instale o software no computador e vincule-o através do painel de administração.`;

  const ruleBadge =
    isDesktop && isPwaStandalone
      ? "🛡️ PWA do Chrome ≠ App Desktop ChefIApp — use o instalador Admin"
      : "🛡️ Regra de sistema — apenas aplicação instalada";

  return (
    <div
      className={styles.blockScreen}
      data-chefiapp-os="browser-block"
      data-testid="browser-block-guard"
    >
      <div className={styles.lockIcon}>🔒</div>
      <h1 className={styles.title}>
        {moduleLabel} não pode ser aberto no navegador
      </h1>
      <p className={styles.subtitle}>
        {isDesktop
          ? subtitleDesktop
          : `O módulo ${moduleLabel} requer a aplicação móvel ChefIApp Staff. Instale a app no telemóvel e vincule-a através do painel de administração.`}
      </p>

      <div className={styles.ruleBadge} data-testid="browser-block-rule-badge">
        {ruleBadge}
      </div>

      <div className={styles.instructionsCard}>
        <h2 className={styles.instructionsTitle}>
          {isDesktop ? "Como instalar" : "Como instalar no telemóvel"}
        </h2>
        <ol className={styles.instructionsList}>
          {isDesktop ? (
            <>
              <li>
                Abra <strong>Admin → Sistema → Dispositivos</strong>
              </li>
              <li>Descarregue o instalador para o seu sistema operativo</li>
              <li>Instale e abra a aplicação {moduleLabel}</li>
              <li>Digitalize o código QR gerado no painel Admin</li>
            </>
          ) : (
            <>
              <li>
                Abra <strong>Admin → Sistema → Dispositivos</strong> no
                computador
              </li>
              <li>
                Gere um código QR para o tipo <strong>{moduleLabel}</strong>
              </li>
              <li>Instale a app ChefIApp Staff no telemóvel</li>
              <li>Digitalize o QR com a app para vincular o dispositivo</li>
            </>
          )}
        </ol>
      </div>

      {isDesktop ? (
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleOpenDesktopApp}
          >
            Abrir aplicação {moduleLabel}
          </button>
          <a
            href={desktopDownloadHref}
            className={styles.secondaryButton}
            target={
              desktopDownloadHref.startsWith("http") ? "_blank" : undefined
            }
            rel={
              desktopDownloadHref.startsWith("http") ? "noreferrer" : undefined
            }
          >
            Baixar instalador
          </a>
        </div>
      ) : null}

      <a href="/admin/devices" className={styles.backLink}>
        ← Ir para Dispositivos
      </a>
    </div>
  );
}
