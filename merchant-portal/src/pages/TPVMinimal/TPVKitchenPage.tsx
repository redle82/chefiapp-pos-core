/**
 * TPVKitchenPage — Mini-KDS embebido no TPV HUB.
 *
 * Mostra pedidos ativos da cozinha/bar com:
 * - Filtro de estação (Todas / Cozinha / Bar)
 * - Cards compactos com items, timers, status
 * - Ações rápidas: Iniciar preparo, Marcar item como pronto
 * - Polling automático (5s)
 *
 * Reutiliza: OrderReader, OrderWriter, ItemTimer, OrderStatusCalculator, OriginBadge.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { updateOrderStatus as coreUpdateOrderStatus } from "../../core/infra/CoreOrdersApi";
import type { CoreOrderItem } from "../../infra/docker-core/types";
import {
  readActiveOrders,
  readOrderItems,
  type ActiveOrderRow,
} from "../../infra/readers/OrderReader";
import { markItemReady } from "../../infra/writers/OrderWriter";
import { ItemTimer } from "../KDSMinimal/ItemTimer";
import {
  calculateOrderStatus,
  type OrderStatusResult,
} from "../KDSMinimal/OrderStatusCalculator";
import { OriginBadge } from "../KDSMinimal/OriginBadge";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StationFilter = "ALL" | "KITCHEN" | "BAR";

/**
 * KDS Expiration Policy — orders older than this are auto-archived.
 * Prevents stale 8,995+ minute tickets from cluttering the display.
 */
const KDS_MAX_AGE_MINUTES = 4 * 60; // 4 hours
const KDS_WARNING_AGE_MINUTES = 2 * 60; // 2 hours → yellow warning

