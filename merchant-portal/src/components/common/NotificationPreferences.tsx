/**
 * NotificationPreferences — Compact settings panel for push notification configuration.
 *
 * Features:
 * - Global notifications toggle
 * - Sound on/off toggle
 * - Per-channel toggles (filtered by current role)
 * - Permission request button when not yet granted
 * - Current permission status display
 *
 * Designed to fit inside a Settings page. Dark theme, Tailwind-compatible inline styles.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  pushNotificationService,
  type NotificationPreferences as NotificationPrefs,
  type PermissionStatus,
} from "../../core/notifications/PushNotificationService";
import {
  getChannelsForRole,
  type StaffRole,
  type NotificationChannel,
} from "../../core/notifications/NotificationChannels";

/* ── Props ────────────────────────────────────────────────────────────── */

interface NotificationPreferencesProps {
  /** Current operator role. Determines which channels are shown. */
  role: StaffRole;
  /** Optional: compact mode hides descriptions */
  compact?: boolean;
}

/* ── Styles ───────────────────────────────────────────────────────────── */

const sectionStyle: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 20,
};

const labelStyle: React.CSSProperties = {
  color: "#e5e5e5",
  fontSize: 14,
  fontWeight: 500,
};

const descStyle: React.CSSProperties = {
  color: "#737373",
  fontSize: 12,
  marginTop: 2,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

const toggleTrackStyle = (on: boolean): React.CSSProperties => ({
  position: "relative",
  width: 40,
  height: 22,
  borderRadius: 11,
  backgroundColor: on ? "#f97316" : "#404040",
  cursor: "pointer",
  transition: "background-color 0.2s",
  flexShrink: 0,
  border: "none",
  padding: 0,
});

const toggleKnobStyle = (on: boolean): React.CSSProperties => ({
  position: "absolute",
  top: 2,
  left: on ? 20 : 2,
  width: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: "#fff",
  transition: "left 0.2s",
  pointerEvents: "none",
});

/* ── Permission Badge ─────────────────────────────────────────────────── */

function PermissionBadge({ status }: { status: PermissionStatus }) {
  const { t } = useTranslation("tpv");

  const colorMap: Record<PermissionStatus, { bg: string; text: string }> = {
    granted: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
    denied: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
    default: { bg: "rgba(234,179,8,0.15)", text: "#eab308" },
  };

  const labelMap: Record<PermissionStatus, string> = {
    granted: t("notifications.permissionGranted"),
    denied: t("notifications.permissionDenied"),
    default: t("notifications.permissionDefault"),
  };

  const { bg, text } = colorMap[status];

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 10,
        backgroundColor: bg,
        color: text,
      }}
    >
      {labelMap[status]}
    </span>
  );
}

/* ── Toggle Component ─────────────────────────────────────────────────── */

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      style={{
        ...toggleTrackStyle(on && !disabled),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      aria-pressed={on}
      aria-disabled={disabled}
    >
      <div style={toggleKnobStyle(on && !disabled)} />
    </button>
  );
}

/* ── Main Component ───────────────────────────────────────────────────── */

