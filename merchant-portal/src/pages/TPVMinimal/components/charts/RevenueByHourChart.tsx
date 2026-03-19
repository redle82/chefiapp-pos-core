/**
 * RevenueByHourChart — Line chart comparing today vs yesterday revenue by hour.
 *
 * Uses Recharts. Today = orange (#f97316), yesterday = grey (#525252).
 * Dark theme axes and grid.
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { HourlyRevenue } from "../../hooks/useDashboardData";

interface Props {
  todayData: HourlyRevenue[];
  yesterdayData: HourlyRevenue[];
}

export function RevenueByHourChart({ todayData, yesterdayData }: Props) {
  const { t } = useTranslation("tpv");

  // Merge today and yesterday into a single dataset by hour
  const data = Array.from({ length: 24 }, (_, hour) => {
    const todayEntry = todayData.find((d) => d.hour === hour);
    const yesterdayEntry = yesterdayData.find((d) => d.hour === hour);
    return {
      hour: `${String(hour).padStart(2, "0")}h`,
      today: todayEntry?.amount ?? 0,
      yesterday: yesterdayEntry?.amount ?? 0,
    };
  });

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
        {t("dashboard.revenueByHour")}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="hour"
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 11 }}
            interval={2}
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
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend
            wrapperStyle={{ color: "#a1a1aa", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="today"
            name={t("dashboard.today")}
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#f97316" }}
          />
          <Line
            type="monotone"
            dataKey="yesterday"
            name={t("dashboard.yesterday")}
            stroke="#525252"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4, fill: "#525252" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
