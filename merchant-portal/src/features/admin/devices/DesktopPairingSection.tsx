/**
 * DesktopPairingSection — Code-based pairing for desktop devices (TPV/KDS).
 *
 * Instead of QR (which doesn't make sense for the same desktop machine),
 * admin generates a short 6-char alphanumeric code (XXXX-XX). The desktop
 * app user enters this code on first launch to pair the device.
 *
 * Ref: DESKTOP_DISTRIBUTION_CONTRACT, OPERATIONAL_INSTALLATION_CONTRACT.
 */

import { useCallback, useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { Link } from "react-router-dom";
import styles from "./AdminDevicesPage.module.css";
import {
  createDevicePairingCode,
  type InstallToken,
  type TerminalType,
} from "./api/devicesApi";

const DESKTOP_TYPES: { value: TerminalType; label: string }[] = [
  { value: "TPV", label: "TPV (Caja)" },
  { value: "KDS", label: "KDS (Cocina)" },
];

export interface DesktopPairingSectionProps {
  /** Called when a new code is generated so parent can auto-refresh terminal list. */
  onCodeGenerated?: () => void;
}

export function DesktopPairingSection({
  onCodeGenerated,
}: DesktopPairingSectionProps) {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [deviceType, setDeviceType] = useState<TerminalType>("TPV");
  const [deviceName, setDeviceName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<InstallToken | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!activeToken) return;
    const expires = new Date(activeToken.expires_at).getTime();
    const tick = () => {
      const left = Math.max(0, Math.ceil((expires - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) setActiveToken(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeToken]);

  const handleGenerate = useCallback(async () => {
    if (!restaurantId) return;
    setGenerating(true);
    setError(null);
    setCopied(false);
    try {
      const tok = await createDevicePairingCode(
        restaurantId,
        deviceType,
        deviceName.trim() || undefined,
      );
      setActiveToken(tok);
      onCodeGenerated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al generar código");
    } finally {
      setGenerating(false);
    }
  }, [restaurantId, deviceType, deviceName, onCodeGenerated]);

  const handleCopy = useCallback(() => {
    const code = (activeToken as { pairing_code?: string })?.pairing_code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeToken]);

  const pairingCode = (activeToken as { pairing_code?: string })?.pairing_code;

  return (
    <div className={styles.desktopPairingContainer}>
      <div className={styles.desktopPairingHeader}>
        <span className={styles.desktopPairingIcon}>🖥️</span>
        <div>
          <h3 className={styles.desktopPairingTitle}>
            Vincular dispositivo de escritorio
          </h3>
          <p className={styles.desktopPairingSubtitle}>
            Genera un código y escríbelo en la aplicación de escritorio para
            vincular este equipo como TPV o KDS.
          </p>
          <p className={styles.desktopPairingSubtitle}>
            <Link to="/admin/config/general">comingSoon.learnMore</Link>
          </p>
        </div>
      </div>

      <div className={styles.formRow}>
        <label className={styles.fieldLabel}>
          Tipo
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as TerminalType)}
            className={styles.selectInput}
          >
            {DESKTOP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldLabelFlex}>
          Nombre (opcional)
          <input
            type="text"
            placeholder="ej: TPV_BALCAO_01"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className={styles.textInput}
          />
        </label>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!restaurantId || generating}
          className={styles.btnGenerate}
        >
          {generating ? "Generando…" : "Generar código"}
        </button>
      </div>

      {error && <div className={styles.tokenError}>{error}</div>}

      {pairingCode && secondsLeft > 0 && (
        <div className={styles.pairingCodeDisplay}>
          <div className={styles.pairingCodeValue}>{pairingCode}</div>
          <div className={styles.pairingCodeMeta}>
            <span
              className={
                secondsLeft < 60 ? styles.expiryCritical : styles.expiryNormal
              }
            >
              Expira en <strong>{secondsLeft}s</strong>
            </span>
            <span className={styles.pairingCodeType}>
              Tipo: <strong>{activeToken?.device_type}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={styles.pairingCodeCopyBtn}
          >
            {copied ? "✓ Copiado" : "Copiar código"}
          </button>
          <p className={styles.pairingCodeHint}>
            Introduce este código en la aplicación de escritorio ChefIApp al
            iniciarla por primera vez.
          </p>
        </div>
      )}
    </div>
  );
}
