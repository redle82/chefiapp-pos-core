import type { DashboardOverview } from "../types";
import { colors } from "../../../../ui/design-system/tokens/colors";

const theme = colors.modes.dashboard;

interface RevenueChartCardProps {
  loading: boolean;
  data: DashboardOverview["revenueByHour"];
  onDetailsClick?: () => void;
}

export function RevenueChartCard({
  loading,
  data,
  onDetailsClick,
}: RevenueChartCardProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface.layer1,
        borderRadius: 12,
        border: `1px solid ${theme.border.subtle}`,
        padding: "18px 20px",
      }}
    >
      {loading ? (
        <SkeletonRevenue />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                color: theme.text.primary,
              }}
            >
              Dinero ingresado
            </h2>
            <button
              type="button"
              onClick={onDetailsClick}
              style={{
                fontSize: 12,
                color: theme.action.base,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Ver detalles
            </button>
          </div>
          <div
            style={{
              height: 220,
              position: "relative",
            }}
          >
            <svg width="100%" height="100%">
              <defs>
                <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.action.base} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={theme.action.base} stopOpacity="0.08" />
                </linearGradient>
              </defs>
              {/* grade simples */}
              {Array.from({ length: 5 }).map((_, idx) => {
                const y = 20 + (idx * 160) / 4;
                return (
                  <line
                    key={`grid-${idx}`}
                    x1="40"
                    x2="100%"
                    y1={y}
                    y2={y}
                    stroke={theme.border.subtle}
                    strokeWidth={1}
                  />
                );
              })}
              {/* eixo X com labels */}
              {data.map((point, idx) => {
                const x =
                  40 +
                  (idx * (1000 - 80)) /
                    Math.max(data.length - 1, 1); /* escala aproximada */
                return (
                  <text
                    key={`label-${point.hour}-${idx}`}
                    x={x}
                    y={205}
                    fontSize={10}
                    textAnchor="middle"
                    fill={theme.text.secondary}
                  >
                    {point.hour}
                  </text>
                );
              })}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonRevenue() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 160,
          height: 14,
          borderRadius: 999,
          backgroundColor: theme.border.subtle,
        }}
      />
      <div
        style={{
          height: 200,
          borderRadius: 8,
          backgroundColor: theme.border.subtle,
        }}
      />
    </div>
  );
}
