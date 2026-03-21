/**
 * Risk Intelligence Layer — Org risk scoring and trend detection
 */

import type { OrgDailyConsolidation } from "../finance/orgConsolidationApi";

export interface OrgLocationWeekData {
  restaurant_id: string;
  restaurant_name: string;
  days: { date: string; discrepancyCents: number }[];
}

export type RiskLevel = "stable" | "attention" | "high_risk";

export interface OrgRiskScore {
  score: number;
  level: RiskLevel;
}

export interface TrendAnalysis {
  hasTrendWarning: boolean;
  hasEscalationNotice: boolean;
}

/** Derive status from discrepancy cents for trend analysis */
function statusFromDiscrepancy(discrepancyCents: number): "green" | "yellow" | "red" {
  if (discrepancyCents === 0) return "green";
  if (discrepancyCents <= 1000) return "yellow"; // <= €10
  return "red";
}

/**
 * Calculate org risk score from consolidation data.
 * Base 0; +30 yellow, +70 red; +10/20/30 for ratio > 1% / 3% / 5%.
 */
export function calculateOrgRiskScore(orgData: OrgDailyConsolidation): OrgRiskScore {
  let score = 0;

  if (orgData.overall_status === "green") score += 0;
  else if (orgData.overall_status === "yellow") score += 30;
  else score += 70;

  const ratio =
    orgData.total_revenue_cents > 0
      ? (orgData.total_discrepancy_cents / orgData.total_revenue_cents) * 100
      : 0;
  if (ratio > 5) score += 30;
  else if (ratio > 3) score += 20;
  else if (ratio > 1) score += 10;

  const capped = Math.min(100, score);

  let level: RiskLevel = "stable";
  if (capped >= 70) level = "high_risk";
  else if (capped >= 30) level = "attention";

  return { score: capped, level };
}

/**
 * Detect trends from heatmap weekly data:
 * - 3 consecutive days yellow → trend warning
 * - any red in last 7 days → escalation notice
 */
export function analyzeTrends(weekDataPerLocation: OrgLocationWeekData[]): TrendAnalysis {
  let hasTrendWarning = false;
  let hasEscalationNotice = false;

  for (const loc of weekDataPerLocation) {
    const days = loc.days;
    for (let i = 0; i < days.length; i++) {
      const status = statusFromDiscrepancy(days[i].discrepancyCents);
      if (status === "red") hasEscalationNotice = true;
    }
    for (let i = 0; i <= days.length - 3; i++) {
      const s0 = statusFromDiscrepancy(days[i].discrepancyCents);
      const s1 = statusFromDiscrepancy(days[i + 1].discrepancyCents);
      const s2 = statusFromDiscrepancy(days[i + 2].discrepancyCents);
      if (s0 === "yellow" && s1 === "yellow" && s2 === "yellow") {
        hasTrendWarning = true;
        break;
      }
    }
  }

  return { hasTrendWarning, hasEscalationNotice };
}
