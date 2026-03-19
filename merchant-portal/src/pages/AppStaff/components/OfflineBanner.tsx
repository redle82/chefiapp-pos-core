/**
 * OfflineBanner — Banner de estado de conexão para AppStaff.
 *
 * Mostra:
 * - Banner vermelho quando offline
 * - Banner verde temporário quando reconecta
 * - Badge de ações pendentes para sync
 */

import { useOnlineStatus } from "../hooks/useOnlineStatus";

const offlineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "8px 16px",
  background: "rgba(239, 68, 68, 0.15)",
  borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
  color: "#f87171",
  fontSize: 13,
  fontWeight: 600,
  flexShrink: 0,
};

const onlineStyle: React.CSSProperties = {
  ...offlineStyle,
  background: "rgba(34, 197, 94, 0.1)",
  borderBottomColor: "rgba(34, 197, 94, 0.2)",
  color: "#4ade80",
};

const pendingBadge: React.CSSProperties = {
  background: "rgba(245, 158, 11, 0.2)",
  color: "#fbbf24",
  fontSize: 11,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 10,
};

export function OfflineBanner() {
  const { isOnline, wasOffline, pendingSync } = useOnlineStatus();

  if (isOnline && !wasOffline && pendingSync === 0) return null;

  if (!isOnline) {
    return (
      <div style={offlineStyle}>
        <span>📡</span>
        <span>Sem conexão — a trabalhar offline</span>
        {pendingSync > 0 && (
          <span style={pendingBadge}>
            {pendingSync} pendente{pendingSync !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div style={onlineStyle}>
        <span>✅</span>
        <span>De volta online</span>
        {pendingSync > 0 && (
          <span style={pendingBadge}>
            A sincronizar {pendingSync} ação{pendingSync !== 1 ? "ões" : ""}...
          </span>
        )}
      </div>
    );
  }

  return null;
}
