/**
 * PaymentMethodsChart — Donut chart of revenue by payment method.
 *
 * Colors: Cash=#22c55e, Card=#3b82f6, Pix=#8b5cf6, SumUp=#f97316.
 * Other methods get a fallback color.
 */

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import type { PaymentMethodData } from "../../hooks/useDashboardData";

interface Props {
  data: PaymentMethodData[];
}

const METHOD_COLORS: Record<string, string> = {
  cash: "#22c55e",
  card: "#3b82f6",
  pix: "#8b5cf6",
  sumup: "#f97316",
  mbway: "#06b6d4",
  multibanco: "#eab308",
};

const FALLBACK_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f43f5e"];

function getMethodColor(method: string, index: number): string {
  const key = method.toLowerCase();
  return METHOD_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function PaymentMethodsChart({ data }: Props) {
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
        {t("dashboard.paymentMethods")}
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
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="method"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.method}
                  fill={getMethodColor(entry.method, index)}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                color: "#fafafa",
                fontSize: 13,
              }}
              formatter={(value: number) => [
                new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "EUR",
                }).format(value),
                t("dashboard.revenue"),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => (
                <span style={{ color: "#a1a1aa" }}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
