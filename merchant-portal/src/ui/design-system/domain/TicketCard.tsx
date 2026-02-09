/* Use Strict Primitives */
import React, { useState } from "react";
import { Card } from "../primitives/Card";
import { Text } from "../primitives/Text";
import { Badge } from "../primitives/Badge";
import { Button } from "../primitives/Button";
import { colors } from "../tokens/colors";

/* Type Logic (Mirrors Backend) */
export type TicketStatus =
  | "new"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "cancelled";

interface TicketOrder {
  id: string; // "ord-123"
  tableNumber?: string | null;
  status: TicketStatus;
  items: Array<{
    name: string;
    quantity: number;
    price?: number; // In cents, optional for backward compatibility
  }>;
  total: number;
  createdAt: string; // ISO
}

interface TicketCardProps {
  order: TicketOrder;
  onAction?: (action: "send" | "ready" | "close" | "recover") => void;
  onDiscount?: (discountCents: number) => void;
  compact?: boolean;
  isActive?: boolean; // Highlight if this is the active order being edited
  syncStatus?: "synced" | "pending" | "error" | "syncing"; // Logic for Offline Mode
}

export const TicketCard: React.FC<TicketCardProps> = ({
  order,
  onAction,
  onDiscount,
  compact,
  isActive = false,
  syncStatus = "synced",
}) => {
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountMode, setDiscountMode] = useState<"percent" | "fixed">(
    "percent",
  );

  // Resolve Semantic Status
  const getBadgeStatus = (
    s: TicketStatus,
  ): "new" | "preparing" | "ready" | "delivered" => {
    if (s === "new") return "new";
    if (s === "preparing") return "preparing";
    if (s === "ready") return "ready";
    return "delivered"; // served/paid/cancelled
  };

  const badgeStatus = getBadgeStatus(order.status);

  // "Alive" Timer placeholder (Static for now, but UDS structure ready)
  const timeElapsed = "12:45";

  // New logic: Only show actions if relevant
  const canSend = order.status === "new";
  const canReady = order.status === "preparing";
  const canPay = order.status === "ready" || order.status === "served";

  return (
    <Card surface="layer2" padding={compact ? "sm" : "lg"} hoverable>
      {/* 1. HEADER: ID + Table + Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Text size="2xl" weight="black" color="primary">
              {order.id}
            </Text>
            {order.tableNumber && (
              <Text size="xs" weight="bold" color="info">
                Mesa {order.tableNumber}
              </Text>
            )}
            {isActive && (
              <Text
                size="xs"
                weight="bold"
                color="action"
                style={{
                  backgroundColor: `${colors.action.base}20`,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                ✏️ Editando
              </Text>
            )}
            {/* Sync Status Indicator */}
            {syncStatus === "pending" && (
              <span
                title="Aguardando sincronização"
                style={{ fontSize: "14px", cursor: "help" }}
              >
                ☁️⏳
              </span>
            )}
            {syncStatus === "syncing" && (
              <span
                title="Sincronizando..."
                style={{ fontSize: "14px", cursor: "wait" }}
              >
                🔄
              </span>
            )}
            {syncStatus === "error" && (
              <span
                title="Erro na sincronização"
                style={{ fontSize: "14px", cursor: "help" }}
              >
                ⚠️❌
              </span>
            )}
          </div>

          {/* Metadata Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Timer Logic */}
            {(order.status === "new" || order.status === "preparing") && (
              <Text
                size="xs"
                weight="bold"
                color={order.status === "new" ? "warning" : "tertiary"}
              >
                ⏱ {timeElapsed}
              </Text>
            )}
          </div>
        </div>

        {/* Status Enforcer */}
        <Badge status={badgeStatus} variant="outline" />
      </div>

      {/* 2. BODY: Items (Only in expanded view or simplified) */}
      {!compact && (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {order.items.slice(0, 4).map((item, i) => {
            const itemTotal = item.price
              ? (item.price * item.quantity) / 100
              : null;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text size="sm" color="secondary">
                  {item.quantity}x {item.name}
                </Text>
                {itemTotal !== null && (
                  <Text size="sm" color="tertiary" weight="bold">
                    €{itemTotal.toFixed(2)}
                  </Text>
                )}
              </div>
            );
          })}
          {order.items.length > 4 && (
            <Text size="xs" color="tertiary">
              ...mais items
            </Text>
          )}
        </div>
      )}

      {/* 3. FOOTER: Total + Actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: "auto",
        }}
      >
        {/* Total Display */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "baseline",
            gap: 4,
          }}
        >
          <Text size="xs" color="tertiary" weight="bold">
            TOTAL
          </Text>
          <Text size="xl" color="primary" weight="black">
            € {order.total.toFixed(2)}
          </Text>
        </div>

        {/* Action Button (Full Width) */}
        {onAction && (
          <>
            {canSend && (
              <Button tone="warning" size="lg" onClick={() => onAction("send")}>
                Enviar Cozinha
              </Button>
            )}
            {canReady && (
              <Button tone="info" size="lg" onClick={() => onAction("ready")}>
                Marcar Pronto
              </Button>
            )}
            {canPay && (
              <Button
                tone="success"
                size="lg"
                onClick={() => onAction("pay" as any)}
              >
                💲 Cobrar
              </Button>
            )}
            {/* Discount Button — visible on open orders */}
            {onDiscount &&
              order.status !== "paid" &&
              order.status !== "cancelled" && (
                <>
                  <Button
                    tone="neutral"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDiscount(!showDiscount)}
                  >
                    🏷️ Desconto
                  </Button>
                  {showDiscount && (
                    <div
                      style={{
                        background: colors.surface.layer3,
                        borderRadius: 12,
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 6 }}>
                        {[5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => {
                              const cents = Math.round(
                                order.total * 100 * (pct / 100),
                              );
                              onDiscount(cents);
                              setShowDiscount(false);
                              setDiscountInput("");
                            }}
                            style={{
                              flex: 1,
                              padding: "8px 0",
                              background: colors.surface.highlight,
                              border: "none",
                              borderRadius: 6,
                              color: colors.text.secondary,
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <select
                          value={discountMode}
                          onChange={(e) =>
                            setDiscountMode(
                              e.target.value as "percent" | "fixed",
                            )
                          }
                          style={{
                            background: colors.surface.highlight,
                            border: "none",
                            borderRadius: 6,
                            color: colors.text.primary,
                            padding: "6px 8px",
                            fontSize: 12,
                          }}
                        >
                          <option value="percent">%</option>
                          <option value="fixed">€</option>
                        </select>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder={
                            discountMode === "percent" ? "0" : "0.00"
                          }
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          style={{
                            flex: 1,
                            background: colors.surface.highlight,
                            border: "none",
                            borderRadius: 6,
                            color: colors.text.primary,
                            padding: "6px 8px",
                            fontSize: 14,
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => {
                            const v = parseFloat(discountInput || "0");
                            if (v <= 0) return;
                            const cents =
                              discountMode === "percent"
                                ? Math.round(order.total * 100 * (v / 100))
                                : Math.round(v * 100);
                            onDiscount(cents);
                            setShowDiscount(false);
                            setDiscountInput("");
                          }}
                          style={{
                            padding: "6px 12px",
                            background: colors.action.base,
                            border: "none",
                            borderRadius: 6,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            {/* DESTRUCTIVE: Cancel Action */}
            {order.status !== "paid" && order.status !== "cancelled" && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  tone="destructive"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.",
                      )
                    ) {
                      onAction("cancel" as any);
                    }
                  }}
                >
                  ✕ Cancelar Pedido
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};
