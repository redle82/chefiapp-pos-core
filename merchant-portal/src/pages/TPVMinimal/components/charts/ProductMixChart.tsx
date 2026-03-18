/**
 * ProductMixChart — Horizontal bar chart of top 10 products by quantity sold.
 *
 * Uses Recharts. Orange bars (#f97316). Dark theme.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { ProductMixItem } from "../../hooks/useDashboardData";

interface Props {
  data: ProductMixItem[];
}

export function ProductMixChart({ data }: Props) {
  const { t } = useTranslation("tpv");

  // Truncate long product names for readability
  const chartData = data.map((item) => ({
    ...item,
    displayName:
      item.name.length > 20 ? item.name.slice(0, 18) + "..." : item.name,
  }));

  return (
    <div
      style={{
        background: "#18181b",
        borderRadius: 16,
        padding: 20,
        border: "1px solid #27272a",
      }}
    >
      <h3
        style={{
          color: "var(--text-primary, #fafafa)",
          fontSize: 15,
          fontWeight: 600,
          margin: "0 0 16px 0",
        }}
      >
        {t("dashboard.productMix")}
      </h3>
      {chartData.length === 0 ? (
        <div
          style={{
            color: "var(--text-tertiary, #71717a)",
            fontSize: 14,
            textAlign: "center",
            padding: "40px 0",
          }}
        >
          {t("dashboard.noData")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 36)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis
              type="number"
              stroke="#52525b"
              tick={{ fill: "#71717a", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              stroke="#52525b"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              width={140}
            />
            <Tooltip
              contentStyle={{
                background: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                color: "#fafafa",
                fontSize: 13,
              }}
              formatter={(value: number, name: string) => {
                if (name === "quantity") return [value, t("dashboard.quantity")];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.displayName === label);
                return item?.name ?? label;
              }}
            />
            <Bar
              dataKey="quantity"
              fill="#f97316"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
