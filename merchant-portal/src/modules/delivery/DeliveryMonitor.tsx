import React, { useCallback, useEffect, useState } from "react";
// LEGACY / LAB — blocked in Docker mode
import { db } from "../../core/db";
import { isDevStableMode } from "../../core/runtime/devStableMode";
import { useTenant } from "../../core/tenant/TenantContext";
import { currencyService } from "../../core/currency/CurrencyService";
import {
  DeliveryOrderCard,
  StatusBadge,
} from "./DeliveryOrderActions";
import type { DeliveryOrderStatus } from "./DeliveryStatusService";

interface IntegrationOrder {
  id: string; // Internal UUID
  external_id: string;
  source: string;
  reference: string;
  status: string;
  customer_name: string;
  total_cents: number;
  received_at: string;
  raw_payload: any;
  error_log?: any;
  // Add other fields from migration if needed
}

type ViewMode = "cards" | "table";
type FilterStatus = "all" | "active" | "pending" | "completed" | "rejected";

export const DeliveryMonitor: React.FC = () => {
  const { tenantId } = useTenant();
  const [orders, setOrders] = useState<IntegrationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IntegrationOrder | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active");

  // Initial Fetch
  useEffect(() => {
    if (!tenantId) return;

    // STEP 6: DEV_STABLE_MODE - one-shot load only, no realtime
    if (isDevStableMode()) {
      const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await db
          .from("integration_orders")
          .select("*")
          .eq("restaurant_id", tenantId)
          .order("received_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("[DeliveryMonitor] Error fetching:", error);
        } else {
          setOrders(data || []);
        }
        setLoading(false);
      };
      fetchOrders();
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await db
        .from("integration_orders")
        .select("*")
        .eq("restaurant_id", tenantId)
        .order("received_at", { ascending: false })
        .limit(50); // Monitor last 50

      if (error) {
        console.error("[DeliveryMonitor] Error fetching:", error);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };

    fetchOrders();

    // Realtime Subscription (using the one enabled by migration)
    const channel = db
      .channel(`monitor-delivery-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "integration_orders",
          filter: `restaurant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newOrder = payload.new as IntegrationOrder;
          setOrders((prev) => [newOrder, ...prev].slice(0, 50));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "integration_orders",
          filter: `restaurant_id=eq.${tenantId}`,
        },
        (payload) => {
          const updated = payload.new as IntegrationOrder;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o)),
          );
        },
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [tenantId]);

  const formatCurrency = (cents: number, currency?: string) => {
    return currencyService.formatAmount(
      cents,
      (currency?.toUpperCase() || currencyService.getDefaultCurrency()) as any,
    );
  };

  const handleStatusChange = useCallback(
    (orderId: string, newStatus: DeliveryOrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    },
    [],
  );

  // Filter orders based on selected filter
  const filteredOrders = orders.filter((order) => {
    switch (filterStatus) {
      case "active":
        return !["completed", "rejected"].includes(order.status);
      case "pending":
        return order.status === "pending";
      case "completed":
        return order.status === "completed";
      case "rejected":
        return order.status === "rejected";
      default:
        return true;
    }
  });

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading Delivery Stream...
      </div>
    );

  const totalOrders = orders.length;
  const totalVolumeCents = orders.reduce(
    (sum, o) => sum + (o.total_cents || 0),
    0,
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const activeCount = orders.filter(
    (o) => !["completed", "rejected"].includes(o.status),
  ).length;

  const handleHealthCheck = async () => {
    alert("Performing Health Check... (This would verify Proxy connection)");
    // Ideally call function 'delivery-proxy' with action='health'
  };

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <header className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Delivery Integration Monitor
            </h1>
            <p className="text-gray-500 text-sm">
              Manage delivery orders and status callbacks
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-medium">
              Glovo Enabled
            </span>
            <button
              onClick={handleHealthCheck}
              className="text-xs bg-white border border-gray-300 px-3 py-1 rounded shadow-sm hover:bg-gray-50 text-gray-700"
            >
              Health Check
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold">
              Total Orders
            </p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold">
              Total Volume
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalVolumeCents)}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold">
              Pending
            </p>
            <p className={`text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-gray-900"}`}>
              {pendingCount}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold">
              Active
            </p>
            <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
          </div>
        </div>
      </header>

      {/* View controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {(
            [
              { key: "active", label: "Active" },
              { key: "pending", label: "Pending" },
              { key: "completed", label: "Done" },
              { key: "rejected", label: "Rejected" },
              { key: "all", label: "All" },
            ] as { key: FilterStatus; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === key
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "cards"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "table"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              No orders match this filter.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <DeliveryOrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                formatCurrency={(cents) => formatCurrency(cents)}
              />
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ref / External ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payload
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No orders match this filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(order.received_at).toLocaleTimeString()} <br />
                      <span className="text-xs text-gray-400">
                        {new Date(order.received_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.source === "glovo"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      <div className="font-bold">{order.reference}</div>
                      <div className="text-gray-400">{order.external_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {formatCurrency(order.total_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                      >
                        JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">
                Raw Payload: {selectedOrder.reference}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-gray-900 text-green-400 font-mono text-xs">
              <pre>{JSON.stringify(selectedOrder.raw_payload, null, 2)}</pre>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
