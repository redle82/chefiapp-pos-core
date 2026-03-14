/**
 * TPVNotificationBar — Barra de alertas do TPV HUB.
 *
 * Mostra alertas provenientes do TPVCentralEvents:
 * - Pressão da cozinha (alta/média/normalizada)
 * - Exceções de pedidos
 * - Alertas de mesas
 * - Broadcasts do operador
 *
 * Integrado via useTPVEventBridge.
 */

import { useTranslation } from "react-i18next";
import { useFormatLocale } from "../../../core/i18n/useFormatLocale";
import type { TPVAlert } from "../hooks/useTPVEventBridge";

interface TPVNotificationBarProps {
  alerts: TPVAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const SEVERITY_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  critical: {
    bg: "rgba(220,38,38,0.1)",
    border: "#dc2626",
    text: "#fca5a5",
  },
  warning: {
    bg: "rgba(234,179,8,0.1)",
    border: "#eab308",
    text: "#fde68a",
  },
  info: {
    bg: "rgba(59,130,246,0.1)",
    border: "#3b82f6",
    text: "#93c5fd",
  },
};

export function TPVNotificationBar({
  alerts,
  onDismiss,
  onDismissAll,
}: TPVNotificationBarProps) {
  const locale = useFormatLocale();
  const { t } = useTranslation();
  if (alerts.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "4px 12px",
        backgroundColor: "var(--surface-base, #0a0a0a)",
        borderBottom: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-tertiary, #737373)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Alertas ({alerts.length})
        </span>
        {alerts.length > 1 && (
          <button
            onClick={onDismissAll}
            style={{
              border: "none",
              background: "none",
              fontSize: 10,
              color: "var(--text-tertiary, #737373)",
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            Limpar tudo
          </button>
        )}
      </div>
      {alerts.slice(0, 3).map((alert) => {
        const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
        return (
          <div
            key={alert.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: style.bg,
              borderLeft: `3px solid ${style.border}`,
              fontSize: 12,
              color: style.text,
            }}
          >
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {alert.message}
            </span>
            <span
              style={{
                fontSize: 9,
                color: "var(--text-tertiary, #737373)",
                whiteSpace: "nowrap",
              }}
            >
              {alert.timestamp.toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={() => onDismiss(alert.id)}
              style={{
                border: "none",
                background: "none",
                fontSize: 12,
                color: "var(--text-tertiary, #737373)",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1,
              }}
              title={t("common:close")}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
