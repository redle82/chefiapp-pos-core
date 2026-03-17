/**
 * TPVDeliveryPage — Gestão de entregas e pedidos em trânsito.
 *
 * Modelo operacional: o delivery não muda como a cozinha prepara —
 * ele muda como o pedido SAI.
 *
 * Estados delivery (guardados em sync_metadata.delivery_status):
 *   preparing   → cozinha/bar a preparar (status OPEN/IN_PREP)
 *   packing     → pronto, a embalar (status READY)
 *   pickup      → pronto para recolha pelo entregador
 *   dispatched  → saiu com entregador
 *   delivered   → entregue ao cliente (status CLOSED)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { updateOrderStatus as coreUpdateOrderStatus } from "../../core/infra/CoreOrdersApi";
import { useCurrency } from "../../core/currency/useCurrency";
import type { CoreOrder } from "../../infra/docker-core/types";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { readActiveOrders, readReadyOrders } from "../../infra/readers/OrderReader";
import { OriginBadge } from "../KDSMinimal/OriginBadge";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

// ---------------------------------------------------------------------------
// Delivery sub-states
// ---------------------------------------------------------------------------

type DeliverySubStatus =
  | "preparing"
  | "packing"
  | "pickup"
  | "dispatched"
  | "delivered";

type FilterKey = "all" | DeliverySubStatus;

const STATUS_TAB_KEYS: FilterKey[] = ["all", "preparing", "packing", "pickup", "dispatched"];

const STATUS_COLOR: Record<DeliverySubStatus, string> = {
  preparing: "#3b82f6",
  packing: "#f59e0b",
  pickup: "#8b5cf6",
  dispatched: "#f97316",
  delivered: "#22c55e",
};

/** Derive delivery sub-status from order state + sync_metadata */
function getDeliveryStatus(order: CoreOrder): DeliverySubStatus {
  const meta = order.sync_metadata as Record<string, unknown> | null;
  const explicit = meta?.delivery_status as DeliverySubStatus | undefined;
  if (explicit && explicit in STATUS_COLOR) return explicit;

  // Fallback from core order status
  if (order.status === "CLOSED") return "delivered";
  if (order.status === "READY") return "packing";
  return "preparing";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Actions for each delivery step
// ---------------------------------------------------------------------------

const DELIVERY_ACTIONS: Array<{
  from: DeliverySubStatus;
  to: DeliverySubStatus;
  i18nKey: string;
  color: string;
}> = [
  { from: "packing", to: "pickup", i18nKey: "delivery.action.readyForPickup", color: "#8b5cf6" },
  { from: "pickup", to: "dispatched", i18nKey: "delivery.action.dispatched", color: "#f97316" },
  { from: "dispatched", to: "delivered", i18nKey: "delivery.action.delivered", color: "#22c55e" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TPVDeliveryPage() {
  const { t } = useTranslation("tpv");
  const { formatAmount } = useCurrency();
  const restaurantId = useTPVRestaurantId();

  const timeAgo = useCallback(
    (iso: string) => {
      const ms = Date.now() - new Date(iso).getTime();
      const minutes = Math.floor(ms / 60_000);
      if (minutes < 1) return t("delivery.now");
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h${minutes % 60}m`;
    },
    [t],
  );
  const [orders, setOrders] = useState<CoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [acting, setActing] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyTrackingLink = useCallback((orderId: string) => {
    const url = `${window.location.origin}/track/${orderId}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    // Load both active + ready orders
    const [active, ready] = await Promise.all([
      readActiveOrders(restaurantId),
      readReadyOrders(restaurantId),
    ]);
    // Merge, deduplicate by id
    const map = new Map<string, CoreOrder>();
    for (const o of [...active, ...ready]) map.set(o.id, o);
    setOrders(Array.from(map.values()));
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    void loadOrders();
    const id = setInterval(() => void loadOrders(), 5000);
    return () => clearInterval(id);
  }, [loadOrders]);

  // Enrich orders with delivery status
  const enriched = useMemo(
    () =>
      orders.map((o) => ({
        order: o,
        deliveryStatus: getDeliveryStatus(o),
      })),
    [orders],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return enriched;
    return enriched.filter((e) => e.deliveryStatus === filter);
  }, [enriched, filter]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: enriched.length,
      preparing: 0,
      packing: 0,
      pickup: 0,
      dispatched: 0,
      delivered: 0,
    };
    for (const e of enriched) c[e.deliveryStatus]++;
    return c;
  }, [enriched]);

  /** Advance delivery sub-status */
  const advanceStatus = useCallback(
    async (orderId: string, newDeliveryStatus: DeliverySubStatus) => {
      if (!restaurantId) return;
      setActing(orderId);
      try {
        // Update sync_metadata.delivery_status
        const order = orders.find((o) => o.id === orderId);
        const currentMeta =
          (order?.sync_metadata as Record<string, unknown>) ?? {};
        const updatedMeta = { ...currentMeta, delivery_status: newDeliveryStatus };

        await dockerCoreClient
          .from("gm_orders")
          .update({ sync_metadata: updatedMeta })
          .eq("id", orderId);

        // If delivered, also close the order
        if (newDeliveryStatus === "delivered") {
          await coreUpdateOrderStatus({
            order_id: orderId,
            new_status: "CLOSED",
            restaurant_id: restaurantId,
            origin: "TPV_DELIVERY",
          });
        }

        await loadOrders();
      } catch (err) {
        console.error("[Delivery] Error advancing status:", err);
      } finally {
        setActing(null);
      }
    },
    [restaurantId, orders, loadOrders],
  );

  if (!restaurantId) {
    return (
      <div style={{ padding: 32, color: "#737373", fontSize: 14 }}>
        {t("delivery.restaurantNotConfigured")}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#fafafa",
            }}
          >
            {t("delivery.title")}
          </h1>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              backgroundColor: "rgba(59,130,246,0.15)",
              color: "#3b82f6",
            }}
          >
            DELIVERY
          </span>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#737373" }}>
          {t("delivery.description")}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STATUS_TAB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              background:
                filter === key ? "#f97316" : "rgba(255,255,255,0.06)",
              color: filter === key ? "#0a0a0a" : "#a3a3a3",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t(`delivery.tab.${key}`)} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <p style={{ color: "#737373", fontSize: 13 }}>
            {t("delivery.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 16px",
              color: "#525252",
              fontSize: 14,
            }}
          >
            {t("delivery.emptyQueue")}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map(({ order, deliveryStatus }) => {
              const statusColor = STATUS_COLOR[deliveryStatus];
              const action = DELIVERY_ACTIONS.find(
                (a) => a.from === deliveryStatus,
              );

              return (
                <div
                  key={order.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: 14,
                    backgroundColor: "#171717",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#fafafa",
                        }}
                      >
                        #{order.short_id ?? order.id.slice(0, 6)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 4,
                          backgroundColor: `${statusColor}20`,
                          color: statusColor,
                        }}
                      >
                        {t(`delivery.status.${deliveryStatus}`)}
                      </span>
                      <OriginBadge
                        origin={order.origin ?? order.source ?? "CAIXA"}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        fontSize: 12,
                        color: "#737373",
                      }}
                    >
                      <span>{order.total_cents != null ? formatAmount(order.total_cents) : "—"}</span>
                      <span>{timeAgo(order.created_at)}</span>
                      {order.table_number && (
                        <span>{t("delivery.table", { n: order.table_number })}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => copyTrackingLink(order.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        color: copiedId === order.id ? "#22c55e" : "#a3a3a3",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {copiedId === order.id
                        ? t("delivery.linkCopied")
                        : t("delivery.copyLink")}
                    </button>

                    {action && (
                      <button
                        type="button"
                        disabled={acting === order.id}
                        onClick={() => advanceStatus(order.id, action.to)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: action.color,
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor:
                            acting === order.id ? "not-allowed" : "pointer",
                          opacity: acting === order.id ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {acting === order.id ? "..." : t(action.i18nKey)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
