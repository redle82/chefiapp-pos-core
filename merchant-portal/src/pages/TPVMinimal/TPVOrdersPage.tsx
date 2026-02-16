/**
 * TPVOrdersPage — Lista de pedidos em tempo real (rota /op/tpv/orders).
 *
 * Lê gm_orders via OrderReader (Docker Core PostgREST).
 * Poll a cada 10s para manter actualizado. Permite transições de status.
 */

import { useCallback, useEffect, useState } from "react";
import type { CoreOrder, CoreOrderItem } from "../../../docker-core/types";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { updateOrderStatus } from "../../core/infra/CoreOrdersApi";
import { getTpvRestaurantId } from "../../core/storage/installedDeviceStorage";
import {
  readActiveOrders,
  readOrderItems,
} from "../../infra/readers/OrderReader";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";

const DEFAULT_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";
const POLL_INTERVAL = 10_000; // 10s

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "#E3F2FD", text: "#1565C0" },
  IN_PREP: { bg: "#FFF3E0", text: "#E65100" },
  READY: { bg: "#E8F5E9", text: "#2E7D32" },
  CLOSED: { bg: "#F5F5F5", text: "#616161" },
  CANCELLED: { bg: "#FFEBEE", text: "#C62828" },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberto",
  IN_PREP: "A preparar",
  PREPARING: "A preparar",
  READY: "Pronto",
  CLOSED: "Fechado",
  CANCELLED: "Cancelado",
};

// Transitions allowed from each status
const NEXT_STATUS: Record<string, { label: string; status: string }[]> = {
  OPEN: [
    { label: "🔥 Preparar", status: "IN_PREP" },
    { label: "❌ Cancelar", status: "CANCELLED" },
  ],
  IN_PREP: [
    { label: "✅ Pronto", status: "READY" },
    { label: "❌ Cancelar", status: "CANCELLED" },
  ],
  READY: [
    { label: "💰 Fechar", status: "CLOSED" },
    { label: "❌ Cancelar", status: "CANCELLED" },
  ],
};

interface OrderWithItems extends CoreOrder {
  items?: CoreOrderItem[];
  expanded?: boolean;
}

