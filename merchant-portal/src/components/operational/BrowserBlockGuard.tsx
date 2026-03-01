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

import { Outlet, useLocation } from "react-router-dom";
import {
  isDesktopApp,
  isInstalledApp,
  isStandalone,
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

      <div className={styles.ruleBadge}>{ruleBadge}</div>

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

      <a href="/admin/devices" className={styles.backLink}>
        ← Ir para Dispositivos
      </a>
    </div>
  );
}
