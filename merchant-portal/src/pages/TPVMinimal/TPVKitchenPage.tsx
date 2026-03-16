/**
 * TPVKitchenPage — KDS/Command Center embebido no TPV HUB.
 *
 * Layout em 3 colunas:
 * - Fila (esquerda): pedidos por origem + seleção
 * - Detalhes (centro): itens e ações do pedido selecionado
 * - Info (direita): contexto do pedido e cliente
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useCurrency } from "../../core/currency/useCurrency";
import { useFormatLocale } from "../../core/i18n/useFormatLocale";
import { updateOrderStatus as coreUpdateOrderStatus } from "../../core/infra/CoreOrdersApi";
import type { CoreOrder, CoreOrderItem } from "../../infra/docker-core/types";
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
type OriginFilter = "ALL" | "TPV" | "WEB" | "GARCOM" | "QR_MESA" | "APP";

/**
 * KDS Expiration Policy — orders older than this are auto-archived.
 * Prevents stale tickets from cluttering the display.
 */
const KDS_MAX_AGE_MINUTES = 4 * 60; // 4 hours
const KDS_WARNING_AGE_MINUTES = 2 * 60; // 2 hours → warning

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
// Styling
// ---------------------------------------------------------------------------

const TPV_COLORS = {
  bg: "#0a0a0a",
  panel: "#141414",
  panelAlt: "#1e1e1e",
  panelDim: "#141414",
  text: "#fafafa",
  textMuted: "#8a8a8a",
  textDim: "#737373",
  accent: "#f97316",
  accentSoft: "rgba(249,115,22,0.15)",
  border: "rgba(255,255,255,0.06)",
};

const FILTER_BTN = (active: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  borderRadius: 10,
  border: `1px solid ${active ? "transparent" : TPV_COLORS.border}`,
  fontSize: 15,
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
  backgroundColor: active ? TPV_COLORS.accent : TPV_COLORS.panelAlt,
  color: active ? "#0a0a0a" : TPV_COLORS.textMuted,
  transition: "all 0.15s ease",
});

const ORIGIN_BTN = (active: boolean): React.CSSProperties => ({
  padding: "6px 12px",
  borderRadius: 999,
  border: `1px solid ${active ? "transparent" : TPV_COLORS.border}`,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor: active ? TPV_COLORS.accentSoft : TPV_COLORS.panelAlt,
  color: active ? TPV_COLORS.accent : TPV_COLORS.textMuted,
  transition: "all 0.15s ease",
});

const PANEL: React.CSSProperties = {
  backgroundColor: TPV_COLORS.panel,
  borderRadius: 16,
  border: `1px solid ${TPV_COLORS.border}`,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const ITEM_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  borderRadius: 10,
  backgroundColor: TPV_COLORS.panelAlt,
  border: `1px solid ${TPV_COLORS.border}`,
  fontSize: 17,
};

