/**
 * TPVMobileKDSView — Kitchen Display System for mobile
 *
 * Shows orders grouped by status:
 * - PENDENTES: New orders waiting to start
 * - A PREPARAR: Orders being prepared
 * - PRONTOS: Ready for pickup/delivery
 *
 * Features:
 * - Real-time order list with timers
 * - Swipe to mark as ready
 * - Long-press to see details
 */

import { useEffect, useState } from "react";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

interface KDSOrder {
  id: string;
  order_number?: string;
  table_number?: number;
  order_type: "dine_in" | "takeaway" | "delivery";
  status: "OPEN" | "IN_PREP" | "READY";
  total_cents: number;
  created_at: string;
  item_count: number;
}

interface TPVMobileKDSViewProps {
  restaurantId: string;
}

export function TPVMobileKDSView({ restaurantId }: TPVMobileKDSViewProps) {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = async () => {
      setLoading(true);

      const { data } = await dockerCoreClient
        .from("gm_orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .in("status", ["OPEN", "IN_PREP", "READY"]);

      if (data && Array.isArray(data)) {
        const mappedOrders = data.map((order: any) => ({
          id: order.id as string,
          order_number: (order.order_number as string) ?? undefined,
          table_number: (order.table_number as number) ?? undefined,
          order_type: ((order.order_type as string) ??
            "dine_in") as KDSOrder["order_type"],
          status: order.status as string as KDSOrder["status"],
          total_cents: (order.total_cents as number) ?? 0,
          created_at: (order.created_at as string) ?? new Date().toISOString(),
          item_count: 0,
        }));
        // Sort by created_at in JavaScript instead of SQL
        mappedOrders.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        setOrders(mappedOrders);
      }

      setLoading(false);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000); // Refresh every 3s
    return () => clearInterval(interval);
  }, [restaurantId]);

  const pendentes = orders.filter((o) => o.status === "OPEN");
  const preparando = orders.filter((o) => o.status === "IN_PREP");
  const prontos = orders.filter((o) => o.status === "READY");

  const handleStartPrep = async (orderId: string) => {
    await dockerCoreClient
      .from("gm_orders")
      .update({ status: "IN_PREP" })
      .eq("id", orderId);
  };

  const handleMarkReady = async (orderId: string) => {
    await dockerCoreClient
      .from("gm_orders")
      .update({ status: "READY" })
      .eq("id", orderId);
  };

  const formatTime = (createdAt: string) => {
    const mins = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / 60000,
    );
    if (mins < 1) return "0m";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins}m`;
  };

  const orderTypeIcon = (type: KDSOrder["order_type"]) => {
    switch (type) {
      case "dine_in":
        return "🍽️";
      case "takeaway":
        return "🥡";
      case "delivery":
        return "🚚";
    }
  };

  return (
    <div className="tpvm-kds-view">
      {/* Status headers */}
      <div className="tpvm-kds-headers">
        <div className="tpvm-kds-header">
          <span className="tpvm-kds-header__icon">🏃</span>
          <span className="tpvm-kds-header__label">PENDENTES</span>
          <span className="tpvm-kds-header__count">{pendentes.length}</span>
        </div>

        <div className="tpvm-kds-header">
          <span className="tpvm-kds-header__icon">🔥</span>
          <span className="tpvm-kds-header__label">A PREPARAR</span>
          <span className="tpvm-kds-header__count">{preparando.length}</span>
        </div>

        <div className="tpvm-kds-header">
          <span className="tpvm-kds-header__icon">✅</span>
          <span className="tpvm-kds-header__label">PRONTOS</span>
          <span className="tpvm-kds-header__count">{prontos.length}</span>
        </div>
      </div>

      {/* Order lists */}
      <div className="tpvm-kds-grid">
        {/* Pendentes column */}
        <div className="tpvm-kds-column">
          {loading && <div className="tpvm-kds-loading">A carregar...</div>}
          {!loading &&
            (pendentes.length === 0 ? (
              <div className="tpvm-kds-empty">Nenhum pedido</div>
            ) : (
              pendentes.map((order) => (
                <KDSOrderCard
                  key={order.id}
                  order={order}
                  formatTime={formatTime}
                  orderTypeIcon={orderTypeIcon}
                  onAction={() => handleStartPrep(order.id)}
                  actionLabel="Iniciar"
                />
              ))
            ))}
        </div>

        {/* Preparando column */}
        <div className="tpvm-kds-column">
          {preparando.length === 0 ? (
            <div className="tpvm-kds-empty">Nenhum pedido</div>
          ) : (
            preparando.map((order) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                formatTime={formatTime}
                orderTypeIcon={orderTypeIcon}
                onAction={() => handleMarkReady(order.id)}
                actionLabel="Pronto"
              />
            ))
          )}
        </div>

        {/* Prontos column */}
        <div className="tpvm-kds-column">
          {prontos.length === 0 ? (
            <div className="tpvm-kds-empty">Nenhum pedido</div>
          ) : (
            prontos.map((order) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                formatTime={formatTime}
                orderTypeIcon={orderTypeIcon}
                onAction={() => {}}
                actionLabel="Entregue"
                isReady
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface KDSOrderCardProps {
  order: KDSOrder;
  formatTime: (date: string) => string;
  orderTypeIcon: (type: KDSOrder["order_type"]) => string;
  onAction: () => void;
  actionLabel: string;
  isReady?: boolean;
}

function KDSOrderCard({
  order,
  formatTime,
  orderTypeIcon,
  onAction,
  actionLabel,
  isReady,
}: KDSOrderCardProps) {
  return (
    <div className={`tpvm-kds-order ${isReady ? "tpvm-kds-order--ready" : ""}`}>
      <div className="tpvm-kds-order__header">
        <span className="tpvm-kds-order__number">
          #{order.order_number ?? order.id.slice(0, 6).toUpperCase()}
        </span>
        <span className="tpvm-kds-order__time">
          {formatTime(order.created_at)}
        </span>
      </div>

      <div className="tpvm-kds-order__body">
        {order.table_number && (
          <span className="tpvm-kds-order__table">
            Mesa {order.table_number}
          </span>
        )}
        {!order.table_number && (
          <span className="tpvm-kds-order__type">
            {orderTypeIcon(order.order_type)}
          </span>
        )}
      </div>

      {!isReady && (
        <button className="tpvm-kds-order__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
