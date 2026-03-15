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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("config");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.devBuildCta} data-testid="desktop-dev-build-cta">
      <div className={styles.devBuildHeader}>
        <span className={styles.devBuildIcon}>🔧</span>
        <div>
          <strong className={styles.devBuildTitle}>
            {t("devices.downloadDevTitle")}
          </strong>
          <p className={styles.devBuildDesc}>
            {t("devices.downloadDevDesc")}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={styles.devBuildToggle}
        onClick={() => setExpanded(!expanded)}
        data-testid="desktop-dev-build-toggle"
      >
        {expanded ? t("devices.downloadHideInstructions") : t("devices.downloadShowInstructions")}
      </button>
      {expanded && (
        <div
          className={styles.devBuildSteps}
          data-testid="desktop-dev-build-steps"
        >
          <ol>
            <li><code>{t("devices.downloadBuildStep1")}</code></li>
            <li>{t("devices.downloadBuildStep2")}</li>
            <li>{t("devices.downloadBuildStep3")}</li>
            <li>{t("devices.downloadBuildStep4")}</li>
            <li>{t("devices.downloadBuildStep5")}</li>
          </ol>
        </div>
      )}
    </div>
  );
}

/* ── PROD sem release: estado curto (sem bloco de env vars) ── */
function ProdPublishCTA() {
  const { t } = useTranslation("config");
  return (
    <p className={styles.downloadNote} data-testid="desktop-prod-publish-cta">
      {t("devices.downloadPackagePreparing")}
    </p>
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
  const { t } = useTranslation("config");
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
      <div
        className={styles.downloadSection}
        data-testid="desktop-download-unpublished-note"
      >
        <p className={styles.downloadNote} style={{ marginBottom: 12 }}>
          {t("devices.downloadInstallerIncludesKds")}
        </p>
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
        {targets.map((target) => (
          <div
            key={target.os}
            className={`${styles.downloadCard} ${
              target.highlighted ? styles.downloadCardHighlighted : ""
            }`}
          >
            {target.href ? (
              <button
                type="button"
                className={styles.downloadLink}
                data-testid={`desktop-download-${target.os}`}
                onClick={() => {
                  const url = target.href ?? "";
                  if (!url || !/^https?:\/\//i.test(url)) return;
                  try {
                    const targetOrigin = new URL(url).origin;
                    const pageOrigin = window.location.origin;
                    const norm = (o: string) =>
                      o.replace(/^https?:\/\/127\.0\.0\.1(:\d+)?$/i, "http://localhost$1");
                    if (norm(targetOrigin) === norm(pageOrigin)) {
                      return;
                    }
                    window.open(url, "_blank", "noopener,noreferrer");
                  } catch {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                <span className={styles.downloadIcon}>{target.icon}</span>
                <div className={styles.downloadInfo}>
                  <span className={styles.downloadLabel}>
                    {t("devices.downloadFor", { label: target.label })}
                  </span>
                  <span className={styles.downloadFile}>{target.file}</span>
                </div>
                {target.highlighted && (
                  <span className={styles.downloadBadge}>{t("devices.downloadYourSystem")}</span>
                )}
              </button>
            ) : (
              <div className={styles.downloadInfo}>
                <span className={styles.downloadIcon}>{target.icon}</span>
                <div>
                  <span className={styles.downloadLabel}>{target.label}</span>
                  <span className={styles.downloadFile}>{t("devices.downloadInvalidUrl")}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.downloadFooter}>
        <span className={styles.downloadNote}>
          {t("devices.downloadFooterNote")}
        </span>
      </div>
      {onVerify && healthStatus !== "detected" && (
        <div className={styles.postDownloadVerify}>
          <span className={styles.postDownloadVerifyLabel}>
            {t("devices.downloadInstallComplete")}
          </span>
          <button
            type="button"
            className={styles.verifyBtn}
            onClick={onVerify}
            data-testid="desktop-verify-install-btn"
          >
            {healthStatus === "checking" ? t("devices.downloadVerifying") : t("devices.downloadVerify")}
          </button>
        </div>
      )}
    </div>
  );
}
