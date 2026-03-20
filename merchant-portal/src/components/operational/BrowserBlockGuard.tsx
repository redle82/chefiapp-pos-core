/**
 * BrowserBlockGuard — Route-level guard for operational modules (TPV, KDS, AppStaff).
 *
 * In Trial/Pilot mode, browser access is ALWAYS allowed.
 * In Production, modules require installed applications unless overridden by env vars:
 *   - VITE_ALLOW_BROWSER_RUNTIME=true       → all modules
 *   - VITE_ALLOW_BROWSER_TPV=true            → TPV/KDS only
 *   - VITE_ALLOW_BROWSER_APPSTAFF=true       → AppStaff only
 *
 * Detection (installed app):
 *   - Electron: navigator.userAgent includes "Electron"
 *   - Standalone PWA: display-mode: standalone (temporary bridge)
 *   - React Native WebView: window.ReactNativeWebView exists
 *
 * Ref: docs/architecture/SYSTEM_RULE_DEVICE_ONLY.md
 */

import { Outlet, useLocation } from "react-router-dom";
import { isTrial } from "../../core/runtime";
import styles from "./BrowserBlockGuard.module.css";

interface OperationalGuardTelemetryPayload {
  pathname: string;
  decision: "ALLOW" | "BLOCK";
  runtime: "browser" | "installed";
  guard: "operational";
}

interface OperationalGuardTelemetryOptions {
  isDev: boolean;
  random: () => number;
  sentryApi?: { addBreadcrumb?: (breadcrumb: unknown) => void };
  warn: (message: string) => void;
}

export function emitOperationalGuardTelemetry(
  payload: OperationalGuardTelemetryPayload,
  options: OperationalGuardTelemetryOptions,
): void {
  const sampleRate = options.isDev ? 1 : 0.1;
  if (options.random() > sampleRate) return;

  const addBreadcrumb = options.sentryApi?.addBreadcrumb;
  if (typeof addBreadcrumb === "function") {
    addBreadcrumb({
      category: "op-guard",
      level: payload.decision === "BLOCK" ? "warning" : "info",
      message: "operational_guard_decision",
      data: payload,
    });
    return;
  }

  options.warn(`[OP_GUARD] ${JSON.stringify(payload)}`);
}

/* ------------------------------------------------------------------ */
/*  Platform detection                                                 */
/* ------------------------------------------------------------------ */

function isElectron(): boolean {
  return (
    typeof navigator !== "undefined" && navigator.userAgent.includes("Electron")
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isReactNativeWebView(): boolean {
  return typeof window !== "undefined" && "ReactNativeWebView" in window;
}

/**
 * Returns true when the app is running inside an installed application
 * (Electron, standalone PWA, React Native WebView) — not a plain browser tab.
 */
function isInstalledApp(): boolean {
  return isElectron() || isStandalone() || isReactNativeWebView();
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BrowserBlockGuardProps {
  /** The platform the module requires. Affects the block-screen message. */
  requiredPlatform: "desktop" | "mobile";
  /** Human-readable module label for the block screen (e.g. "TPV", "KDS", "AppStaff"). */
  moduleLabel: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BrowserBlockGuard({
  requiredPlatform,
  moduleLabel,
}: BrowserBlockGuardProps) {
  const location = useLocation();
  const isInstalledRuntime = isInstalledApp();
  const isTrialModeBypass =
    new URLSearchParams(location.search).get("mode") === "trial";

  // Trial/Pilot: always allow browser access — TPV must work in browser for evaluation.
  const isPilot =
    typeof window !== "undefined" &&
    window.localStorage.getItem("chefiapp_pilot_mode") === "true";

  // Browser override via env vars (for production deployments that need browser access).
  const allowBrowserRuntime =
    String(import.meta.env.VITE_ALLOW_BROWSER_RUNTIME ?? import.meta.env.VITE_ALLOW_BROWSER_RUNTIME_DEV ?? "").toLowerCase() === "true" ||
    (requiredPlatform === "desktop" &&
      String(import.meta.env.VITE_ALLOW_BROWSER_TPV ?? import.meta.env.VITE_ALLOW_BROWSER_TPV_DEV ?? "").toLowerCase() === "true") ||
    (requiredPlatform === "mobile" &&
      String(import.meta.env.VITE_ALLOW_BROWSER_APPSTAFF ?? import.meta.env.VITE_ALLOW_BROWSER_APPSTAFF_DEV ?? "").toLowerCase() === "true");

  const shouldAllow =
    isInstalledRuntime ||
    isTrialModeBypass ||
    isTrial ||
    isPilot ||
    allowBrowserRuntime;

  if (shouldAllow) {
    const runtimeLabel: "browser" | "installed" = isInstalledRuntime
      ? "installed"
      : "browser";

    emitOperationalGuardTelemetry(
      {
        pathname: location.pathname,
        decision: "ALLOW",
        runtime: runtimeLabel,
        guard: "operational",
      },
      {
        isDev: import.meta.env.DEV,
        random: Math.random,
        sentryApi:
          typeof window !== "undefined"
            ? (
                window as Window & {
                  Sentry?: { addBreadcrumb?: (breadcrumb: unknown) => void };
                }
              ).Sentry
            : undefined,
        warn: (message) => console.warn(message),
      },
    );

    return <Outlet />;
  }

  emitOperationalGuardTelemetry(
    {
      pathname: location.pathname,
      decision: "BLOCK",
      runtime: "browser",
      guard: "operational",
    },
    {
      isDev: import.meta.env.DEV,
      random: Math.random,
      sentryApi:
        typeof window !== "undefined"
          ? (
              window as Window & {
                Sentry?: { addBreadcrumb?: (breadcrumb: unknown) => void };
              }
            ).Sentry
          : undefined,
      warn: (message) => console.warn(message),
    },
  );

  // ── Block: plain browser (production only) ──
  const isDesktop = requiredPlatform === "desktop";

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
          ? `O módulo ${moduleLabel} requer a aplicação desktop ChefIApp. Instale o software no computador e vincule-o através do painel de administração.`
          : `O módulo ${moduleLabel} requer a aplicação móvel ChefIApp Staff. Instale a app no telemóvel e vincule-a através do painel de administração.`}
      </p>

      <div className={styles.ruleBadge}>
        🛡️ Regra de sistema — apenas aplicação instalada
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

      <button
        type="button"
        className={styles.backLink}
        onClick={() => {
          if (isDesktop) {
            window.location.href = "chefiapp-pos://open";
          } else {
            window.location.href = "/admin/devices";
          }
        }}
      >
        Abrir aplicação {moduleLabel}
      </button>
      <a
        href={isDesktop ? "/admin/devices/tpv" : "/admin/devices"}
        className={styles.backLink}
      >
        {isDesktop ? "Gerir terminais TPV" : "Gerir dispositivos AppStaff"}
      </a>
    </div>
  );
}