const ACTION_BTN = (
  variant: "primary" | "ghost" | "success",
): React.CSSProperties => ({
  padding: "10px 16px",
  borderRadius: 10,
  border:
    variant === "ghost"
      ? `1px solid ${TPV_COLORS.border}`
      : "1px solid transparent",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  backgroundColor:
    variant === "primary"
      ? TPV_COLORS.accent
      : variant === "success"
      ? "#22c55e"
      : TPV_COLORS.panelAlt,
  color: variant === "ghost" ? TPV_COLORS.text : "#0a0a0a",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getOrderLabel = (order: CoreOrder) =>
  order.number ?? order.short_id ?? order.id.slice(0, 6);

const getOrderStatus = (status: string) => {
  switch (status) {
    case "OPEN":
      return { label: "Novo", color: "#eab308", bg: "rgba(234,179,8,0.15)" };
    case "IN_PREP":
      return {
        label: "Preparando",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.15)",
      };
    case "READY":
      return { label: "Pronto", color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
    default:
      return {
        label: status,
        color: TPV_COLORS.textMuted,
        bg: TPV_COLORS.panelAlt,
      };
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return null;
};

const getOriginKey = (order: CoreOrder) =>
  (order.origin ?? order.source ?? "TPV")
    .toString()
    .toUpperCase()
    .replace(/\s/g, "");

const matchesOriginFilter = (order: CoreOrder, filter: OriginFilter) => {
  if (filter === "ALL") return true;
  const key = getOriginKey(order);
  if (filter === "TPV") return ["TPV", "CAIXA"].includes(key);
  if (filter === "WEB") return ["WEB", "WEB_PUBLIC"].includes(key);
  if (filter === "GARCOM")
    return ["GARCOM", "GARÇOM", "WAITER", "MOBILE"].includes(key);
  if (filter === "QR_MESA") return ["QR_MESA", "QRMESA"].includes(key);
  if (filter === "APP")
    return ["APPSTAFF", "APPSTAFF_MANAGER", "APPSTAFF_OWNER", "MANAGER", "OWNER"].includes(key);
  return key === filter;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TPVKitchenPage() {
  const restaurantId = useTPVRestaurantId();
  const { runtime } = useRestaurantRuntime();
  const { formatAmount } = useCurrency();
  const locale = useFormatLocale();

  /** Null-safe cents formatter using currency-aware formatAmount. */
  const formatCents = (value?: number | null) => {
    if (value == null || Number.isNaN(value)) return "—";
    return formatAmount(value);
  };

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
  const [originFilter, setOriginFilter] = useState<OriginFilter>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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
          const createdMs = order.created_at
            ? new Date(order.created_at).getTime()
            : NaN;
          const ageMinutes = Number.isFinite(createdMs)
            ? Math.floor((Date.now() - createdMs) / 60_000)
            : 0;
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
      // Only cancel OPEN/IN_PREP orders; READY orders must go to CLOSED, not CANCELLED
      const expiredOrders = enriched.filter(
        (e) => e.expired && ["OPEN", "IN_PREP"].includes(e.order.status),
      );
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

  // ---- Filter orders ----
  const filteredOrders = useMemo(() => {
    const originFiltered = orders.filter((o) =>
      matchesOriginFilter(o.order, originFilter),
    );
    if (stationFilter === "ALL") return originFiltered;
    return originFiltered
      .map((o) => ({
        ...o,
        items: o.items.filter(
          (item) => (item.station ?? "KITCHEN").toUpperCase() === stationFilter,
        ),
      }))
      .filter((o) => o.items.length > 0);
  }, [orders, originFilter, stationFilter]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((o) => o.order.id === selectedOrderId) ?? null,
    [filteredOrders, selectedOrderId],
  );

  useEffect(() => {
    if (filteredOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrder) {
      setSelectedOrderId(filteredOrders[0].order.id);
    }
  }, [filteredOrders, selectedOrder]);

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
          color: TPV_COLORS.textDim,
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
        backgroundColor: TPV_COLORS.bg,
        overflow: "hidden",
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
              fontSize: 22,
              fontWeight: 700,
              color: TPV_COLORS.text,
            }}
          >
            🍳 Cozinha · KDS
          </h2>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              backgroundColor: TPV_COLORS.panelAlt,
              color: TPV_COLORS.textMuted,
            }}
          >
            {stats.total} pedido{stats.total !== 1 ? "s" : ""}
          </span>
          {stats.delayed > 0 && (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
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
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
                backgroundColor: "rgba(234,179,8,0.15)",
                color: "#eab308",
              }}
            >
              {stats.attention} atenção
            </span>
          )}
        </div>

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

      {/* Main columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px minmax(0, 1fr) 300px",
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left panel: Order list */}
        <section style={PANEL}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: TPV_COLORS.text }}>
              Fila
            </h3>
            <span
              style={{
                fontSize: 12,
                color: TPV_COLORS.textMuted,
              }}
            >
              {filteredOrders.length} pedidos
            </span>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(
              [
                { key: "ALL", label: "Todos" },
                { key: "TPV", label: "TPV" },
                { key: "WEB", label: "Web" },
                { key: "GARCOM", label: "Garcom" },
                { key: "QR_MESA", label: "QR" },
                { key: "APP", label: "App" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                onClick={() => setOriginFilter(filter.key)}
                style={ORIGIN_BTN(originFilter === filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflow: "auto",
              marginTop: 12,
              paddingRight: 4,
            }}
          >
            {filteredOrders.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: TPV_COLORS.textDim,
                }}
              >
                <span style={{ fontSize: 28 }}>✅</span>
                <span style={{ fontSize: 13 }}>Sem pedidos ativos</span>
              </div>
            ) : (
              filteredOrders.map(({ order, items, status, ageMinutes }) => {
                const statusInfo = getOrderStatus(order.status);
                const isSelected = order.id === selectedOrderId;
                const totalCents =
                  order.total_cents ??
                  items.reduce(
                    (sum, item) => sum + (item.subtotal_cents ?? 0),
                    0,
                  );

                return (
                  <button
                    key={order.id}
                    data-testid={`order-row-${order.id}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${
                        isSelected ? TPV_COLORS.accent : TPV_COLORS.border
                      }`,
                      backgroundColor: isSelected
                        ? "rgba(249,115,22,0.12)"
                        : TPV_COLORS.panelAlt,
                      color: TPV_COLORS.text,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      cursor: "pointer",
                      boxShadow: isSelected
                        ? "0 0 0 1px rgba(249,115,22,0.35)"
                        : "none",
                      opacity: ageMinutes >= KDS_WARNING_AGE_MINUTES ? 0.7 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 17, fontWeight: 700 }}>
                        #{getOrderLabel(order)}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 999,
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <OriginBadge
                        origin={order.origin}
                        createdByRole={order.source}
                        tableNumber={order.table_number}
                      />
                      <span
                        style={{ fontSize: 14, color: TPV_COLORS.textMuted }}
                      >
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 600, color: TPV_COLORS.textDim }}>
                        {ageMinutes} min
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>
                        {formatCents(totalCents)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Center panel: Order details */}
        <section style={PANEL}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: TPV_COLORS.text }}>
              Detalhes
            </h3>
            {selectedOrder ? (
              <span
                style={{
                  fontSize: 12,
                  color: TPV_COLORS.textMuted,
                }}
              >
                Pedido #{getOrderLabel(selectedOrder.order)}
              </span>
            ) : null}
          </div>

          {!selectedOrder ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: TPV_COLORS.textDim,
              }}
            >
              <span style={{ fontSize: 28 }}>📭</span>
              <span style={{ fontSize: 13 }}>Selecione um pedido</span>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700 }}>
                    Pedido #{getOrderLabel(selectedOrder.order)}
                  </span>
                  <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                    Mesa {selectedOrder.order.table_number ?? "—"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: getOrderStatus(selectedOrder.order.status)
                      .bg,
                    color: getOrderStatus(selectedOrder.order.status).color,
                  }}
                >
                  {getOrderStatus(selectedOrder.order.status).label}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflow: "auto",
                  paddingRight: 4,
                }}
              >
                {selectedOrder.items.map((item) => (
                  <div key={item.id} style={ITEM_ROW}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: TPV_COLORS.textMuted,
                          minWidth: 24,
                        }}
                      >
                        {item.quantity}x
                      </span>
                      <span
                        style={{
                          color: TPV_COLORS.text,
                          fontSize: 18,
                          fontWeight: 600,
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
                            fontSize: 13,
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontWeight: 700,
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
                        gap: 8,
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

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: `1px solid ${TPV_COLORS.border}`,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: TPV_COLORS.textMuted }}>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCents(selectedOrder.order.subtotal_cents)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: TPV_COLORS.textMuted }}>Taxas</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCents(selectedOrder.order.tax_cents)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: TPV_COLORS.textMuted }}>Desconto</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCents(selectedOrder.order.discount_cents)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span>{formatCents(selectedOrder.order.total_cents)}</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {selectedOrder.order.status === "OPEN" && (
                  <button
                    onClick={() => handleStartPrep(selectedOrder.order.id)}
                    disabled={acting === selectedOrder.order.id}
                    style={ACTION_BTN("primary")}
                  >
                    {acting === selectedOrder.order.id
                      ? "A iniciar…"
                      : "Iniciar preparo"}
                  </button>
                )}
                <button type="button" style={ACTION_BTN("ghost")}>
                  Cobrar
                </button>
                <button type="button" style={ACTION_BTN("ghost")}>
                  Comandar
                </button>
                <button type="button" style={ACTION_BTN("ghost")}>
                  Imprimir
                </button>
              </div>
            </>
          )}
        </section>

        {/* Right panel: Order info */}
        <section style={PANEL}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: TPV_COLORS.text }}>
              Info
            </h3>
            {selectedOrder ? (
              <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                #{getOrderLabel(selectedOrder.order)}
              </span>
            ) : null}
          </div>

          {!selectedOrder ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: TPV_COLORS.textDim,
              }}
            >
              <span style={{ fontSize: 28 }}>🧭</span>
              <span style={{ fontSize: 13 }}>Aguardando seleção</span>
            </div>
          ) : (
            (() => {
              const metadata = asRecord(selectedOrder.order.metadata) ?? {};
              const customer = asRecord(metadata.customer) ?? {};
              const delivery = asRecord(metadata.delivery) ?? {};

              const customerName =
                readString(customer.name) ?? readString(metadata.customer_name);
              const customerPhone =
                readString(customer.phone) ??
                readString(metadata.customer_phone);
              const customerEmail =
                readString(customer.email) ??
                readString(metadata.customer_email);

              const deliveryAddress =
                readString(delivery.address) ??
                readString(metadata.delivery_address);

              return (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: TPV_COLORS.panelAlt,
                      border: `1px solid ${TPV_COLORS.border}`,
                    }}
                  >
                    <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                      Pedido
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      Origem: {getOriginKey(selectedOrder.order)}
                    </span>
                    <span style={{ fontSize: 13, color: TPV_COLORS.textMuted }}>
                      Mesa {selectedOrder.order.table_number ?? "—"}
                    </span>
                    <span style={{ fontSize: 13, color: TPV_COLORS.textMuted }}>
                      Status pagamento:{" "}
                      {selectedOrder.order.payment_status ?? "—"}
                    </span>
                    <span style={{ fontSize: 13, color: TPV_COLORS.textMuted }}>
                      Criado:{" "}
                      {selectedOrder.order.created_at
                        ? new Date(
                            selectedOrder.order.created_at,
                          ).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: TPV_COLORS.panelAlt,
                      border: `1px solid ${TPV_COLORS.border}`,
                    }}
                  >
                    <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                      Cliente
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {customerName ?? "—"}
                    </span>
                    <span style={{ fontSize: 13, color: TPV_COLORS.textMuted }}>
                      {customerPhone ?? "—"}
                    </span>
                    <span style={{ fontSize: 13, color: TPV_COLORS.textMuted }}>
                      {customerEmail ?? "—"}
                    </span>
                    {deliveryAddress && (
                      <span style={{ fontSize: 12, color: TPV_COLORS.textDim }}>
                        {deliveryAddress}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: TPV_COLORS.panelAlt,
                      border: `1px solid ${TPV_COLORS.border}`,
                    }}
                  >
                    <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                      Notas
                    </span>
                    <span style={{ fontSize: 13, color: TPV_COLORS.text }}>
                      {selectedOrder.order.notes ?? "Sem notas"}
                    </span>
                  </div>
                </div>
              );
            })()
          )}
        </section>
      </div>
    </div>
  );
}
