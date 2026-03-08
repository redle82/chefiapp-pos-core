/**
 * DesktopDownloadSection — Platform-aware download buttons for TPV/KDS desktop app.
 *
 * Detects the admin's OS and highlights the appropriate download button.
 * For P0: download URLs point to GitHub Releases (or a configurable base URL).
 * When releases aren't available yet, buttons show a "próximamente" badge.
 *
 * Replaces the previous DesktopComingSoonBanner (UXG-011).
 * Ref: DESKTOP_DISTRIBUTION_CONTRACT.
 */

import { getDesktopOS } from "../../../core/operational/platformDetection";
import styles from "./AdminDevicesPage.module.css";

const EARLY_ACCESS_MAILTO =
  "mailto:soporte@chefiapp.com?subject=Acceso%20anticipado%20TPV/KDS%20desktop";

/**
 * Base URL for desktop downloads. In production, points to GitHub Releases or CDN.
 * Configurable via VITE_DESKTOP_DOWNLOAD_BASE env var.
 */
const DOWNLOAD_BASE =
  import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE ??
  "https://github.com/goldmonkey777/ChefIApp-POS-CORE/releases/latest/download";

interface DownloadTarget {
  os: string;
  label: string;
  icon: string;
  file: string;
  highlighted: boolean;
}

function getDownloadTargets(): DownloadTarget[] {
  const adminOS = getDesktopOS();
  return [
    {
      os: "macos",
      label: "macOS",
      icon: "🍎",
      file: "ChefIApp-Desktop.dmg",
      highlighted: adminOS === "macos",
    },
    {
      os: "windows",
      label: "Windows",
      icon: "🪟",
      file: "ChefIApp-Desktop-Setup.exe",
      highlighted: adminOS === "windows",
    },
  ];
}

/** Whether actual desktop releases are available (flip to true when P1 ships). */
const RELEASES_AVAILABLE = false;

export function DesktopDownloadSection() {
  const targets = getDownloadTargets();

  return (
    <div className={styles.downloadSection}>
      <div className={styles.downloadGrid}>
        {targets.map((t) => (
          <a
            key={t.os}
            href={RELEASES_AVAILABLE ? `${DOWNLOAD_BASE}/${t.file}` : undefined}
            className={`${styles.downloadCard} ${
              t.highlighted ? styles.downloadCardHighlighted : ""
            } ${!RELEASES_AVAILABLE ? styles.downloadCardPending : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={
              RELEASES_AVAILABLE
                ? undefined
                : (e) => {
                    e.preventDefault();
                  }
            }
          >
            <span className={styles.downloadIcon}>{t.icon}</span>
            <div className={styles.downloadInfo}>
              <span className={styles.downloadLabel}>
                Descargar para {t.label}
              </span>
              <span className={styles.downloadFile}>
                {RELEASES_AVAILABLE ? t.file : "Próximamente"}
              </span>
            </div>
            {t.highlighted && (
              <span className={styles.downloadBadge}>Tu sistema</span>
            )}
            {!RELEASES_AVAILABLE && (
              <span className={styles.downloadPendingBadge}>En desarrollo</span>
            )}
          </a>
        ))}
      </div>

      <div className={styles.downloadFooter}>
        <a
          href={EARLY_ACCESS_MAILTO}
          className={styles.downloadEarlyAccess}
          target="_blank"
          rel="noopener noreferrer"
        >
          📧 Solicitar acceso anticipado
        </a>
        <span className={styles.downloadNote}>
          La aplicación de escritorio incluye TPV y KDS en un solo instalador.
        </span>
      </div>
    </div>
  );
}
