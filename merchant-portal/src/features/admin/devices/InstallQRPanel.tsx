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
  const { t } = useTranslation();

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
            Expira em <strong>{secondsLeft}s</strong>
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
              Copiar URL
            </button>
          </div>
        </div>

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
          Expira em <strong>{secondsLeft}s</strong>
        </div>
      </div>

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
              <li>Abra a aplicação Câmara no iPhone</li>
              <li>Digitalize este código QR</li>
              <li>Toque no link que aparece</li>
              <li>
                Se perguntar qual browser, selecione <strong>Safari</strong>
              </li>
              <li>Aceite a instalação da app</li>
            </ol>
          </div>

          <code className={styles.qrUrlSmall}>{standardUrl}</code>
          <div className={styles.iosNote}>
            ℹ️ Se abrir noutro browser por erro, volte atrás e repita
            selecionando Safari.
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
              <li>Abra Chrome no Android</li>
              <li>Digitalize este código QR</li>
              <li>Aceite a instalação da app</li>
            </ol>
          </div>

          <code className={styles.qrUrlSmall}>
            {androidIntentUrl.substring(0, 40)}...
          </code>
        </div>
      </div>

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
