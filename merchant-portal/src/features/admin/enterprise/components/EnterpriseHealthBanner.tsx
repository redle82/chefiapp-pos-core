import React from "react";
import type { OrgDailyConsolidation } from "../../../../core/finance/orgConsolidationApi";

interface EnterpriseHealthBannerProps {
  data: OrgDailyConsolidation;
  onReviewDiscrepancies?: () => void;
}

export function EnterpriseHealthBanner({
  data,
  onReviewDiscrepancies,
}: EnterpriseHealthBannerProps) {
  const status = data.overall_status;
  const ratio =
    data.total_revenue_cents > 0
      ? ((data.total_discrepancy_cents / data.total_revenue_cents) * 100).toFixed(2)
      : "0";

  if (status === "green") {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: "rgba(76, 175, 80, 0.12)",
          borderLeft: "4px solid #2e7d32",
          fontSize: "0.9rem",
        }}
      >
        All locations financially reconciled
      </div>
    );
  }

  if (status === "yellow") {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: "rgba(255, 152, 0, 0.12)",
          borderLeft: "4px solid #e65100",
          fontSize: "0.9rem",
        }}
      >
        <strong>Warning:</strong> Total discrepancy {ratio}% of revenue.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        backgroundColor: "rgba(239, 83, 80, 0.15)",
        borderLeft: "4px solid #c62828",
        fontSize: "0.9rem",
      }}
    >
      <strong>Critical:</strong> Discrepancies require immediate review.{" "}
      {onReviewDiscrepancies && (
        <button
          type="button"
          onClick={onReviewDiscrepancies}
          style={{
            marginLeft: 8,
            padding: "4px 12px",
            borderRadius: 4,
            border: "1px solid #c62828",
            backgroundColor: "transparent",
            color: "#c62828",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Review discrepancies
        </button>
      )}
    </div>
  );
}
