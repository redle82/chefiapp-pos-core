import { useEffect, useState } from "react";
import {
  getConsolidatedReport,
  type ConsolidatedReport,
} from "../../../../core/multi-location/MultiLocationService";
import { useRestaurantRuntime } from "../../../../core/runtime/useRestaurantRuntime";

export default function ConsolidatedDashboardPage() {
  const { restaurantId } = useRestaurantRuntime();
  const [report, setReport] = useState<ConsolidatedReport | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    if (restaurantId) {
      getConsolidatedReport(restaurantId).then(setReport);
    }
  }, [restaurantId, period]);

  const fmt = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  return (
    <div className="page-enter admin-content-page" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#fafafa", fontSize: 24, fontWeight: 700, margin: 0 }}>Multi-Location Overview</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                background: period === p ? "#f59e0b" : "transparent",
                color: period === p ? "#0a0a0a" : "#a3a3a3",
                border: period === p ? "none" : "1px solid #262626",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {report && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Revenue", value: fmt(report.totalRevenue) },
              { label: "Total Orders", value: report.totalOrders.toString() },
              { label: "Avg Ticket", value: fmt(report.avgTicket) },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: "#171717", borderRadius: 12, padding: 20, border: "1px solid #262626", textAlign: "center" }}>
                <div style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ color: "#fafafa", fontSize: 28, fontWeight: 700 }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#171717", borderRadius: 12, padding: 20, border: "1px solid #262626" }}>
            <h3 style={{ color: "#fafafa", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Location Comparison</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #262626" }}>
                  {["Location", "Revenue", "Orders", "Avg Ticket", "Trend"].map((h) => (
                    <th key={h} style={{ color: "#a3a3a3", fontWeight: 500, padding: "8px 12px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.locations.map((loc) => (
                  <tr key={loc.locationId} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ color: "#fafafa", padding: "10px 12px", fontWeight: 500 }}>{loc.locationName}</td>
                    <td style={{ color: "#fafafa", padding: "10px 12px" }}>{fmt(loc.revenue)}</td>
                    <td style={{ color: "#a3a3a3", padding: "10px 12px" }}>{loc.orders}</td>
                    <td style={{ color: "#a3a3a3", padding: "10px 12px" }}>{fmt(loc.avgTicket)}</td>
                    <td style={{ padding: "10px 12px", color: loc.trend >= 0 ? "#22c55e" : "#ef4444" }}>
                      {loc.trend >= 0 ? "↑" : "↓"} {Math.abs(loc.trend)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
