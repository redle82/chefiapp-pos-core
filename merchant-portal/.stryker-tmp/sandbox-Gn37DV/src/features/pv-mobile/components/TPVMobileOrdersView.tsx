/**
 * TPVMobileOrdersView — Active orders list for mobile
 *
 * Shows all active orders with:
 * - Order type badge (Dine In, Take Away, Delivery)
 * - Table number (if applicable)
 * - Total amount
 * - Time elapsed
 * - Status (OPEN, IN_PREP, READY)
 */

import { useEffect, useState } from "react";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

interface ActiveOrder {
  id: string;
  order_number?: string;
  table_number?: number;
  order_type: "dine_in" | "takeaway" | "delivery";
  status: "OPEN" | "IN_PREP" | "READY";
  total_cents: number;
  created_at: string;
  item_count: number;
}

interface TPVMobileOrdersViewProps {
  restaurantId: string;
  onSelectOrder: (orderId: string) => void;
}

export function TPVMobileOrdersView({
  restaurantId,
  onSelectOrder,
}: TPVMobileOrdersViewProps) {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "OPEN" | "IN_PREP" | "READY">(
    "all",
  );

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = async () => {
      setLoading(true);

      const { data } = await dockerCoreClient
        .from("gm_orders")
        .select(
          "id, order_number, table_number, order_type, status, total_cents, created_at",
        )
        .eq("restaurant_id", restaurantId)
        .in("status", ["OPEN", "IN_PREP", "READY"])
        .order("created_at", { ascending: false });

      if (data && Array.isArray(data)) {
        // Map orders with placeholder item count (count query not supported here)
        const mappedOrders = data.map((order: Record<string, unknown>) => ({
          id: order.id as string,
          order_number: (order.order_number as string) ?? undefined,
          table_number: (order.table_number as number) ?? undefined,
          order_type: ((order.order_type as string) ??
            "dine_in") as ActiveOrder["order_type"],
          status: order.status as string as ActiveOrder["status"],
          total_cents: (order.total_cents as number) ?? 0,
          created_at: order.created_at as string,
          item_count: 0, // Would need separate query
        }));
        setOrders(mappedOrders);
      }

      setLoading(false);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [restaurantId]);

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const statusLabel = (status: ActiveOrder["status"]) => {
    switch (status) {
      case "OPEN":
        return "Aberto";
      case "IN_PREP":
        return "Preparando";
      case "READY":
        return "Pronto";
      default:
        return status;
    }
  };

  const orderTypeLabel = (type: ActiveOrder["order_type"]) => {
    switch (type) {
      case "dine_in":
        return "🍽️ Mesa";
      case "takeaway":
        return "🥡 Take Away";
      case "delivery":
        return "🚚 Delivery";
      default:
        return type;
    }
  };

  const formatTime = (createdAt: string) => {
    const mins = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / 60000,
    );
    if (mins < 1) return "Agora";
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const counts = {
    all: orders.length,
    OPEN: orders.filter((o) => o.status === "OPEN").length,
    IN_PREP: orders.filter((o) => o.status === "IN_PREP").length,
    READY: orders.filter((o) => o.status === "READY").length,
  };

  return (
    <div className="tpvm-orders-view">
      {/* Filter tabs */}
      <div className="tpvm-orders-filter">
        {(["all", "OPEN", "IN_PREP", "READY"] as const).map((f) => (
          <button
            key={f}
            className={`tpvm-orders-filter__btn ${
              filter === f ? "tpvm-orders-filter__btn--active" : ""
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" && `Todos (${counts.all})`}
            {f === "OPEN" && `Abertos (${counts.OPEN})`}
            {f === "IN_PREP" && `Preparando (${counts.IN_PREP})`}
            {f === "READY" && `Prontos (${counts.READY})`}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="tpvm-orders-loading">A carregar pedidos...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="tpvm-orders-empty">
          <span className="tpvm-orders-empty__icon">📋</span>
          <span>Nenhum pedido ativo</span>
        </div>
      ) : (
        <div className="tpvm-orders-list">
          {filteredOrders.map((order) => (
            <button
              key={order.id}
              className="tpvm-order-card"
              onClick={() => onSelectOrder(order.id)}
            >
              <div className="tpvm-order-card__header">
                <span className="tpvm-order-card__number">
                  #{order.order_number ?? order.id.slice(0, 6).toUpperCase()}
                </span>
                <span
                  className={`tpvm-order-card__status tpvm-order-card__status--${order.status.toLowerCase()}`}
                >
                  {statusLabel(order.status)}
                </span>
              </div>
              <div className="tpvm-order-card__body">
                <span className="tpvm-order-card__type">
                  {orderTypeLabel(order.order_type)}
                </span>
                {order.table_number && (
                  <span className="tpvm-order-card__table">
                    Mesa {order.table_number}
                  </span>
                )}
              </div>
              <div className="tpvm-order-card__footer">
                <span className="tpvm-order-card__items">
                  {order.item_count} itens
                </span>
                <span className="tpvm-order-card__time">
                  {formatTime(order.created_at)}
                </span>
                <span className="tpvm-order-card__total">
                  {formatCurrency(order.total_cents)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
