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
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import styles from "./AdminDevicesPage.module.css";
import {
  createDevicePairingCode,
  type InstallToken,
  type TerminalType,
} from "./api/devicesApi";

export interface DesktopPairingSectionProps {
  /** Called when a new code is generated so parent can auto-refresh terminal list. */
  onCodeGenerated?: () => void;
}

const DESKTOP_TYPE_IDS: TerminalType[] = ["TPV", "KDS"];

export function DesktopPairingSection({
  onCodeGenerated,
}: DesktopPairingSectionProps) {
  const { t } = useTranslation("config");
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [deviceType, setDeviceType] = useState<TerminalType>("TPV");
  const [deviceName, setDeviceName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<InstallToken | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  const getTypeLabel = (type: TerminalType) =>
    type === "TPV" ? t("devices.tpvLabel") : t("devices.kdsLabel");

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
      setError(
        err instanceof Error ? err.message : t("devices.errorGenerateCode"),
      );
    } finally {
      setGenerating(false);
    }
  }, [restaurantId, deviceType, deviceName, onCodeGenerated, t]);

  const handleCopy = useCallback(() => {
    const code = (activeToken as { pairing_code?: string })?.pairing_code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeToken]);

  const pairingCode = (activeToken as { pairing_code?: string })?.pairing_code;

  // TPV pairing lives on the canonical page /admin/devices/tpv (single source of truth)
  if (deviceType === "TPV") {
    return (
      <div className={styles.desktopPairingContainer} data-block="pairing-tpv-redirect-v2">
        <div className={styles.desktopPairingHeader}>
          <span className={styles.desktopPairingIcon}>🖥️</span>
          <div>
            <h3 className={styles.desktopPairingTitle}>
              {t("devices.pairingTitle")}
            </h3>
            <p className={styles.desktopPairingSubtitle}>
              {t("devices.pairingTpvRedirectDesc")}
            </p>
            <p className={styles.desktopPairingSubtitle}>
              <Link to="/admin/devices/tpv" className={styles.tpvDedicatedLink}>
                {t("devices.goToTpvPage")}
              </Link>
            </p>
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.fieldLabel}>
            {t("devices.typeLabel")}
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as TerminalType)}
              className={styles.selectInput}
            >
              {DESKTOP_TYPE_IDS.map((value) => (
                <option key={value} value={value}>
                  {getTypeLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.desktopPairingContainer}>
      <div className={styles.desktopPairingHeader}>
        <span className={styles.desktopPairingIcon}>🖥️</span>
        <div>
          <h3 className={styles.desktopPairingTitle}>
            {t("devices.pairingTitle")}
          </h3>
          <p className={styles.desktopPairingSubtitle}>
            {t("devices.pairingKdsDesc")}
          </p>
          <p className={styles.desktopPairingSubtitle}>
            <Link to="/admin/config/general" className={styles.tpvDedicatedLink}>
              {t("devices.learnMore")}
            </Link>
          </p>
        </div>
      </div>

      <div className={styles.formRow}>
        <label className={styles.fieldLabel}>
          {t("devices.typeLabel")}
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as TerminalType)}
            className={styles.selectInput}
          >
            {DESKTOP_TYPE_IDS.map((value) => (
              <option key={value} value={value}>
                {getTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldLabelFlex}>
          {t("devices.nameOptional")}
          <input
            type="text"
            placeholder={t("devices.namePlaceholder")}
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
          {generating ? t("devices.generating") : t("devices.generateCode")}
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
              {t("devices.expiresIn")} <strong>{secondsLeft}s</strong>
            </span>
            <span className={styles.pairingCodeType}>
              {t("devices.typeLabel")}: <strong>{activeToken?.device_type}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={styles.pairingCodeCopyBtn}
          >
            {copied ? `✓ ${t("devices.copied")}` : t("devices.copyCode")}
          </button>
          <p className={styles.pairingCodeHint}>
            {t("devices.pairingCodeHint")}
          </p>
        </div>
      )}
    </div>
  );
}
