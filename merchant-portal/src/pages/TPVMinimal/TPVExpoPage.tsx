/**
 * TPVExpoPage — Ecrã de expedição (Expo).
 *
 * Mostra pedidos com status READY para conferência antes de servir.
 * O expedidor verifica itens, confirma e marca como SERVED/CLOSED.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { updateOrderStatus as coreUpdateOrderStatus } from "../../core/infra/CoreOrdersApi";
import type { CoreOrder, CoreOrderItem } from "../../infra/docker-core/types";
import { readReadyOrders, readOrderItems } from "../../infra/readers/OrderReader";
import { OriginBadge } from "../KDSMinimal/OriginBadge";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

interface OrderWithItems {
  order: CoreOrder;
  items: CoreOrderItem[];
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m`;
}

export function TPVExpoPage() {
  const { t } = useTranslation("tpv");
  const restaurantId = useTPVRestaurantId();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    const raw = await readReadyOrders(restaurantId);
    const withItems = await Promise.all(
      raw.map(async (order) => ({
        order,
        items: await readOrderItems(order.id),
      })),
    );
    setOrders(withItems);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    void loadOrders();
    const id = setInterval(() => void loadOrders(), 5000);
    return () => clearInterval(id);
  }, [loadOrders]);

  const selected = useMemo(
    () => orders.find((o) => o.order.id === selectedId) ?? orders[0] ?? null,
    [orders, selectedId],
  );

  const handleServed = useCallback(
    async (orderId: string) => {
      if (!restaurantId) return;
      setActing(orderId);
      try {
        await coreUpdateOrderStatus({
          order_id: orderId,
          new_status: "CLOSED",
          restaurant_id: restaurantId,
          origin: "TPV_EXPO",
        });
        await loadOrders();
      } catch (err) {
        console.error("[Expo] Error marking served:", err);
      } finally {
        setActing(null);
      }
    },
    [restaurantId, loadOrders],
  );

  if (!restaurantId) {
    return (
      <div style={{ padding: 32, color: "#737373", fontSize: 14 }}>
        {t("expo.restaurantNotConfigured")}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        gap: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Queue */}
      <div
        style={{
          width: 320,
          minWidth: 280,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fafafa" }}>
              {t("expo.title")}
            </h1>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                backgroundColor: "rgba(251,191,36,0.15)",
                color: "#fbbf24",
              }}
            >
              EXPO
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#737373" }}>
            {t("expo.ordersReadyToServe", { count: orders.length })}
          </p>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
          {loading ? (
            <p style={{ color: "#737373", fontSize: 13 }}>{t("expo.loading")}</p>
          ) : orders.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
                color: "#525252",
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>
                ✓
              </span>
              {t("expo.noOrdersReadyToServe")}
            </div>
          ) : (
            orders.map((o) => {
              const isSelected = selected?.order.id === o.order.id;
              return (
                <button
                  key={o.order.id}
                  type="button"
                  onClick={() => setSelectedId(o.order.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 10,
                    border: isSelected
                      ? "1.5px solid #22c55e"
                      : "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: isSelected
                      ? "rgba(34,197,94,0.08)"
                      : "#171717",
                    color: "#fafafa",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      #{o.order.short_id ?? o.order.id.slice(0, 6)}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#22c55e",
                      }}
                    >
                      {t("expo.ready")}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 6,
                      alignItems: "center",
                      fontSize: 12,
                      color: "#a3a3a3",
                    }}
                  >
                    <OriginBadge origin={o.order.origin ?? o.order.source ?? "CAIXA"} />
                    <span>{t("expo.itemCount", { count: o.items.length })}</span>
                    {o.order.table_number && (
                      <span>{t("expo.table", { n: o.order.table_number })}</span>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#525252",
                    }}
                  >
                    {t("expo.readySince", { time: timeAgo(o.order.ready_at ?? o.order.updated_at ?? o.order.created_at) || t("expo.now") })}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {selected ? (
          <div style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fafafa" }}>
                  {t("expo.orderNumber", { id: selected.order.short_id ?? selected.order.id.slice(0, 6) })}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#737373" }}>
                  {selected.order.table_number
                    ? t("expo.table", { n: selected.order.table_number })
                    : t("expo.noTable")}{" "}
                  · {t("expo.itemCount", { count: selected.items.length })}
                </p>
              </div>
              <button
                type="button"
                disabled={acting === selected.order.id}
                onClick={() => handleServed(selected.order.id)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#22c55e",
                  color: "#0a0a0a",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: acting === selected.order.id ? "not-allowed" : "pointer",
                  opacity: acting === selected.order.id ? 0.6 : 1,
                }}
              >
                {acting === selected.order.id ? t("expo.serving") : t("expo.markServed")}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selected.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "#171717",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#a3a3a3",
                        minWidth: 28,
                      }}
                    >
                      {item.quantity}x
                    </span>
                    <span style={{ fontSize: 14, color: "#fafafa" }}>
                      {item.name_snapshot}
                    </span>
                    {item.station && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor:
                            item.station === "BAR"
                              ? "rgba(168,85,247,0.15)"
                              : "rgba(34,197,94,0.15)",
                          color: item.station === "BAR" ? "#a855f7" : "#22c55e",
                        }}
                      >
                        {item.station}
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
                    ✓
                  </span>
                </div>
              ))}
            </div>

            {selected.order.notes && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.2)",
                  fontSize: 13,
                  color: "#fbbf24",
                }}
              >
                <strong>{t("expo.notes")}:</strong> {selected.order.notes}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#525252",
              fontSize: 14,
            }}
          >
            {t("expo.selectOrderToCheck")}
          </div>
        )}
      </div>
    </div>
  );
}
