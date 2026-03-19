/**
 * TipSummaryWidget — Admin dashboard card showing tip totals and per-operator breakdown.
 *
 * Features:
 * - Today's total tips
 * - Per-operator breakdown with bar chart
 * - Date range filter (today, last 7 days, last 30 days, custom)
 * - Embeddable in the dashboard grid
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import {
  getTipsByOperator,
  type TipSummary,
} from "../../../core/payment/TipService";

type DatePreset = "today" | "week" | "month" | "custom";

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  switch (preset) {
    case "today":
      return { from: to, to };
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case "month": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: d.toISOString().slice(0, 10), to };
    }
    default:
      return { from: to, to };
  }
}

export function TipSummaryWidget() {
  const { t } = useTranslation("tips");
  const { formatAmount } = useCurrency();
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? "";

  const [preset, setPreset] = useState<DatePreset>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<TipSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    getTipsByOperator(restaurantId, range.from, range.to)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [restaurantId, range.from, range.to]);

  const maxOperatorTip = summary
    ? Math.max(...summary.byOperator.map((o) => o.totalCents), 1)
    : 1;

  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 16,
        padding: 20,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          {t("widgetTitle")}
        </h3>
      </div>

      {/* Date filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {(["today", "week", "month", "custom"] as DatePreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            style={{
              padding: "5px 10px",
              background: preset === p ? "#451a03" : "#09090b",
              border: `1px solid ${preset === p ? "#f59e0b" : "#3f3f46"}`,
              borderRadius: 8,
              color: preset === p ? "#fbbf24" : "#a1a1aa",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t(`filter.${p}`)}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {preset === "custom" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 8px",
              background: "#09090b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              color: "#e4e4e7",
              fontSize: 12,
            }}
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 8px",
              background: "#09090b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              color: "#e4e4e7",
              fontSize: 12,
            }}
          />
        </div>
      )}

      {/* Total */}
      <div
        style={{
          background: "#09090b",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "#71717a",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 4,
            }}
          >
            {t("totalTips")}
          </div>
          <div style={{ color: "#f59e0b", fontSize: 24, fontWeight: 800 }}>
            {loading ? "..." : formatAmount(summary?.totalCents ?? 0)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              color: "#71717a",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 4,
            }}
          >
            {t("orderCount")}
          </div>
          <div style={{ color: "#e4e4e7", fontSize: 18, fontWeight: 700 }}>
            {loading ? "..." : (summary?.totalCount ?? 0)}
          </div>
        </div>
      </div>

      {/* Per-operator breakdown */}
      {!loading && summary && summary.byOperator.length > 0 && (
        <div>
          <div
            style={{
              color: "#71717a",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            {t("byOperator")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {summary.byOperator.map((op) => (
              <div key={op.operatorId || "unassigned"}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "#d4d4d8", fontSize: 13, fontWeight: 500 }}>
                    {op.operatorName}
                  </span>
                  <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700 }}>
                    {formatAmount(op.totalCents)}
                    <span style={{ color: "#71717a", fontWeight: 400, marginLeft: 4 }}>
                      ({op.count})
                    </span>
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    background: "#27272a",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(op.totalCents / maxOperatorTip) * 100}%`,
                      background: "#f59e0b",
                      borderRadius: 2,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && summary && summary.totalCount === 0 && (
        <div
          style={{
            color: "#52525b",
            fontSize: 13,
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          {t("noTips")}
        </div>
      )}
    </div>
  );
}