export function NotificationPreferences({
  role,
  compact,
}: NotificationPreferencesProps) {
  const { t } = useTranslation("tpv");
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    pushNotificationService.getPreferences(),
  );
  const [permStatus, setPermStatus] = useState<PermissionStatus>(
    pushNotificationService.getPermissionStatus(),
  );
  const [requesting, setRequesting] = useState(false);

  const channels = getChannelsForRole(role);

  // Reload permission status periodically (it can change externally)
  useEffect(() => {
    const interval = setInterval(() => {
      setPermStatus(pushNotificationService.getPermissionStatus());
    }, 5_000);
    return () => clearInterval(interval);
  }, []);

  const updatePrefs = useCallback(
    (partial: Partial<NotificationPrefs>) => {
      const updated = { ...prefs, ...partial };
      setPrefs(updated);
      pushNotificationService.savePreferences(updated);
    },
    [prefs],
  );

  const toggleChannel = useCallback(
    (channelId: string, enabled: boolean) => {
      const overrides = { ...prefs.channelOverrides, [channelId]: enabled };
      updatePrefs({ channelOverrides: overrides });
    },
    [prefs.channelOverrides, updatePrefs],
  );

  const handleRequestPermission = useCallback(async () => {
    setRequesting(true);
    const result = await pushNotificationService.requestPermission();
    setPermStatus(result);
    setRequesting(false);
  }, []);

  // Group channels by role category for display
  const groupedChannels = channels.reduce<
    Record<string, NotificationChannel[]>
  >((acc, ch) => {
    const group = ch.id.split(".")[0]; // kitchen, waiter, manager, cashier
    if (!acc[group]) acc[group] = [];
    acc[group].push(ch);
    return acc;
  }, {});

  const groupLabelMap: Record<string, string> = {
    kitchen: t("notifications.groupKitchen"),
    waiter: t("notifications.groupWaiter"),
    manager: t("notifications.groupManager"),
    cashier: t("notifications.groupCashier"),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Header ───────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ ...labelStyle, fontSize: 16, fontWeight: 600, margin: 0 }}>
              {t("notifications.title")}
            </h3>
            {!compact && (
              <p style={{ ...descStyle, marginTop: 4 }}>
                {t("notifications.subtitle")}
              </p>
            )}
          </div>
          <PermissionBadge status={permStatus} />
        </div>

        {/* Permission request */}
        {permStatus !== "granted" && (
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={requesting || permStatus === "denied"}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid rgba(249,115,22,0.3)",
              backgroundColor: "rgba(249,115,22,0.1)",
              color: permStatus === "denied" ? "#737373" : "#f97316",
              fontSize: 13,
              fontWeight: 600,
              cursor: permStatus === "denied" ? "not-allowed" : "pointer",
              marginBottom: 16,
              transition: "background-color 0.15s",
            }}
          >
            {requesting
              ? t("notifications.requesting")
              : permStatus === "denied"
                ? t("notifications.permissionBlockedHint")
                : t("notifications.requestPermission")}
          </button>
        )}

        {/* Global toggles */}
        <div style={rowStyle}>
          <div>
            <div style={labelStyle}>{t("notifications.enableAll")}</div>
            {!compact && (
              <div style={descStyle}>{t("notifications.enableAllDesc")}</div>
            )}
          </div>
          <Toggle
            on={prefs.enabled}
            onChange={(val) => updatePrefs({ enabled: val })}
          />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={labelStyle}>{t("notifications.sound")}</div>
            {!compact && (
              <div style={descStyle}>{t("notifications.soundDesc")}</div>
            )}
          </div>
          <Toggle
            on={prefs.soundEnabled}
            onChange={(val) => updatePrefs({ soundEnabled: val })}
            disabled={!prefs.enabled}
          />
        </div>

        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div>
            <div style={labelStyle}>{t("notifications.vibrate")}</div>
            {!compact && (
              <div style={descStyle}>{t("notifications.vibrateDesc")}</div>
            )}
          </div>
          <Toggle
            on={prefs.vibrateEnabled}
            onChange={(val) => updatePrefs({ vibrateEnabled: val })}
            disabled={!prefs.enabled}
          />
        </div>
      </div>

      {/* ── Per-Channel Toggles ──────────────────────────── */}
      {prefs.enabled && Object.keys(groupedChannels).length > 0 && (
        <div style={sectionStyle}>
          <h3
            style={{
              ...labelStyle,
              fontSize: 14,
              fontWeight: 600,
              margin: "0 0 12px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#a3a3a3",
            }}
          >
            {t("notifications.channelsTitle")}
          </h3>

          {Object.entries(groupedChannels).map(([group, chs]) => (
            <div key={group} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#737373",
                  marginBottom: 6,
                  paddingTop: 8,
                }}
              >
                {groupLabelMap[group] ?? group}
              </div>
              {chs.map((ch, idx) => {
                const isLast = idx === chs.length - 1;
                const channelEnabled =
                  prefs.channelOverrides[ch.id] ?? ch.defaultEnabled;
                return (
                  <div
                    key={ch.id}
                    style={{
                      ...rowStyle,
                      borderBottom: isLast
                        ? "none"
                        : "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{ch.icon}</span>
                      <div>
                        <div style={labelStyle}>{t(ch.labelKey)}</div>
                        {!compact && (
                          <div style={descStyle}>{t(ch.descriptionKey)}</div>
                        )}
                      </div>
                    </div>
                    <Toggle
                      on={channelEnabled}
                      onChange={(val) => toggleChannel(ch.id, val)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
