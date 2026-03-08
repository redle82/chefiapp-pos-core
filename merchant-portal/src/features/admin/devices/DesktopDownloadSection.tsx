/**
 * DesktopDownloadSection — Platform-aware download buttons for TPV/KDS desktop app.
 *
 * Regra 1: Sem link de download, o sistema NÃO deixa tentar instalar.
 *   - Se VITE_DESKTOP_DOWNLOAD_BASE não configurado → modo DEV ou modo PROD sem release.
 *   - Modo DEV: CTA "Gerar DMG local agora" com instruções claras.
 *   - Modo PROD: CTA "Publicar release" com env vars necessárias.
 *   - Nada de botões mortos.
 *
 * Regra 2: Modo DEV (local) vs PROD (release) — caminhos explícitos.
 *
 * Ref: DESKTOP_DISTRIBUTION_CONTRACT, UXG-011.
 */

import { useState } from "react";
import {
  buildDesktopDownloadHref,
  getDesktopReleaseConfig,
} from "../../../core/desktop/desktopReleaseConfig";
import type { DesktopHealthStatus } from "../../../core/desktop/useDesktopHealth";
import { getDesktopOS } from "../../../core/operational/platformDetection";
import styles from "./AdminDevicesPage.module.css";

/* ── Env helpers — lidos no render, não no import (testabilidade) ── */
function getEnv() {
  const release = getDesktopReleaseConfig();
  const devtoolsEnv =
    (import.meta.env.VITE_DESKTOP_DEVTOOLS_ENABLED ?? "").toString().trim() ||
    (import.meta.env.VITE_DESKTOP_DEVTOOLS ?? "").toString().trim();

  let devtoolsQueryEnabled = false;
  if (typeof window !== "undefined") {
    try {
      const qp = new URLSearchParams(window.location.search);
      devtoolsQueryEnabled = qp.get("desktop_devtools") === "1";
    } catch {
      // ignore query parse errors
    }
  }

  const devtoolsEnabled =
    /^(1|true|yes|on)$/i.test(devtoolsEnv) || devtoolsQueryEnabled;

  return {
    base: release.base,
    macFile: release.macFile,
    winFile: release.windowsFile,
    mode: release.mode,
    isDevLike: release.isDevLike,
    hasPublishedRelease: release.hasPublishedRelease,
    devtoolsEnabled,
  };
}

interface DownloadTarget {
  os: string;
  label: string;
  icon: string;
  file: string;
  href: string | null;
  highlighted: boolean;
}

function getDownloadTargets(
  base: string,
  macFile: string,
  winFile: string,
): DownloadTarget[] {
  const adminOS = getDesktopOS();
  return [
    {
      os: "macos",
      label: "macOS",
      icon: "🍎",
      file: macFile,
      href: buildDesktopDownloadHref(base, macFile),
      highlighted: adminOS === "macos",
    },
    {
      os: "windows",
      label: "Windows",
      icon: "🪟",
      file: winFile,
      href: buildDesktopDownloadHref(base, winFile),
      highlighted: adminOS === "windows",
    },
  ];
}

