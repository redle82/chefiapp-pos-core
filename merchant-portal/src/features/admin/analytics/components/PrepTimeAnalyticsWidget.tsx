import { useState } from "react";

interface PrepTimeRow {
  product: string;
  category: string;
  configuredMin: number;
  actualAvgMin: number;
  variance: number;
  ordersCount: number;
}

const MOCK_DATA: PrepTimeRow[] = [
  { product: "Pizza Margherita", category: "Pratos", configuredMin: 20, actualAvgMin: 24, variance: 4, ordersCount: 87 },
  { product: "Bruschetta", category: "Entradas", configuredMin: 10, actualAvgMin: 8, variance: -2, ordersCount: 63 },
  { product: "Hambúrguer Artesanal", category: "Pratos", configuredMin: 20, actualAvgMin: 18, variance: -2, ordersCount: 45 },
  { product: "Nachos", category: "Entradas", configuredMin: 10, actualAvgMin: 12, variance: 2, ordersCount: 52 },
  { product: "Tiramisú", category: "Sobremesas", configuredMin: 10, actualAvgMin: 5, variance: -5, ordersCount: 31 },
  { product: "Água", category: "Bebidas", configuredMin: 3, actualAvgMin: 2, variance: -1, ordersCount: 120 },
];

export default function PrepTimeAnalyticsWidget() {
  const [data] = useState(MOCK_DATA);

  const overdueCount = data.filter((r) => r.variance > 0).length;
  const overdueRate = Math.round((overdueCount / data.length) * 100);
  const suggestions = data
    .filter((r) => r.variance > 2)
    .map((r) => `${r.product} takes avg ${r.actualAvgMin}min — consider updating from ${r.configuredMin}min`);

  return (
    <div style={{ background: "#171717", borderRadius: 12, padding: 24, border: "1px solid #262626" }}>
      <h3 style={{ color: "#fafafa", fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Prep Time Analytics
      </h3>

      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 8, padding: 16, textAlign: "center" }}>
          <div style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 4 }}>Avg Prep Time</div>
          <div style={{ color: "#fafafa", fontSize: 24, fontWeight: 700 }}>
            {Math.round(data.reduce((s, r) => s + r.actualAvgMin, 0) / data.length)}min
          </div>
        </div>
        <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 8, padding: 16, textAlign: "center" }}>
          <div style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 4 }}>Overdue Rate</div>
          <div style={{ color: overdueRate > 30 ? "#ef4444" : overdueRate > 15 ? "#f59e0b" : "#22c55e", fontSize: 24, fontWeight: 700 }}>
            {overdueRate}%
          </div>
        </div>
        <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 8, padding: 16, textAlign: "center" }}>
          <div style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 4 }}>Products Tracked</div>
          <div style={{ color: "#fafafa", fontSize: 24, fontWeight: 700 }}>{data.length}</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #262626" }}>
            {["Product", "Category", "Configured", "Actual Avg", "Variance"].map((h) => (
              <th key={h} style={{ color: "#a3a3a3", fontWeight: 500, padding: "8px 12px", textAlign: "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.product} style={{ borderBottom: "1px solid #1a1a1a" }}>
              <td style={{ color: "#fafafa", padding: "8px 12px" }}>{row.product}</td>
              <td style={{ color: "#a3a3a3", padding: "8px 12px" }}>{row.category}</td>
              <td style={{ color: "#a3a3a3", padding: "8px 12px" }}>{row.configuredMin}min</td>
              <td style={{ color: "#fafafa", padding: "8px 12px" }}>{row.actualAvgMin}min</td>
              <td style={{ padding: "8px 12px", color: row.variance > 0 ? "#ef4444" : row.variance < 0 ? "#22c55e" : "#a3a3a3" }}>
                {row.variance > 0 ? "+" : ""}{row.variance}min
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {suggestions.length > 0 && (
        <div style={{ marginTop: 16, background: "#1c1917", borderRadius: 8, padding: 12, border: "1px solid #f59e0b33" }}>
          <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>💡 Suggestions</div>
          {suggestions.map((s, i) => (
            <div key={i} style={{ color: "#d4d4d4", fontSize: 12, marginBottom: 4 }}>• {s}</div>
          ))}
        </div>
      )}
    </div>
  );
}
