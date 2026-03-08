/**
 * OrderStatusPanel — Painel lateral operacional expandido.
 *
 * Mostra:
 * - Tempo do pedido em andamento
 * - Status de envio (Não enviado / Enviado / Em preparo / Pronto)
 * - Indicador de impressora (Online/Offline)
 * - Botão "Enviar para cozinha"
 * - Botão "Segurar pedido"
 * - Botão "Dividir conta"
 *
 * Borda reativa: amarela se cozinha lenta, vermelha se crítica.
 */

import { useTranslation } from "react-i18next";
import { useCurrentOrderOperational } from "../../core/operational/hooks/useCurrentOrderOperational";
import { useHardwareStatus } from "../../core/operational/hooks/useHardwareStatus";
import { useOperationalKpis } from "../../core/operational/hooks/useOperationalKpis";

function formatElapsed(ms: number | null): string {
  if (ms == null || ms <= 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

const STATUS_LABELS: Record<string, string> = {};

function getStatusLabel(status: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    IDLE: t("common:status.idle"),
    DRAFT: t("common:status.draft"),
    NOT_SENT: t("common:status.notSent"),
    SENT: t("common:status.sent"),
    PREPARING: t("common:status.preparing"),
    READY: t("common:status.ready"),
    PAID: t("common:status.paid"),
    CANCELLED: t("common:status.cancelled"),
  };
  return map[status] ?? status;
}

const STATUS_COLORS: Record<string, string> = {
  IDLE: "#737373",
  DRAFT: "#a3a3a3",
  NOT_SENT: "#eab308",
  SENT: "#3b82f6",
  PREPARING: "#f97316",
  READY: "#22c55e",
  PAID: "#22c55e",
  CANCELLED: "#ef4444",
};

interface OrderStatusPanelProps {
  onSendToKitchen: () => void;
  onHoldOrder: () => void;
  onSplitBill: () => void;
  disabled?: boolean;
}

export function OrderStatusPanel({
  onSendToKitchen,
  onHoldOrder,
  onSplitBill,
  disabled = false,
}: OrderStatusPanelProps) {
  const { t } = useTranslation();
  const { currentOrder, elapsedSinceStartMs, elapsedSinceSentMs, isSlow } =
    useCurrentOrderOperational();
  const kpis = useOperationalKpis();
  const { hasAnyPrinterOffline, printerStatusByStation } = useHardwareStatus();

  const statusLabel = getStatusLabel(currentOrder.status, t);
  const statusColor = STATUS_COLORS[currentOrder.status] ?? "#a3a3a3";

  // Borda reativa baseada no estado da cozinha
  let borderColor = "rgba(255,255,255,0.08)";
  if (kpis.kitchenStatus === "RED" || isSlow) {
    borderColor = "#ef4444";
  } else if (kpis.kitchenStatus === "YELLOW") {
    borderColor = "#eab308";
  }

  const canSend =
    !disabled &&
    currentOrder.status === "DRAFT" &&
    currentOrder.orderId != null;

  const canHold = !disabled && currentOrder.status === "DRAFT";

  // Identificar estação da cozinha
  const kitchenPrinter = printerStatusByStation["kitchen"];
  const printerOnline = kitchenPrinter?.status === "ONLINE";

  return (
    <div
      data-testid="order-status-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: 8,
        border: `2px solid ${borderColor}`,
        backgroundColor: "var(--surface-base, #141414)",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Status do pedido */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#a3a3a3",
            fontSize: 11,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {t("tpv:orderPanel.status")}
        </span>
        <span
          style={{
            color: statusColor,
            fontSize: 13,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 4,
            backgroundColor: `${statusColor}15`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Tempo do pedido */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#a3a3a3",
            fontSize: 11,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {t("tpv:orderPanel.time")}
        </span>
        <span
          style={{
            color: isSlow ? "#ef4444" : "#fafafa",
            fontSize: 18,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatElapsed(elapsedSinceStartMs)}
        </span>
      </div>

      {/* Tempo desde envio */}
      {currentOrder.sentToKitchenAt && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#a3a3a3",
              fontSize: 11,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {t("tpv:orderPanel.inKitchen")}
          </span>
          <span
            style={{
              color: isSlow ? "#ef4444" : "#a3a3a3",
              fontSize: 13,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatElapsed(elapsedSinceSentMs)}
          </span>
        </div>
      )}

      {/* Impressora status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#a3a3a3",
            fontSize: 11,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {t("tpv:orderPanel.printer")}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: printerOnline ? "#22c55e" : "#ef4444",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: printerOnline ? "#22c55e" : "#ef4444",
            }}
          />
          {printerOnline ? "Online" : "Offline"}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

      {/* Botões de ação */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ActionButton
          label={t("tpv:orderPanel.sendToKitchen")}
          onClick={onSendToKitchen}
          disabled={!canSend}
          variant="primary"
        />
        <ActionButton
          label={t("tpv:orderPanel.holdOrder")}
          onClick={onHoldOrder}
          disabled={!canHold}
          variant="secondary"
        />
        <ActionButton
          label={t("tpv:orderPanel.splitBill")}
          onClick={onSplitBill}
          disabled={disabled}
          variant="secondary"
        />
      </div>

      {/* Alerta cozinha */}
      {kpis.kitchenStatus === "RED" && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {t("tpv:orderPanel.kitchenCritical")}
        </div>
      )}

      {/* Alerta impressora */}
      {hasAnyPrinterOffline && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {t("tpv:orderPanel.printerOffline")}
        </div>
      )}
    </div>
  );
}

/** Botão de ação para o painel. */
function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: isPrimary ? "none" : "1px solid rgba(255,255,255,0.12)",
        backgroundColor: disabled
          ? "#262626"
          : isPrimary
          ? "#22c55e"
          : "transparent",
        color: disabled ? "#525252" : isPrimary ? "#0a0a0a" : "#fafafa",
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}
