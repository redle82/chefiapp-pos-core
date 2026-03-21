import React from "react";

interface DayData {
  date: string;
  discrepancyCents: number;
}

interface ReconciliationHeatmapProps {
  weekData: DayData[];
  onDayClick?: (date: string) => void;
}

function getIntensity(discrepancyCents: number): number {
  if (discrepancyCents === 0) return 0;
  const abs = Math.abs(discrepancyCents);
  if (abs < 100) return 1;
  if (abs < 1000) return 2;
  if (abs < 10000) return 3;
  return 4;
}

export function ReconciliationHeatmap({
  weekData,
  onDayClick,
}: ReconciliationHeatmapProps) {
  const maxIntensity = 4;
  const getBgColor = (intensity: number) => {
    if (intensity === 0) return "var(--surface-subtle, #f3f4f6)";
    const opacity = 0.3 + (intensity / maxIntensity) * 0.6;
    return `rgba(239, 83, 80, ${opacity})`;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 8,
        padding: 16,
      }}
    >
      {weekData.map((d) => {
        const intensity = getIntensity(d.discrepancyCents);
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onDayClick?.(d.date)}
            style={{
              aspectRatio: 1,
              border: "1px solid var(--border-default, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: getBgColor(intensity),
              cursor: onDayClick ? "pointer" : "default",
              fontSize: "0.75rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <span style={{ fontWeight: 600 }}>{new Date(d.date).getDate()}</span>
            <span style={{ opacity: 0.9 }}>
              {d.discrepancyCents === 0 ? "✓" : `${(d.discrepancyCents / 100).toFixed(0)}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