/* ── DEV mode: local build instructions ── */
function DevLocalBuildCTA() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.devBuildCta} data-testid="desktop-dev-build-cta">
      <div className={styles.devBuildHeader}>
        <span className={styles.devBuildIcon}>🔧</span>
        <div>
          <strong className={styles.devBuildTitle}>
            Modo DEV — Gerar DMG local
          </strong>
          <p className={styles.devBuildDesc}>
            Em desenvolvimento não há release publicada. Gera o instalador
            localmente e instala em /Applications.
          </p>
        </div>
      </div>
      <button
        type="button"
        className={styles.devBuildToggle}
        onClick={() => setExpanded(!expanded)}
        data-testid="desktop-dev-build-toggle"
      >
        {expanded ? "Ocultar instruções" : "Ver instruções de build local"}
      </button>
      {expanded && (
        <div
          className={styles.devBuildSteps}
          data-testid="desktop-dev-build-steps"
        >
          <ol>
            <li>
              <code>
                cd desktop-app && pnpm install && pnpm build && pnpm dist:mac
              </code>
            </li>
            <li>
              Abrir o <code>.dmg</code> gerado em <code>desktop-app/out/</code>
            </li>
            <li>
              Arrastar <strong>ChefIApp Desktop.app</strong> para{" "}
              <code>/Applications</code>
            </li>
            <li>
              Abrir 1x pelo Finder (regista o handler <code>chefiapp-pos://</code>)
            </li>
            <li>
              Testar: <code>open "chefiapp-pos://open?app=tpv&nonce=test"</code>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

/* ── PROD mode: publish release instructions ── */
function ProdPublishCTA() {
  return (
    <div
      className={styles.prodPublishCta}
      data-testid="desktop-prod-publish-cta"
    >
      <div className={styles.devBuildHeader}>
        <span className={styles.devBuildIcon}>📦</span>
        <div>
          <strong className={styles.devBuildTitle}>
            Release não publicada
          </strong>
          <p className={styles.devBuildDesc}>
            Para ativar os downloads, publica uma release com os artefactos e
            configura as variáveis de ambiente:
          </p>
          <ul className={styles.prodEnvList}>
            <li>
              <code>VITE_DESKTOP_DOWNLOAD_BASE</code> — URL base (ex: GitHub
              Releases)
            </li>
            <li>
              <code>VITE_DESKTOP_DOWNLOAD_MAC_FILE</code> — nome do .dmg
            </li>
            <li>
              <code>VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE</code> — nome do .exe
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface DesktopDownloadSectionProps {
  onVerify?: () => void;
  healthStatus?: DesktopHealthStatus;
}

export function DesktopDownloadSection({
  onVerify,
  healthStatus,
}: DesktopDownloadSectionProps) {
  const {
    base,
    macFile,
    winFile,
    isDevLike,
    hasPublishedRelease,
    devtoolsEnabled,
  } = getEnv();
  const targets = getDownloadTargets(base, macFile, winFile);
  const hasBaseConfigured = hasPublishedRelease;

  /* ── Regra 1: Se não há link, NÃO mostra botões mortos ── */
  if (!hasBaseConfigured) {
    return (
      <div className={styles.downloadSection}>
        <div
          className={styles.downloadUnpublished}
          data-testid="desktop-download-unpublished-note"
        >
          <span className={styles.downloadUnpublishedBadge}>
            Desktop não publicado
          </span>
          <span className={styles.downloadNote}>
            La aplicación de escritorio incluye TPV y KDS en un solo instalador.
          </span>
        </div>
        {isDevLike && devtoolsEnabled ? (
          <DevLocalBuildCTA />
        ) : (
          <ProdPublishCTA />
        )}
      </div>
    );
  }

  /* ── Regra 2 PROD: links de download reais ── */
  return (
    <div className={styles.downloadSection}>
      <div className={styles.downloadGrid}>
        {targets.map((t) => (
          <div
            key={t.os}
            className={`${styles.downloadCard} ${
              t.highlighted ? styles.downloadCardHighlighted : ""
            }`}
          >
            {t.href ? (
              <a
                href={t.href}
                className={styles.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`desktop-download-${t.os}`}
              >
                <span className={styles.downloadIcon}>{t.icon}</span>
                <div className={styles.downloadInfo}>
                  <span className={styles.downloadLabel}>
                    Descargar para {t.label}
                  </span>
                  <span className={styles.downloadFile}>{t.file}</span>
                </div>
                {t.highlighted && (
                  <span className={styles.downloadBadge}>Tu sistema</span>
                )}
              </a>
            ) : (
              /* Edge case: base configured but href build failed */
              <div className={styles.downloadInfo}>
                <span className={styles.downloadIcon}>{t.icon}</span>
                <div>
                  <span className={styles.downloadLabel}>{t.label}</span>
                  <span className={styles.downloadFile}>URL inválida</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.downloadFooter}>
        <span className={styles.downloadNote}>
          La aplicación de escritorio incluye TPV y KDS en un solo instalador.
        </span>
      </div>
      {onVerify && healthStatus !== "detected" && (
        <div className={styles.postDownloadVerify}>
          <span className={styles.postDownloadVerifyLabel}>
            ¿Instalación completada?
          </span>
          <button
            type="button"
            className={styles.verifyBtn}
            onClick={onVerify}
            data-testid="desktop-verify-install-btn"
          >
            {healthStatus === "checking" ? "Verificando…" : "Verificar"}
          </button>
        </div>
      )}
    </div>
  );
}
