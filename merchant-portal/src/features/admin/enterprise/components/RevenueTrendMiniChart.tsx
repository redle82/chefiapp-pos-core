import React from "react";

interface RevenueTrendMiniChartProps {
  weekRevenueByDate: { date: string; revenueCents: number }[];
}

const W = 120;
const H = 40;
const PAD = 4;

export function RevenueTrendMiniChart({
  weekRevenueByDate,
}: RevenueTrendMiniChartProps) {
  if (!weekRevenueByDate.length) return null;

  const values = weekRevenueByDate.map((d) => d.revenueCents);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const step = innerW / (values.length - 1 || 1);

  const points = values
    .map((v, i) => {
      const x = PAD + i * step;
      const y = PAD + innerH - ((v - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      style={{
        padding: 8,
        borderRadius: 6,
        border: "1px solid var(--border-default, #e5e7eb)",
        backgroundColor: "var(--surface-subtle, #f9fafb)",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Revenue trend (7 days)
      </div>
      <svg
        width={W}
        height={H}
        style={{ display: "block" }}
        aria-hidden
      >
        <polyline
          fill="none"
          stroke="var(--accent, #22c55e)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}