export function TPVOrdersPage() {
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const toast = useToast();

  const installedRestaurantId = getTpvRestaurantId();
  const runtimeRestaurantId = runtime?.restaurant_id ?? null;
  const restaurantId =
    installedRestaurantId ?? runtimeRestaurantId ?? DEFAULT_RESTAURANT_ID;

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await readActiveOrders(restaurantId);
      setOrders((prev) => {
        // Preserve expanded state
        const expandedIds = new Set(
          prev.filter((o) => o.expanded).map((o) => o.id),
        );
        return (data ?? []).map((o: CoreOrder) => ({
          ...o,
          expanded: expandedIds.has(o.id),
          items: prev.find((p) => p.id === o.id)?.items,
        }));
      });
    } catch {
      // silent fail on poll
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const toggleExpand = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return { ...o, expanded: !o.expanded };
      }),
    );
    // Lazy load items
    const order = orders.find((o) => o.id === orderId);
    if (order && !order.items) {
      try {
        const items = await readOrderItems(orderId);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, items } : o)),
        );
      } catch {
        // silent
      }
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({
        order_id: orderId,
        restaurant_id: restaurantId,
        new_status: newStatus,
        origin: "TPV",
      });
      toast.success(
        `Pedido #${orderId.slice(0, 8)} → ${
          STATUS_LABELS[newStatus] ?? newStatus
        }`,
      );
      await loadOrders();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao actualizar status",
      );
    }
  };

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCents = (cents: number | null | undefined) => {
    if (cents == null) return "—";
    return `€${(cents / 100).toFixed(2)}`;
  };

  const timeSince = (iso: string | null | undefined) => {
    if (!iso) return "";
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const filteredOrders = showClosed
    ? orders
    : orders.filter((o) => o.status !== "CLOSED" && o.status !== "CANCELLED");

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            TPV &gt; Pedidos
          </div>
          <h1
            style={{
              color: "var(--text-primary)",
              margin: "4px 0 0",
              fontSize: 24,
            }}
          >
            Pedidos
          </h1>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
            />
            Mostrar fechados
          </label>
          <button
            onClick={loadOrders}
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-secondary)",
          }}
        >
          Carregando pedidos...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredOrders.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--text-secondary)",
            background: "var(--bg-secondary, #f8f9fa)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            Nenhum pedido activo
          </div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            Pedidos criados no POS aparecerão aqui automaticamente.
          </div>
        </div>
      )}

      {/* Orders list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredOrders.map((order) => {
          const statusColor = STATUS_COLORS[order.status] ?? {
            bg: "#f5f5f5",
            text: "#333",
          };
          const actions = NEXT_STATUS[order.status] ?? [];

          return (
            <div
              key={order.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e0e0e0",
                overflow: "hidden",
              }}
            >
              {/* Order row */}
              <div
                onClick={() => toggleExpand(order.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 90px 80px 60px auto",
                  alignItems: "center",
                  padding: "14px 16px",
                  cursor: "pointer",
                  gap: 12,
                }}
              >
                {/* ID + table */}
                <div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: 14,
                    }}
                  >
                    #{order.id.slice(0, 8)}
                  </span>
                  {order.table_number && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Mesa {order.table_number}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <span
                  style={{
                    display: "inline-block",
                    background: statusColor.bg,
                    color: statusColor.text,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>

                {/* Total */}
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    textAlign: "right",
                  }}
                >
                  {formatCents(order.total_cents)}
                </span>

                {/* Time */}
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textAlign: "right",
                  }}
                >
                  {formatTime(order.created_at)}
                </span>

                {/* Elapsed */}
                <span
                  style={{
                    fontSize: 12,
                    color:
                      order.status === "IN_PREP" || order.status === "OPEN"
                        ? "#E65100"
                        : "var(--text-secondary)",
                    fontWeight: order.status === "IN_PREP" ? 600 : 400,
                    textAlign: "right",
                  }}
                >
                  {timeSince(order.created_at)}
                </span>

                {/* Expand arrow */}
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    transition: "transform 0.2s",
                    transform: order.expanded ? "rotate(90deg)" : "rotate(0)",
                  }}
                >
                  ▶
                </span>
              </div>

              {/* Expanded: items + actions */}
              {order.expanded && (
                <div
                  style={{
                    borderTop: "1px solid #eee",
                    padding: "12px 16px",
                    background: "#fafafa",
                  }}
                >
                  {/* Items */}
                  {order.items && order.items.length > 0 ? (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid #e0e0e0",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <th
                            style={{
                              textAlign: "left",
                              padding: "4px 0",
                              fontWeight: 500,
                            }}
                          >
                            Produto
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              padding: "4px 8px",
                              fontWeight: 500,
                            }}
                          >
                            Qty
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "4px 0",
                              fontWeight: 500,
                            }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: "4px 0" }}>
                              {item.name_snapshot}
                            </td>
                            <td
                              style={{
                                textAlign: "center",
                                padding: "4px 8px",
                              }}
                            >
                              {item.quantity}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "4px 0",
                              }}
                            >
                              {formatCents(item.subtotal_cents)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginBottom: 12,
                      }}
                    >
                      Carregando items...
                    </div>
                  )}

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {actions.map((a) => (
                        <button
                          key={a.status}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, a.status);
                          }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            border:
                              a.status === "CANCELLED"
                                ? "1px solid #C62828"
                                : "none",
                            background:
                              a.status === "CANCELLED"
                                ? "transparent"
                                : "var(--color-primary)",
                            color:
                              a.status === "CANCELLED" ? "#C62828" : "#fff",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      color: "#999",
                      display: "flex",
                      gap: 16,
                    }}
                  >
                    <span>Origem: {order.origin ?? order.source ?? "—"}</span>
                    {order.in_prep_at && (
                      <span>Prep: {formatTime(order.in_prep_at)}</span>
                    )}
                    {order.ready_at && (
                      <span>Pronto: {formatTime(order.ready_at)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
