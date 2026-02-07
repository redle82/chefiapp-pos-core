import type { DashboardOverview } from "../types";

interface RevenueChartCardProps {
  loading: boolean;
  data: DashboardOverview["revenueByHour"];
  onDetailsClick?: () => void;
}

export function RevenueChartCard({ loading, data, onDetailsClick }: RevenueChartCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
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
                color: "#111827",
              }}
            >
              Dinero ingresado
            </h2>
            <button
              type="button"
              onClick={onDetailsClick}
              style={{
                fontSize: 12,
                color: "#7c3aed",
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
                  <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ede9fe" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {/* grade simples */}
              {Array.from({ length: 5 }).map((_, idx) => {
                const y = 20 + (idx * 160) / 4;
                return (
                  <line
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    x1="40"
                    x2="100%"
                    y1={y}
                    y2={y}
                    stroke="#e5e7eb"
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
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    x={x}
                    y={205}
                    fontSize={10}
                    textAnchor="middle"
                    fill="#9ca3af"
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
          backgroundColor: "#e5e7eb",
        }}
      />
      <div
        style={{
          height: 200,
          borderRadius: 8,
          backgroundColor: "#e5e7eb",
        }}
      />
    </div>
  );
}

