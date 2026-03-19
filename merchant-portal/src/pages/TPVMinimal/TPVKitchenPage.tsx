/**
 * TPVKitchenPage — KDS Supervisão / Command Center embebido no TPV HUB.
 *
 * Visão de SUPERVISÃO: vê todas as estações (ALL/KITCHEN/BAR), todos os pedidos,
 * com filtros por origem. Acessível pelo caixa/gerente no TPV central.
 *
 * Visão de EXECUÇÃO (cozinha/bar dedicados) vive em /screen/kitchen e /screen/bar,
 * que usam KDSMinimal dentro de ScreenLayout — sem sidebar/header do TPV.
 *
 * Layout em 3 colunas:
 * - Fila (esquerda): pedidos por origem + seleção
 * - Detalhes (centro): itens e ações do pedido selecionado
 * - Info (direita): contexto do pedido e cliente
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useFormatLocale } from "../../core/i18n/useFormatLocale";
import { updateOrderStatus as coreUpdateOrderStatus } from "../../core/infra/CoreOrdersApi";
import type { CoreOrder, CoreOrderItem } from "../../infra/docker-core/types";
import {
  readActiveOrders,
  readOrderItems,
  readPreparedItems,
  type ActiveOrderRow,
  type PreparedItem,
} from "../../infra/readers/OrderReader";
import { markItemReady } from "../../infra/writers/OrderWriter";
import { markTableReadyToServe } from "../../infra/writers/TableWriter";
import { ItemTimer } from "../KDSMinimal/ItemTimer";
import {
  calculateOrderStatus,
  type OrderStatusResult,
} from "../KDSMinimal/OrderStatusCalculator";
import { OriginBadge } from "../KDSMinimal/OriginBadge";
import { TPVCentralEmitters } from "../../core/tpv/TPVCentralEvents";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Extensível para EXPO e CUSTOMER_DISPLAY quando implementados
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

const getOrderStatus = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "OPEN":
      return { label: t("tpvKitchen.statusNew"), color: "#eab308", bg: "rgba(234,179,8,0.15)" };
    case "IN_PREP":
      return {
        label: t("tpvKitchen.statusPreparing"),
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.15)",
      };
    case "READY":
      return { label: t("tpvKitchen.statusReady"), color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
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
  const { t } = useTranslation("kds");
  const restaurantId = useTPVRestaurantId();
  const { runtime } = useRestaurantRuntime();
  const locale = useFormatLocale();

  const outletContext = useOutletContext<{
    emitKitchenPressure?: (stats: {
      totalOrders: number;
      delayedOrders: number;
      averageWaitMinutes: number;
    }) => void;
  }>();

  // Dedicated mode: lock to a specific station when opened via ?station=KITCHEN|BAR
  const [searchParams] = useSearchParams();
  const stationParam = searchParams.get("station")?.toUpperCase() as StationFilter | null;
  const isDedicated = stationParam === "KITCHEN" || stationParam === "BAR";

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationFilterState, setStationFilter] = useState<StationFilter>("ALL");
  // In dedicated mode, stationParam overrides the local state unconditionally.
  const stationFilter: StationFilter = isDedicated ? stationParam! : stationFilterState;
  const [originFilter, setOriginFilter] = useState<OriginFilter>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  /** IDs of orders that just appeared — used for flash highlight in dedicated mode. */
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  /** View mode: "queue" = active orders, "history" = prepared items */
  const [viewMode, setViewMode] = useState<"queue" | "history">("queue");
  const [preparedItems, setPreparedItems] = useState<PreparedItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const mountedRef = useRef(true);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  // ---- New order sound (Web Audio API — no external files) ----
  const playNewOrderSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Double beep: bip-bip
      [0, 0.15].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = 880; // A5
        gain.gain.value = 0.3;
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.1);
      });
    } catch {
      // Audio not available — silent fallback
    }
  }, []);

  // ---- "Order ready" chime (success sound) ----
  const playReadySound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Rising chime: C6 → E6 → G6
      [0, 0.12, 0.24].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = [1047, 1319, 1568][i]; // C6, E6, G6
        gain.gain.value = 0.25;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.2);
      });
    } catch {
      // Audio not available — silent fallback
    }
  }, []);

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
        const active = enriched.filter((e) => !e.expired);
        // Detect new orders: play sound + flash highlight in dedicated mode
        const currentIds = new Set(active.map((o) => o.order.id));
        if (prevOrderIdsRef.current.size > 0) {
          const freshIds = [...currentIds].filter(
            (id) => !prevOrderIdsRef.current.has(id),
          );
          if (freshIds.length > 0) {
            playNewOrderSound();
            if (isDedicated) {
              setNewOrderIds((prev) => {
                const next = new Set(prev);
                for (const id of freshIds) next.add(id);
                return next;
              });
              // Auto-clear highlight after 5s
              setTimeout(() => {
                setNewOrderIds((prev) => {
                  const next = new Set(prev);
                  for (const id of freshIds) next.delete(id);
                  return next;
                });
              }, 5000);
            }
          }
        }
        prevOrderIdsRef.current = currentIds;
        setOrders(active);
      }
    } catch (err) {
      console.error("[TPV Kitchen] Error loading orders:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [restaurantId, runtime.loading, runtime.coreReachable, playNewOrderSound]);

  useEffect(() => {
    mountedRef.current = true;
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadOrders]);

  // ---- Load prepared items when history view is active ----
  const loadHistory = useCallback(async () => {
    if (!restaurantId) return;
    setHistoryLoading(true);
    try {
      const stationArg = isDedicated
        ? (stationFilter as "KITCHEN" | "BAR")
        : stationFilter !== "ALL"
        ? (stationFilter as "KITCHEN" | "BAR")
        : undefined;
      const items = await readPreparedItems(restaurantId, stationArg);
      if (mountedRef.current) setPreparedItems(items);
    } catch (err) {
      console.error("[KDS] Error loading history:", err);
    } finally {
      if (mountedRef.current) setHistoryLoading(false);
    }
  }, [restaurantId, isDedicated, stationFilter]);

  useEffect(() => {
    if (viewMode !== "history") return;
    loadHistory();
    const interval = setInterval(loadHistory, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [viewMode, loadHistory]);

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
    async (itemId: string, orderId?: string) => {
      try {
        setActing(itemId);
        const result = await markItemReady(itemId, restaurantId);
        // Auto-transition: when all items ready, move order to READY
        if (result.all_items_ready && orderId) {
          await coreUpdateOrderStatus({
            order_id: orderId,
            new_status: "READY",
            restaurant_id: restaurantId,
            origin: "TPV_KDS",
          });
          if (isDedicated) playReadySound();
          // Signal all surfaces: order is ready (garçom, expo, delivery, TPV central)
          const readyOrder = orders.find((o) => o.order.id === orderId);
          TPVCentralEmitters.alertTable({
            tableId: readyOrder?.order.table_id ?? orderId,
            tableNumber: readyOrder?.order.table_number ?? 0,
            alertType: "order_ready",
            severity: "medium",
            message: t("tpvKitchen.orderReadyAlert", { id: readyOrder?.order.short_id ?? orderId.slice(0, 6) }),
            timestamp: new Date(),
          });
          // Bridge: mesa → ready_to_serve
          const tableId = readyOrder?.order.table_id;
          if (tableId) {
            markTableReadyToServe(tableId, restaurantId).catch(() => {});
          }
        }
        await loadOrders();
      } catch (err) {
        console.error("[TPV Kitchen] Mark ready error:", err);
      } finally {
        setActing(null);
      }
    },
    [restaurantId, loadOrders, isDedicated, playReadySound, orders],
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

  // Split into active (OPEN/IN_PREP) and ready (READY) for queue display
  const activeOrders = useMemo(
    () => filteredOrders.filter((o) => o.order.status !== "READY"),
    [filteredOrders],
  );
  const readyOrders = useMemo(
    () => filteredOrders.filter((o) => o.order.status === "READY"),
    [filteredOrders],
  );

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
    // Count active orders per station (for supervision tabs)
    const kitchenCount = orders.filter((o) =>
      o.items.some((i) => (i.station ?? "KITCHEN").toUpperCase() === "KITCHEN") && o.order.status !== "READY",
    ).length;
    const barCount = orders.filter((o) =>
      o.items.some((i) => (i.station ?? "KITCHEN").toUpperCase() === "BAR") && o.order.status !== "READY",
    ).length;
    return { total, delayed, attention, kitchenCount, barCount };
  }, [orders]);

  // ---- Inject keyframe for new-order flash (once) ----
  useEffect(() => {
    if (document.getElementById("kds-flash-style")) return;
    const style = document.createElement("style");
    style.id = "kds-flash-style";
    style.textContent = `@keyframes kds-flash { 0%,100% { opacity:1 } 50% { opacity:0.6 } }`;
    document.head.appendChild(style);
  }, []);

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
        {t("tpvKitchen.loading")}
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
            {isDedicated
              ? stationFilter === "BAR" ? t("tpvKitchen.bar") : t("tpvKitchen.kitchen")
              : t("tpvKitchen.commandKds")}
          </h2>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase" as const,
              backgroundColor: isDedicated ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
              color: isDedicated ? "#22c55e" : "#3b82f6",
            }}
          >
            {isDedicated ? t("tpvKitchen.execution") : t("tpvKitchen.supervision")}
          </span>
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
            {t("tpvKitchen.ordersCount", { count: stats.total })}
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
              {t("tpvKitchen.delayedCount", { count: stats.delayed })}
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
              {t("tpvKitchen.attentionCount", { count: stats.attention })}
            </span>
          )}

          {/* View toggle: Fila / Preparados */}
          <div
            style={{
              display: "flex",
              gap: 2,
              backgroundColor: TPV_COLORS.panelAlt,
              borderRadius: 10,
              padding: 2,
              marginLeft: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("queue")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "queue" ? TPV_COLORS.accent : "transparent",
                color: viewMode === "queue" ? "#0a0a0a" : TPV_COLORS.textMuted,
              }}
            >
              {t("tpvKitchen.queue")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("history")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "history" ? "#22c55e" : "transparent",
                color: viewMode === "history" ? "#0a0a0a" : TPV_COLORS.textMuted,
              }}
            >
              {t("tpvKitchen.prepared")}
            </button>
          </div>
        </div>

        {!isDedicated && (
          <div style={{ display: "flex", gap: 6 }}>
            {(["ALL", "KITCHEN", "BAR"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStationFilter(f)}
                style={FILTER_BTN(stationFilter === f)}
              >
                {f === "ALL"
                  ? t("tpvKitchen.filterAll")
                  : f === "KITCHEN"
                  ? `${t("tpvKitchen.kitchen")}${stats.kitchenCount > 0 ? ` (${stats.kitchenCount})` : ""}`
                  : `${t("tpvKitchen.bar")}${stats.barCount > 0 ? ` (${stats.barCount})` : ""}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* History view — prepared items */}
      {viewMode === "history" && (
        <div style={{ flex: 1, overflow: "auto", ...PANEL }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: TPV_COLORS.text }}>
              {t("tpvKitchen.preparedToday")}
            </h3>
            <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
              {t("tpvKitchen.itemsCount", { count: preparedItems.length })}
            </span>
          </div>

          {historyLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: TPV_COLORS.textDim, fontSize: 13 }}>
              {t("tpvKitchen.loadingHistory")}
            </div>
          ) : preparedItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: TPV_COLORS.textDim }}>
              <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>📋</span>
              <span style={{ fontSize: 13 }}>{t("tpvKitchen.noPreparedToday")}</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {preparedItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    backgroundColor: TPV_COLORS.panelAlt,
                    border: `1px solid ${TPV_COLORS.border}`,
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: TPV_COLORS.textMuted, minWidth: 28 }}>
                      {item.quantity}x
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: TPV_COLORS.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name_snapshot ?? "—"}
                    </span>
                    {!isDedicated && item.station && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                          backgroundColor:
                            item.station === "BAR"
                              ? "rgba(168,85,247,0.15)"
                              : "rgba(59,130,246,0.15)",
                          color: item.station === "BAR" ? "#a855f7" : "#3b82f6",
                        }}
                      >
                        {item.station}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {item.order_short_id && (
                      <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                        #{item.order_short_id}
                      </span>
                    )}
                    {item.order_table_number != null && (
                      <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                        {t("tpvKitchen.table", { number: item.order_table_number })}
                      </span>
                    )}
                    {item.ready_at && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>
                        {new Date(item.ready_at).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main columns — active queue */}
      {viewMode === "queue" && (
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
              {t("tpvKitchen.queue")}
            </h3>
            <span
              style={{
                fontSize: 12,
                color: TPV_COLORS.textMuted,
              }}
            >
              {t("tpvKitchen.ordersCount", { count: filteredOrders.length })}
            </span>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(
              [
                { key: "ALL", label: t("tpvKitchen.originAll") },
                { key: "TPV", label: t("tpvKitchen.originTpv") },
                { key: "WEB", label: t("tpvKitchen.originWeb") },
                { key: "GARCOM", label: t("tpvKitchen.originWaiter") },
                { key: "QR_MESA", label: t("tpvKitchen.originQr") },
                { key: "APP", label: t("tpvKitchen.originApp") },
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
                <span style={{ fontSize: 13 }}>{t("tpvKitchen.noActiveOrders")}</span>
              </div>
            ) : (
              <>
              {activeOrders.map(({ order, items, status, ageMinutes }) => {
                const statusInfo = getOrderStatus(order.status, t);
                const isSelected = order.id === selectedOrderId;
                const isNew = newOrderIds.has(order.id);
                return (
                  <div
                    key={order.id}
                    role="button"
                    tabIndex={0}
                    data-testid={`order-row-${order.id}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedOrderId(order.id); }}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${
                        isNew ? "#22c55e" : isSelected ? TPV_COLORS.accent : TPV_COLORS.border
                      }`,
                      backgroundColor: isNew
                        ? "rgba(34,197,94,0.18)"
                        : isSelected
                        ? "rgba(249,115,22,0.12)"
                        : TPV_COLORS.panelAlt,
                      color: TPV_COLORS.text,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      cursor: "pointer",
                      boxShadow: isNew
                        ? "0 0 12px rgba(34,197,94,0.4)"
                        : isSelected
                        ? "0 0 0 1px rgba(249,115,22,0.35)"
                        : "none",
                      animation: isNew ? "kds-flash 1s ease-in-out 3" : "none",
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
                        {t("tpvKitchen.itemsCount", { count: items.length })}
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
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color:
                            ageMinutes >= 30
                              ? "#ef4444"
                              : ageMinutes >= 15
                              ? "#eab308"
                              : TPV_COLORS.textDim,
                        }}
                      >
                        {ageMinutes >= 60
                          ? `${Math.floor(ageMinutes / 60)}h${String(ageMinutes % 60).padStart(2, "0")}`
                          : `${ageMinutes} min`}
                      </span>
                      {isDedicated && order.status === "OPEN" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPrep(order.id);
                          }}
                          disabled={acting === order.id}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "none",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: acting === order.id ? "not-allowed" : "pointer",
                            backgroundColor: TPV_COLORS.accent,
                            color: "#0a0a0a",
                          }}
                        >
                          {acting === order.id ? "…" : t("tpvKitchen.start")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Ready orders section */}
              {readyOrders.length > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 0 4px",
                    }}
                  >
                    <div style={{ flex: 1, height: 1, backgroundColor: "rgba(34,197,94,0.3)" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                      {t("tpvKitchen.readyCount", { count: readyOrders.length })}
                    </span>
                    <div style={{ flex: 1, height: 1, backgroundColor: "rgba(34,197,94,0.3)" }} />
                  </div>
                  {readyOrders.map(({ order, items, ageMinutes }) => {
                    const isSelected = order.id === selectedOrderId;
                    return (
                      <div
                        key={order.id}
                        role="button"
                        tabIndex={0}
                        data-testid={`order-row-${order.id}`}
                        onClick={() => setSelectedOrderId(order.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedOrderId(order.id); }}
                        style={{
                          textAlign: "left",
                          padding: 10,
                          borderRadius: 12,
                          border: `1px solid ${isSelected ? "#22c55e" : "rgba(34,197,94,0.2)"}`,
                          backgroundColor: isSelected ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.06)",
                          color: TPV_COLORS.text,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          cursor: "pointer",
                          opacity: 0.85,
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                          #{getOrderLabel(order)}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
                          {t("tpvKitchen.statusReady")}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
              </>
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
              {t("tpvKitchen.details")}
            </h3>
            {selectedOrder ? (
              <span
                style={{
                  fontSize: 12,
                  color: TPV_COLORS.textMuted,
                }}
              >
                {t("tpvKitchen.orderLabel", { id: getOrderLabel(selectedOrder.order) })}
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
              <span style={{ fontSize: 13 }}>{t("tpvKitchen.selectOrder")}</span>
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
                    {t("tpvKitchen.orderLabel", { id: getOrderLabel(selectedOrder.order) })}
                  </span>
                  <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                    {t("tpvKitchen.table", { number: selectedOrder.order.table_number ?? "—" })}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: getOrderStatus(selectedOrder.order.status, t)
                      .bg,
                    color: getOrderStatus(selectedOrder.order.status, t).color,
                  }}
                >
                  {getOrderStatus(selectedOrder.order.status, t).label}
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
                      {!isDedicated && item.station && (
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
                      {isDedicated && !item.ready_at && (
                        <button
                          onClick={() => handleMarkReady(item.id, selectedOrder.order.id)}
                          disabled={acting === item.id}
                          style={ACTION_BTN("success")}
                          title={t("tpvKitchen.markReady")}
                        >
                          {acting === item.id ? "…" : "✓"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* KDS Actions — only in dedicated (execution) mode */}
              {isDedicated && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${TPV_COLORS.border}`,
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
                        ? t("tpvKitchen.starting")
                        : t("tpvKitchen.startPrep")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const pending = selectedOrder.items.filter((i) => !i.ready_at);
                      if (pending.length === 0) return;
                      Promise.all(pending.map((i) => handleMarkReady(i.id, selectedOrder.order.id)));
                    }}
                    disabled={
                      acting != null ||
                      selectedOrder.items.every((i) => i.ready_at)
                    }
                    style={ACTION_BTN("success")}
                  >
                    {t("tpvKitchen.allReady")}
                  </button>
                  <button
                    type="button"
                    style={ACTION_BTN("ghost")}
                    title={t("tpvKitchen.returnToQueueTitle")}
                  >
                    {t("tpvKitchen.returnToQueue")}
                  </button>
                </div>
              )}
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
              {t("tpvKitchen.info")}
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
              <span style={{ fontSize: 13 }}>{t("tpvKitchen.awaitingSelection")}</span>
            </div>
          ) : (
            (() => {
              const metadata = asRecord(selectedOrder.order.metadata) ?? {};
              const delivery = asRecord(metadata.delivery) ?? {};
              const deliveryAddress =
                readString(delivery.address) ??
                readString(metadata.delivery_address);

              return (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Contexto operacional — só o que a cozinha precisa */}
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
                      {t("tpvKitchen.order")}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      <OriginBadge
                        origin={selectedOrder.order.origin}
                        createdByRole={selectedOrder.order.source}
                        tableNumber={selectedOrder.order.table_number}
                      />
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: TPV_COLORS.text }}>
                      {t("tpvKitchen.table", { number: selectedOrder.order.table_number ?? "—" })}
                    </span>
                    <span style={{ fontSize: 13, color: TPV_COLORS.textMuted }}>
                      {t("tpvKitchen.entryTime")}{" "}
                      {selectedOrder.order.created_at
                        ? new Date(
                            selectedOrder.order.created_at,
                          ).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: TPV_COLORS.text }}>
                      {t("tpvKitchen.itemsCount", { count: selectedOrder.items.length })}
                    </span>
                    {deliveryAddress && (
                      <span style={{ fontSize: 13, color: TPV_COLORS.textMuted }}>
                        📍 {deliveryAddress}
                      </span>
                    )}
                  </div>

                  {/* Notas — visíveis para a cozinha (alergias, modificações) */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: selectedOrder.order.notes
                        ? "rgba(234,179,8,0.1)"
                        : TPV_COLORS.panelAlt,
                      border: `1px solid ${
                        selectedOrder.order.notes
                          ? "rgba(234,179,8,0.3)"
                          : TPV_COLORS.border
                      }`,
                    }}
                  >
                    <span style={{ fontSize: 12, color: TPV_COLORS.textMuted }}>
                      {t("tpvKitchen.notes")}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: selectedOrder.order.notes ? 600 : 400,
                        color: selectedOrder.order.notes
                          ? "#eab308"
                          : TPV_COLORS.textDim,
                      }}
                    >
                      {selectedOrder.order.notes ?? t("tpvKitchen.noNotes")}
                    </span>
                  </div>

                  {/* Progresso dos itens — por estação em supervisão, total em dedicado */}
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
                      {t("tpvKitchen.progress")}
                    </span>
                    {(() => {
                      const allItems = selectedOrder.items;
                      const ready = allItems.filter((i) => i.ready_at).length;
                      const total = allItems.length;
                      const pct = total > 0 ? Math.round((ready / total) * 100) : 0;

                      // In supervision mode, show breakdown by station
                      const stations = !isDedicated
                        ? [...new Set(allItems.map((i) => (i.station ?? "KITCHEN").toUpperCase()))]
                        : null;

                      return (
                        <>
                          <span style={{ fontSize: 16, fontWeight: 700, color: TPV_COLORS.text }}>
                            {t("tpvKitchen.readyOf", { ready, total })}
                          </span>
                          <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, backgroundColor: pct === 100 ? "#22c55e" : TPV_COLORS.accent, transition: "width 0.3s ease" }} />
                          </div>
                          {stations && stations.length > 1 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                              {stations.map((st) => {
                                const stItems = allItems.filter((i) => (i.station ?? "KITCHEN").toUpperCase() === st);
                                const stReady = stItems.filter((i) => i.ready_at).length;
                                const stPct = stItems.length > 0 ? Math.round((stReady / stItems.length) * 100) : 0;
                                return (
                                  <div key={st} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: st === "BAR" ? "#a855f7" : "#3b82f6", minWidth: 52 }}>
                                      {st === "BAR" ? t("tpvKitchen.bar") : t("tpvKitchen.kitchen")}
                                    </span>
                                    <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${stPct}%`, borderRadius: 2, backgroundColor: stPct === 100 ? "#22c55e" : st === "BAR" ? "#a855f7" : "#3b82f6", transition: "width 0.3s ease" }} />
                                    </div>
                                    <span style={{ fontSize: 11, color: TPV_COLORS.textMuted, minWidth: 28 }}>
                                      {stReady}/{stItems.length}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })()
          )}
        </section>
      </div>
      )}
    </div>
  );
}
