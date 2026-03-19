import React from "react";
import type { CoreOrderItem, CoreTask } from "../../../infra/docker-core/types";
import { ItemTimer } from "../ItemTimer";

const VPC = {
  surface: "#141414",
  textDim: "#737373",
  textMuted: "#8a8a8a",
  border: "rgba(255,255,255,0.06)",
  accent: "#f97316",
  radius: 8,
  fontSizeBase: 16,
};

interface KDSItemCardProps {
  item: CoreOrderItem;
  orderStatus: string;
  restaurantId: string;
  tasks: CoreTask[];
  markingItem: string | null;
  onMarkReady: (itemId: string, restaurantId: string) => void;
}

export function KDSItemCard({
  item,
  orderStatus,
  restaurantId,
  tasks,
  markingItem,
  onMarkReady,
}: KDSItemCardProps) {
  const itemCreated = new Date(item.created_at || new Date().toISOString());
  const now = new Date();
  const prepTimeSeconds = item.prep_time_seconds || 300;
  const expectedReadyAt = new Date(
    itemCreated.getTime() + prepTimeSeconds * 1000,
  );
  const delaySeconds = (now.getTime() - expectedReadyAt.getTime()) / 1000;
  const delayRatio = prepTimeSeconds > 0 ? delaySeconds / prepTimeSeconds : 0;

  // Item já está pronto?
  const isItemReady = item.ready_at !== null;

  // Calcular tempo real vs esperado (métrica)
  const actualTimeSeconds =
    isItemReady && item.ready_at
      ? Math.floor(
          (new Date(item.ready_at).getTime() - itemCreated.getTime()) / 1000,
        )
      : Math.floor((now.getTime() - itemCreated.getTime()) / 1000);
  const timeDifference = actualTimeSeconds - prepTimeSeconds;
  const timeDifferenceMinutes = Math.floor(Math.abs(timeDifference) / 60);

  // Status do item individual
  let itemStatus: "ready" | "normal" | "attention" | "delay" = "normal";
  if (isItemReady) {
    itemStatus = "ready";
  } else if (delayRatio < 0.1) {
    itemStatus = "normal";
  } else if (delayRatio < 0.25) {
    itemStatus = "attention";
  } else {
    itemStatus = "delay";
  }

  const itemColors = {
    ready: "#6b7280",
    normal: "#22c55e",
    attention: "#eab308",
    delay: "#ef4444",
  };

  // Verificar se item tem tarefa aberta
  const itemTask = tasks.find(
    (t) => t.order_item_id === item.id && t.status === "OPEN",
  );
  const hasTask = !!itemTask;

  return (
    <li
      key={item.id}
      style={{
        marginBottom: "8px",
        padding: "12px",
        backgroundColor: isItemReady
          ? "rgba(34,197,94,0.1)"
          : hasTask
          ? "rgba(220,38,38,0.1)"
          : VPC.surface,
        borderRadius: "4px",
        border: isItemReady
          ? "1px solid #22c55e"
          : hasTask
          ? "2px solid #dc2626"
          : `1px solid ${VPC.border}`,
        boxShadow: hasTask ? "0 0 0 2px rgba(220, 38, 38, 0.2)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            color: itemColors[itemStatus],
            fontSize: "16px",
          }}
        >
          {isItemReady
            ? "✅"
            : itemStatus === "delay"
            ? "🔴"
            : itemStatus === "attention"
            ? "🟡"
            : "🟢"}
        </span>
        {hasTask && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#dc2626",
              backgroundColor: "rgba(220,38,38,0.15)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            🧠 TAREFA
          </span>
        )}
        <span style={{ flex: 1, fontWeight: "500" }}>
          {item.name_snapshot} x{item.quantity}
        </span>
        {!isItemReady && <ItemTimer item={item} />}
        {isItemReady && (
          <span
            style={{
              color: "#22c55e",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            ✅ Pronto
          </span>
        )}
      </div>

      {/* Métrica: Tempo real vs esperado */}
      {isItemReady && (
        <div
          style={{
            fontSize: "11px",
            color: VPC.textDim,
            marginTop: "4px",
          }}
        >
          {timeDifference >= 0
            ? `⏱️ ${timeDifferenceMinutes} min acima do esperado (${Math.floor(
                actualTimeSeconds / 60,
              )} min real vs ${Math.floor(
                prepTimeSeconds / 60,
              )} min esperado)`
            : `⏱️ ${timeDifferenceMinutes} min abaixo do esperado (${Math.floor(
                actualTimeSeconds / 60,
              )} min real vs ${Math.floor(
                prepTimeSeconds / 60,
              )} min esperado)`}
        </div>
      )}

      {/* Botão "Item Pronto" — só permitido quando o pedido já está IN_PREP/PREPARING */}
      {!isItemReady && (
        <div style={{ marginTop: "8px" }}>
          <button
            type="button"
            data-testid="kds-item-ready"
            onClick={() => onMarkReady(item.id, restaurantId)}
            disabled={
              markingItem === item.id ||
              (orderStatus !== "IN_PREP" && orderStatus !== "PREPARING")
            }
            title={
              orderStatus === "OPEN" ? "Inicie o preparo primeiro" : undefined
            }
            style={{
              minHeight: 40,
              padding: "8px 16px",
              fontSize: VPC.fontSizeBase,
              fontWeight: 600,
              backgroundColor:
                markingItem === item.id ||
                (orderStatus !== "IN_PREP" && orderStatus !== "PREPARING")
                  ? VPC.textMuted
                  : VPC.accent,
              color: "#fff",
              border: "none",
              borderRadius: VPC.radius,
              cursor:
                markingItem === item.id ||
                (orderStatus !== "IN_PREP" && orderStatus !== "PREPARING")
                  ? "wait"
                  : "pointer",
            }}
          >
            {markingItem === item.id
              ? "A marcar..."
              : orderStatus === "OPEN"
              ? "⏳ Inicie o preparo primeiro"
              : "✅ Item pronto"}
          </button>
        </div>
      )}
    </li>
  );
}
