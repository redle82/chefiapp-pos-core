import React from "react";
import { KpiCard } from "../../../ui/design-system/KpiCard";

type StatusState = "healthy" | "warning" | "critical";

interface OrgSummaryCardProps {
  label: string;
  value: string | number;
  state?: "green" | "yellow" | "red" | StatusState;
  subtext?: string;
}

export function OrgSummaryCard({
  label,
  value,
  state = "healthy",
  subtext,
}: OrgSummaryCardProps) {
  const resolvedState: StatusState =
    state === "green"
      ? "healthy"
      : state === "yellow"
        ? "warning"
        : state === "red"
          ? "critical"
          : state;

  return (
    <KpiCard
      label={label}
      value={value}
      state={resolvedState}
      subtext={subtext}
    />
  );
}
