import React from "react";
import type { OrgLocationWeekData } from "./useOrgConsolidation";

interface OrgHeatmapProps {
  weekDataPerLocation: OrgLocationWeekData[];
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

export function OrgHeatmap({
  weekDataPerLocation,
  onDayClick,
}: OrgHeatmapProps) {
  const maxIntensity = 4;
  const getBgColor = (intensity: number) => {
    if (intensity === 0) return "var(--surface-subtle, #f3f4f6)";
    const opacity = 0.3 + (intensity / maxIntensity) * 0.6;
    return `rgba(239, 83, 80, ${opacity})`;
  };

  if (!weekDataPerLocation.length) return null;

  return (
    <div
      style={{
        overflowX: "auto",
        padding: 16,
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          fontSize: "0.75rem",
          minWidth: 400,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                padding: "8px 12px",
                textAlign: "left",
                fontWeight: 600,
                borderBottom: "1px solid var(--border-default, #e5e7eb)",
              }}
            >
              Local
            </th>
            {weekDataPerLocation[0]?.days.map((d) => (
              <th
                key={d.date}
                style={{
                  padding: "8px 4px",
                  textAlign: "center",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border-default, #e5e7eb)",
                }}
              >
                {new Date(d.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekDataPerLocation.map((loc) => (
            <tr key={loc.restaurant_id}>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-default, #e5e7eb)",
                }}
              >
                {loc.restaurant_name}
              </td>
              {loc.days.map((d) => {
                const intensity = getIntensity(d.discrepancyCents);
                return (
                  <td
                    key={d.date}
                    style={{
                      padding: 4,
                      borderBottom: "1px solid var(--border-default, #e5e7eb)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onDayClick?.(d.date)}
                      style={{
                        width: "100%",
                        minWidth: 44,
                        padding: "8px 4px",
                        border: "1px solid var(--border-default, #e5e7eb)",
                        borderRadius: 6,
                        backgroundColor: getBgColor(intensity),
                        cursor: onDayClick ? "pointer" : "default",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        fontSize: "0.7rem",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {new Date(d.date).getDate()}
                      </span>
                      <span>
                        {d.discrepancyCents === 0
                          ? "✓"
                          : `${(d.discrepancyCents / 100).toFixed(0)}`}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
