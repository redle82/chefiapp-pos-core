/**
 * OrdersPage — Admin view of all orders across the restaurant.
 * Shows order history with filters, search, and status tracking.
 */
import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../core/runtime/useRestaurantRuntime";
import { getDockerCoreFetchClient } from "../../../../infra/dockerCoreFetchClient";

interface OrderRow {
  id: string;
  order_number?: string;
  status: string;
  total_cents: number;
  origin: string;
  table_number?: number;
  operator_name?: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#f59e0b",
  PENDING: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  CLOSED: "#22c55e",
  CANCELLED: "#ef4444",
  PAID: "#22c55e",
};

export default function OrdersPage() {
  const { restaurantId } = useRestaurantRuntime();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        const db = await getDockerCoreFetchClient();
        let query = db
          .from("gm_orders")
          .select("id, order_number, status, total_cents, origin, table_number, operator_name, created_at")
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: false })
          .limit(100);

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data } = await query;
        setOrders((data || []) as OrderRow[]);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId, statusFilter]);

  const fmt = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="page-enter admin-content-page" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#fafafa", fontSize: 24, fontWeight: 700, margin: 0 }}>Orders</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "OPEN", "IN_PROGRESS", "CLOSED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter === s ? "#f59e0b" : "transparent",
                color: statusFilter === s ? "#0a0a0a" : "#a3a3a3",
                border: statusFilter === s ? "none" : "1px solid #262626",
                borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#525252", textAlign: "center", padding: 48 }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ color: "#525252", textAlign: "center", padding: 48 }}>No orders found</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #262626" }}>
              {["Order", "Date", "Origin", "Table", "Status", "Total"].map((h) => (
                <th key={h} style={{ color: "#a3a3a3", fontWeight: 500, padding: "8px 12px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ color: "#f59e0b", padding: "10px 12px", fontFamily: "monospace" }}>
                  #{(order.order_number || order.id).slice(0, 8).toUpperCase()}
                </td>
                <td style={{ color: "#a3a3a3", padding: "10px 12px" }}>{fmtDate(order.created_at)}</td>
                <td style={{ color: "#d4d4d4", padding: "10px 12px" }}>{order.origin || "POS"}</td>
                <td style={{ color: "#a3a3a3", padding: "10px 12px" }}>{order.table_number || "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    background: (STATUS_COLORS[order.status] || "#525252") + "22",
                    color: STATUS_COLORS[order.status] || "#525252",
                    padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
                  }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ color: "#fafafa", padding: "10px 12px", fontWeight: 600 }}>{fmt(order.total_cents || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
