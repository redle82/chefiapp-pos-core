/**
 * InstallQRPanel — Platform-specific QR codes for device provisioning
 *
 * Shows separate QRs for iOS (Safari) and Android (Chrome) with platform-specific instructions.
 * iOS: Standard HTTP URL - user opens with camera, system asks which browser, user selects Safari
 * Android: uses intent:// URL that auto-launches in Chrome
 *
 * Props:
 *   - token: Install token string
 *   - deviceType: Terminal type (APPSTAFF, TPV, KDS)
 *   - secondsLeft: TTL countdown
 *   - baseUrl: Base URL for QR (ex: http://192.168.1.x:5175)
 */

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
  // iOS & Android: use standard HTTP URL (works with camera QR reader)
  // iOS will open with default browser - user should select Safari
  // Android: use intent:// to auto-open Chrome
  const standardUrl = `${baseUrl}/install?token=${token}`;

  // Android: use intent:// to auto-open in Chrome
  const androidIntentUrl = `intent://${baseUrl.replace(
    /^https?:\/\//,
    "",
  )}/install?token=${token}#Intent;package=com.android.chrome;scheme=http;end`;

  const isCritical = secondsLeft < 60;

  return (
    <div className={styles.qrPanelContainer}>
      {/* Header */}
      <div className={styles.qrPanelHeader}>
        <div className={styles.qrHeaderTitle}>Código QR por Plataforma</div>
        <div
          className={isCritical ? styles.expiryCritical : styles.expiryNormal}
        >
          Expira em <strong>{secondsLeft}s</strong>
        </div>
      </div>

      {/* Two column layout: iOS | Android */}
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
