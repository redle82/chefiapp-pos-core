/**
 * InstallQRPanel — Platform-aware QR codes for device provisioning
 *
 * Differentiates between:
 *   - Mobile types (APPSTAFF, WAITER): iOS/Android column layout with platform instructions
 *   - Desktop types (TPV, KDS): single QR + linkage code, no iOS/Android confusion
 *
 * Ref: UXG-012 / Issue #20
 *
 * Props:
 *   - token: Install token string
 *   - deviceType: Terminal type (APPSTAFF, TPV, KDS)
 *   - secondsLeft: TTL countdown
 *   - baseUrl: Base URL for QR (ex: http://192.168.1.x:5175)
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import styles from "./AdminDevicesPage.module.css";

export interface InstallQRPanelProps {
  token: string;
  deviceType: string;
  secondsLeft: number;
  baseUrl: string;
}

const DESKTOP_TYPES = ["TPV", "KDS"];

export function InstallQRPanel({
  token,
  deviceType,
  secondsLeft,
  baseUrl,
}: InstallQRPanelProps) {
  const { t } = useTranslation("devices");
  const standardUrl = `${baseUrl}/install?token=${token}`;
  const isCritical = secondsLeft < 60;
  const isDesktopType = DESKTOP_TYPES.includes(deviceType.toUpperCase());

  return (
    <div className={styles.qrPanelContainer}>
      {/* Header */}
      <div className={styles.qrPanelHeader}>
        <div className={styles.qrHeaderTitle}>
          {isDesktopType ? t("qr.desktopLinkTitle") : t("qr.mobileLinkTitle")}
        </div>
        <div
          className={isCritical ? styles.expiryCritical : styles.expiryNormal}
        >
          Expira en <strong>{secondsLeft}s</strong>
        </div>
      </div>

      {isDesktopType ? (
        <DesktopQRSection url={standardUrl} deviceType={deviceType} />
      ) : (
        <MobileQRSection
          standardUrl={standardUrl}
          baseUrl={baseUrl}
          token={token}
        />
      )}

      {/* Metadata */}
      <div className={styles.qrMetadata}>
        <div>
          Tipo: <strong>{deviceType}</strong>
        </div>
        <div>
          Token: <strong>{token.substring(0, 12)}...</strong>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop QR — single QR + copyable code, no iOS/Android columns    */
/* ------------------------------------------------------------------ */
function DesktopQRSection({
  url,
  deviceType,
}: {
  url: string;
  deviceType: string;
}) {
  const { t } = useTranslation("devices");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [url]);

  return (
    <div className={styles.qrDesktopSection}>
      <div className={styles.qrDesktopMain}>
        <div className={styles.qrBox}>
          <QRCode value={url} size={180} level="H" />
        </div>
        <div className={styles.qrDesktopInstructions}>
          <p className={styles.qrDesktopHint}>
            {t("qr.desktopHint", { deviceType })}
          </p>
          <div className={styles.qrDesktopNotice}>
            <span className={styles.qrDesktopNoticeIcon}>🚧</span>
            {t("qr.desktopComingSoon")}
          </div>
          <div className={styles.qrDesktopCopyRow}>
            <code className={styles.qrDesktopCode}>{url}</code>
            <button
              type="button"
              onClick={handleCopy}
              className={styles.qrDesktopCopyBtn}
            >
              {copied ? `✓ ${t("qr.copied")}` : t("qr.copyUrl")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile QR — original iOS / Android two-column layout              */
/* ------------------------------------------------------------------ */
function MobileQRSection({
  standardUrl,
  baseUrl,
  token,
}: {
  standardUrl: string;
  baseUrl: string;
  token: string;
}) {
  const androidIntentUrl = `intent://${baseUrl.replace(
    /^https?:\/\//,
    "",
  )}/install?token=${token}#Intent;package=com.android.chrome;scheme=http;end`;

  return (
    <div className={styles.qrPlatformRow}>
      {/* iOS Column */}
      <div className={styles.qrPlatformCol}>
        <div className={styles.qrPlatformHeader}>
          <div className={styles.qrPlatformIcon}>🍎</div>
          <div className={styles.qrPlatformName}>iPhone / iPad</div>
          <div className={styles.qrPlatformBrowser}>Safari</div>
        </div>

        <div className={styles.qrBox}>
          <QRCode value={standardUrl} size={150} level="H" />
        </div>

        <div className={styles.qrPlatformInstructions}>
          <ol>
            <li>Abra la app Cámara en el iPhone</li>
            <li>Escanee este código QR</li>
            <li>Toque el enlace que aparece</li>
            <li>
              Si pregunta qué navegador, seleccione <strong>Safari</strong>
            </li>
            <li>Acepte la instalación de la app</li>
          </ol>
        </div>

        <code className={styles.qrUrlSmall}>{standardUrl}</code>
        <div className={styles.iosNote}>
          ℹ️ Si se abre en otro navegador por error, vuelva atrás y repita
          seleccionando Safari.
        </div>
      </div>

      {/* Android Column */}
      <div className={styles.qrPlatformCol}>
        <div className={styles.qrPlatformHeader}>
          <div className={styles.qrPlatformIcon}>🤖</div>
          <div className={styles.qrPlatformName}>Android</div>
          <div className={styles.qrPlatformBrowser}>Chrome</div>
        </div>

        <div className={styles.qrBox}>
          <QRCode value={androidIntentUrl} size={150} level="H" />
        </div>

        <div className={styles.qrPlatformInstructions}>
          <ol>
            <li>Abra Chrome en Android</li>
            <li>Escanee este código QR</li>
            <li>Acepte la instalación de la app</li>
          </ol>
        </div>

        <code className={styles.qrUrlSmall}>
          {androidIntentUrl.substring(0, 40)}...
        </code>
      </div>
    </div>
  );
}