interface OrderWithItems {
  order: ActiveOrderRow;
  items: CoreOrderItem[];
  status: OrderStatusResult;
  /** Age in minutes since creation. */
  ageMinutes: number;
  /** true if order exceeds KDS_MAX_AGE_MINUTES. */
  expired: boolean;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const FILTER_BTN = (active: boolean): React.CSSProperties => ({
  padding: "6px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 13,
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
  backgroundColor: active
    ? "var(--color-primary, #c9a227)"
    : "var(--surface-elevated, #262626)",
  color: active ? "#000" : "var(--text-secondary, #a3a3a3)",
  transition: "all 0.15s ease",
});

const ORDER_CARD: React.CSSProperties = {
  backgroundColor: "var(--surface-elevated, #1a1a1a)",
  borderRadius: 12,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const ITEM_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 8px",
  borderRadius: 8,
  backgroundColor: "var(--surface-base, #0d0d0d)",
  fontSize: 13,
};

const ACTION_BTN = (variant: "primary" | "success"): React.CSSProperties => ({
  padding: "4px 12px",
  borderRadius: 6,
  border: "none",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor:
    variant === "primary" ? "var(--color-primary, #c9a227)" : "#22c55e",
  color: variant === "primary" ? "#000" : "#fff",
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TPVKitchenPage() {
  const restaurantId = useTPVRestaurantId();
  const { runtime } = useRestaurantRuntime();
  const outletContext = useOutletContext<{
    emitKitchenPressure?: (stats: {
      totalOrders: number;
      delayedOrders: number;
      averageWaitMinutes: number;
    }) => void;
  }>();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState<StationFilter>("ALL");
  const [acting, setActing] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // ---- Load orders + items ----
  const loadOrders = useCallback(async () => {
    if (runtime.loading || !runtime.coreReachable) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const rawOrders = await readActiveOrders(restaurantId);
      const enriched: OrderWithItems[] = await Promise.all(
        rawOrders.map(async (order) => {
          const items = await readOrderItems(order.id);
          const status = calculateOrderStatus(order, items);
          const ageMinutes = Math.floor(
            (Date.now() - new Date(order.created_at).getTime()) / 60_000,
          );
          return {
            order,
            items,
            status,
            ageMinutes,
            expired: ageMinutes >= KDS_MAX_AGE_MINUTES,
          };
        }),
      );

      // Auto-archive expired orders (fire & forget, don't block render)
      const expiredOrders = enriched.filter((e) => e.expired);
      if (expiredOrders.length > 0) {
        for (const exp of expiredOrders) {
          coreUpdateOrderStatus({
            order_id: exp.order.id,
            new_status: "CANCELLED",
            restaurant_id: restaurantId,
            origin: "KDS_AUTO_EXPIRE",
          }).catch((err) =>
            console.warn("[KDS] Auto-expire failed:", exp.order.id, err),
          );
        }
        console.info(
          `[KDS] Auto-expired ${expiredOrders.length} orders (>${KDS_MAX_AGE_MINUTES}min)`,
        );
      }

      if (mountedRef.current) {
        // Only show non-expired orders in KDS
        setOrders(enriched.filter((e) => !e.expired));
      }
    } catch (err) {
      console.error("[TPV Kitchen] Error loading orders:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [restaurantId, runtime.loading, runtime.coreReachable]);

  useEffect(() => {
    mountedRef.current = true;
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadOrders]);

  // ---- Emit kitchen pressure events via TPVCentralEvents ----
  useEffect(() => {
    if (!outletContext?.emitKitchenPressure || orders.length === 0) return;
    const delayed = orders.filter((o) => o.status.state === "delay").length;
    const avgWait =
      orders.reduce((sum, o) => sum + Math.max(0, o.status.delaySeconds), 0) /
      Math.max(1, orders.length) /
      60;
    outletContext.emitKitchenPressure({
      totalOrders: orders.length,
      delayedOrders: delayed,
      averageWaitMinutes: Math.round(avgWait),
    });
  }, [orders, outletContext]);

  // ---- Actions ----
  const handleStartPrep = useCallback(
    async (orderId: string) => {
      try {
        setActing(orderId);
        await coreUpdateOrderStatus({
          order_id: orderId,
          new_status: "IN_PREP",
          restaurant_id: restaurantId,
          origin: "TPV_KDS",
        });
        await loadOrders();
      } catch (err) {
        console.error("[TPV Kitchen] Start prep error:", err);
      } finally {
        setActing(null);
      }
    },
    [restaurantId, loadOrders],
  );

  const handleMarkReady = useCallback(
    async (itemId: string) => {
      try {
        setActing(itemId);
        await markItemReady(itemId, restaurantId);
        await loadOrders();
      } catch (err) {
        console.error("[TPV Kitchen] Mark ready error:", err);
      } finally {
        setActing(null);
      }
    },
    [restaurantId, loadOrders],
  );

  // ---- Filter orders by station ----
  const filteredOrders = useMemo(() => {
    if (stationFilter === "ALL") return orders;
    return orders
      .map((o) => ({
        ...o,
        items: o.items.filter(
          (item) => (item.station ?? "KITCHEN").toUpperCase() === stationFilter,
        ),
      }))
      .filter((o) => o.items.length > 0);
  }, [orders, stationFilter]);

  // ---- Count stats ----
  const stats = useMemo(() => {
    const total = orders.length;
    const delayed = orders.filter((o) => o.status.state === "delay").length;
    const attention = orders.filter(
      (o) => o.status.state === "attention",
    ).length;
    return { total, delayed, attention };
  }, [orders]);

  // ---- Render ----
  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-tertiary, #737373)",
          fontSize: 14,
        }}
      >
        A carregar cozinha…
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        overflow: "auto",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary, #fafafa)",
            }}
          >
            🍳 Cozinha
          </h2>
          {/* Stats badges */}
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: "var(--surface-elevated, #262626)",
              color: "var(--text-secondary, #a3a3a3)",
            }}
          >
            {stats.total} pedido{stats.total !== 1 ? "s" : ""}
          </span>
          {stats.delayed > 0 && (
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: "rgba(239,68,68,0.15)",
                color: "#ef4444",
              }}
            >
              {stats.delayed} atrasado{stats.delayed !== 1 ? "s" : ""}
            </span>
          )}
          {stats.attention > 0 && (
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: "rgba(234,179,8,0.15)",
                color: "#eab308",
              }}
            >
              {stats.attention} atenção
            </span>
          )}
        </div>

        {/* Station filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["ALL", "KITCHEN", "BAR"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStationFilter(f)}
              style={FILTER_BTN(stationFilter === f)}
            >
              {f === "ALL" ? "Todas" : f === "KITCHEN" ? "Cozinha" : "Bar"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders grid */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--text-tertiary, #737373)",
          }}
        >
          <span style={{ fontSize: 40 }}>✅</span>
          <span style={{ fontSize: 14 }}>
            Sem pedidos ativos
            {stationFilter !== "ALL"
              ? ` para ${stationFilter === "KITCHEN" ? "cozinha" : "bar"}`
              : ""}
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 12,
          }}
        >
          {filteredOrders.map(({ order, items, status, ageMinutes }) => (
            <div
              key={order.id}
              style={{
                ...ORDER_CARD,
                borderLeft: `4px solid ${status.borderColor}`,
                ...(ageMinutes >= KDS_WARNING_AGE_MINUTES
                  ? { opacity: 0.7, borderTop: "2px solid #ef4444" }
                  : {}),
              }}
            >
              {/* Order header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-primary, #fafafa)",
                    }}
                  >
                    #{order.number ?? order.short_id ?? order.id.slice(0, 6)}
                  </span>
                  <OriginBadge
                    origin={order.origin}
                    createdByRole={order.source}
                    tableNumber={order.table_number}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor:
                      order.status === "IN_PREP"
                        ? "rgba(59,130,246,0.15)"
                        : order.status === "READY"
                        ? "rgba(34,197,94,0.15)"
                        : "var(--surface-base, #0d0d0d)",
                    color:
                      order.status === "IN_PREP"
                        ? "#3b82f6"
                        : order.status === "READY"
                        ? "#22c55e"
                        : "var(--text-secondary, #a3a3a3)",
                  }}
                >
                  {order.status === "OPEN"
                    ? "Novo"
                    : order.status === "IN_PREP"
                    ? "Preparando"
                    : order.status === "READY"
                    ? "Pronto"
                    : order.status}
                </span>
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {items.map((item) => (
                  <div key={item.id} style={ITEM_ROW}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--text-tertiary, #737373)",
                          minWidth: 20,
                        }}
                      >
                        {item.quantity}×
                      </span>
                      <span
                        style={{
                          color: "var(--text-primary, #fafafa)",
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name_snapshot ??
                          (item.product_id ? item.product_id.slice(0, 8) : "—")}
                      </span>
                      {item.station && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 4,
                            fontWeight: 600,
                            backgroundColor:
                              item.station === "BAR"
                                ? "rgba(168,85,247,0.15)"
                                : "rgba(59,130,246,0.15)",
                            color:
                              item.station === "BAR" ? "#a855f7" : "#3b82f6",
                          }}
                        >
                          {item.station}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <ItemTimer item={item} />
                      {!item.ready_at && (
                        <button
                          onClick={() => handleMarkReady(item.id)}
                          disabled={acting === item.id}
                          style={ACTION_BTN("success")}
                          title="Marcar como pronto"
                        >
                          {acting === item.id ? "…" : "✓"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order actions */}
              {order.status === "OPEN" && (
                <button
                  onClick={() => handleStartPrep(order.id)}
                  disabled={acting === order.id}
                  style={{
                    ...ACTION_BTN("primary"),
                    width: "100%",
                    padding: "8px 0",
                    fontSize: 13,
                  }}
                >
                  {acting === order.id ? "A iniciar…" : "▶ Iniciar preparo"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
