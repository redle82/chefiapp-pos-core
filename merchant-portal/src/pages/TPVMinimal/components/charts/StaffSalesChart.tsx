/**
 * StaffSalesChart — Vertical bar chart showing revenue per operator today.
 *
 * Uses Recharts. Orange bars with dark theme styling.
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
import type { StaffSalesData } from "../../hooks/useDashboardData";

interface Props {
  data: StaffSalesData[];
}

export function StaffSalesChart({ data }: Props) {
  const { t } = useTranslation("tpv");

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
        {t("dashboard.staffSales")}
      </h3>
      {data.length === 0 ? (
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
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="name"
              stroke="#52525b"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fill: "#71717a", fontSize: 11 }}
              width={60}
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
                if (name === "revenue") {
                  return [
                    new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: "EUR",
                    }).format(value),
                    t("dashboard.revenue"),
                  ];
                }
                return [value, name];
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
