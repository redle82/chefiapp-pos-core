/**
 * InstallQRPanel — Platform-specific QR codes for device provisioning.
 *
 * APPSTAFF (mobile staff):
 *   - Two QR codes (iOS + Android) with platform-specific instructions.
 *
 * TPV/KDS (desktop-only operational modules):
 *   - Single desktop QR and a \"Copiar URL\" action, sem instruções mobile.
 *
 * Props:
 *   - token: Install token string
 *   - deviceType: Terminal type (APPSTAFF, TPV, KDS)
 *   - secondsLeft: TTL countdown
 *   - baseUrl: Base URL for QR (ex: http://192.168.1.x:5175)
 */

import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import styles from "./AdminDevicesPage.module.css";

export interface InstallQRPanelProps {
  token: string;
  deviceType: string;
  secondsLeft: number;
  baseUrl: string;
}

export function InstallQRPanel({
  token,
  deviceType,
  secondsLeft,
  baseUrl,
}: InstallQRPanelProps) {
  const { t } = useTranslation("config");

  const standardUrl = `${baseUrl}/install?token=${token}`;
  const isCritical = secondsLeft < 60;
  const isDesktop = deviceType === "TPV" || deviceType === "KDS";

  // Desktop TPV/KDS: single QR + desktop copy URL action, sem instruções mobile.
  if (isDesktop) {
    return (
      <div className={styles.qrPanelContainer}>
        <div className={styles.qrPanelHeader}>
          <div className={styles.qrHeaderTitle}>
            {t("qr.desktopLinkTitle")}
          </div>
          <div
            className={isCritical ? styles.expiryCritical : styles.expiryNormal}
          >
            {t("qr.expiresIn")} <strong>{secondsLeft}s</strong>
          </div>
        </div>

        <div className={styles.qrPlatformRow}>
          <div className={styles.qrPlatformCol}>
            <div className={styles.qrBox}>
              <QRCode value={standardUrl} size={150} level="H" />
            </div>
            <code className={styles.qrUrlSmall}>{standardUrl}</code>
            <button
              type="button"
              className={styles.qrCopyButton}
              onClick={async () => {
                try {
                  if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(standardUrl);
                  }
                } catch {
                  // ignore clipboard errors in this context
                }
              }}
            >
              {t("qr.copyUrl")}
            </button>
          </div>
        </div>

        <div className={styles.qrMetadata}>
          <div>
            {t("qr.typeLabel")} <strong>{deviceType}</strong>
          </div>
          <div>
            {t("qr.tokenLabel")} <strong>{token.substring(0, 12)}...</strong>
          </div>
        </div>
      </div>
    );
  }

  // APPSTAFF/mobile: iOS + Android panels com instruções.
  const androidIntentUrl = `intent://${baseUrl.replace(
    /^https?:\/\//,
    "",
  )}/install?token=${token}#Intent;package=com.android.chrome;scheme=http;end`;

  return (
    <div className={styles.qrPanelContainer}>
      <div className={styles.qrPanelHeader}>
        <div className={styles.qrHeaderTitle}>
          {t("qr.mobileLinkTitle")}
        </div>
        <div
          className={isCritical ? styles.expiryCritical : styles.expiryNormal}
        >
          {t("qr.expiresIn")} <strong>{secondsLeft}s</strong>
        </div>
      </div>

      <div className={styles.qrPlatformRow}>
        {/* iOS Column */}
        <div className={styles.qrPlatformCol}>
          <div className={styles.qrPlatformHeader}>
            <div className={styles.qrPlatformIcon}>🍎</div>
            <div className={styles.qrPlatformName}>{t("qr.iosName")}</div>
            <div className={styles.qrPlatformBrowser}>{t("qr.iosBrowser")}</div>
          </div>

          <div className={styles.qrBox}>
            <QRCode value={standardUrl} size={150} level="H" />
          </div>

          <div className={styles.qrPlatformInstructions}>
            <ol>
              <li>{t("qr.iosStep1")}</li>
              <li>{t("qr.iosStep2")}</li>
              <li>{t("qr.iosStep3")}</li>
              <li>{t("qr.iosStep4")}</li>
              <li>{t("qr.iosStep5")}</li>
            </ol>
          </div>

          <code className={styles.qrUrlSmall}>{standardUrl}</code>
          <div className={styles.iosNote}>
            ℹ️ {t("qr.iosNote")}
          </div>
        </div>

        {/* Android Column */}
        <div className={styles.qrPlatformCol}>
          <div className={styles.qrPlatformHeader}>
            <div className={styles.qrPlatformIcon}>🤖</div>
            <div className={styles.qrPlatformName}>{t("qr.androidName")}</div>
            <div className={styles.qrPlatformBrowser}>{t("qr.androidBrowser")}</div>
          </div>

          <div className={styles.qrBox}>
            <QRCode value={androidIntentUrl} size={150} level="H" />
          </div>

          <div className={styles.qrPlatformInstructions}>
            <ol>
              <li>{t("qr.androidStep1")}</li>
              <li>{t("qr.androidStep2")}</li>
              <li>{t("qr.androidStep3")}</li>
            </ol>
          </div>

          <code className={styles.qrUrlSmall}>
            {androidIntentUrl.substring(0, 40)}...
          </code>
        </div>
      </div>

      <div className={styles.qrMetadata}>
        <div>
          {t("qr.typeLabel")} <strong>{deviceType}</strong>
        </div>
        <div>
          {t("qr.tokenLabel")} <strong>{token.substring(0, 12)}...</strong>
        </div>
      </div>
    </div>
  );
}
