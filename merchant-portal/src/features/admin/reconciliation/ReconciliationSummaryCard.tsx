import React from "react";
import { KpiCard } from "../../../ui/design-system/KpiCard";

interface ReconciliationSummaryCardProps {
  label: string;
  value: string | number;
  state?: "healthy" | "warning" | "critical";
  subtext?: string;
}

export function ReconciliationSummaryCard({
  label,
  value,
  state = "healthy",
  subtext,
}: ReconciliationSummaryCardProps) {
  return (
    <KpiCard
      label={label}
      value={value}
      state={state}
      subtext={subtext}
    />
  );
}
