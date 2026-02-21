// @ts-nocheck
import React, { useEffect, useState } from "react";
// LEGACY / LAB — blocked in Docker mode
import { db } from "../../core/db";
import { isDevStableMode } from "../../core/runtime/devStableMode";
import { useTenant } from "../../core/tenant/TenantContext";
import { currencyService } from "../../core/currency/CurrencyService";

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

export const DeliveryMonitor: React.FC = () => {
  const { tenantId } = useTenant();
  const [orders, setOrders] = useState<IntegrationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IntegrationOrder | null>(
    null,
  );

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
              Realtime buffer view (Dead Letter Queue)
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
        </div>
      </header>

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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  No integration orders received yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.external_id} className="hover:bg-gray-50">
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
                    <span className="capitalize">{order.status}</span>
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
