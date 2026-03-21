import { describe, it, expect } from "vitest";
import {
  calculateOrgRiskScore,
  analyzeTrends,
  type OrgLocationWeekData,
} from "./riskEngine";
import type { OrgDailyConsolidation } from "../finance/orgConsolidationApi";

describe("riskEngine", () => {
  describe("calculateOrgRiskScore", () => {
    const baseOrg = (overrides: Partial<OrgDailyConsolidation> = {}): OrgDailyConsolidation => ({
      total_locations: 2,
      total_revenue_cents: 100000,
      total_discrepancy_cents: 0,
      overall_status: "green",
      locations: [],
      ...overrides,
    });

    it("green org returns score 0 and stable", () => {
      const result = calculateOrgRiskScore(baseOrg({ overall_status: "green" }));
      expect(result.score).toBe(0);
      expect(result.level).toBe("stable");
    });

    it("yellow status adds 30, level attention", () => {
      const result = calculateOrgRiskScore(baseOrg({ overall_status: "yellow" }));
      expect(result.score).toBe(30);
      expect(result.level).toBe("attention");
    });

    it("red status adds 70, level high_risk", () => {
      const result = calculateOrgRiskScore(baseOrg({ overall_status: "red" }));
      expect(result.score).toBe(70);
      expect(result.level).toBe("high_risk");
    });

    it("ratio > 1% adds 10", () => {
      const result = calculateOrgRiskScore(
        baseOrg({
          overall_status: "green",
          total_discrepancy_cents: 1500,
          total_revenue_cents: 100000,
        })
      );
      expect(result.score).toBe(10);
    });

    it("ratio > 3% adds 20", () => {
      const result = calculateOrgRiskScore(
        baseOrg({
          overall_status: "green",
          total_discrepancy_cents: 3500,
          total_revenue_cents: 100000,
        })
      );
      expect(result.score).toBe(20);
    });

    it("ratio > 5% adds 30", () => {
      const result = calculateOrgRiskScore(
        baseOrg({
          overall_status: "green",
          total_discrepancy_cents: 6000,
          total_revenue_cents: 100000,
        })
      );
      expect(result.score).toBe(30);
    });

    it("red + ratio > 5% caps at 100", () => {
      const result = calculateOrgRiskScore(
        baseOrg({
          overall_status: "red",
          total_discrepancy_cents: 10000,
          total_revenue_cents: 100000,
        })
      );
      expect(result.score).toBe(100);
      expect(result.level).toBe("high_risk");
    });
  });

  describe("analyzeTrends", () => {
    it("no trend when all green", () => {
      const weekData: OrgLocationWeekData[] = [
        {
          restaurant_id: "r1",
          restaurant_name: "A",
          days: [
            { date: "2026-02-24", discrepancyCents: 0 },
            { date: "2026-02-25", discrepancyCents: 0 },
            { date: "2026-02-26", discrepancyCents: 0 },
          ],
        },
      ];
      const result = analyzeTrends(weekData);
      expect(result.hasTrendWarning).toBe(false);
      expect(result.hasEscalationNotice).toBe(false);
    });

    it("3 consecutive yellow triggers trend warning", () => {
      const weekData: OrgLocationWeekData[] = [
        {
          restaurant_id: "r1",
          restaurant_name: "A",
          days: [
            { date: "2026-02-24", discrepancyCents: 500 },
            { date: "2026-02-25", discrepancyCents: 600 },
            { date: "2026-02-26", discrepancyCents: 400 },
          ],
        },
      ];
      const result = analyzeTrends(weekData);
      expect(result.hasTrendWarning).toBe(true);
    });

    it("any red in last 7 days triggers escalation", () => {
      const weekData: OrgLocationWeekData[] = [
        {
          restaurant_id: "r1",
          restaurant_name: "A",
          days: [
            { date: "2026-02-24", discrepancyCents: 0 },
            { date: "2026-02-25", discrepancyCents: 1500 },
          ],
        },
      ];
      const result = analyzeTrends(weekData);
      expect(result.hasEscalationNotice).toBe(true);
    });

    it("2 consecutive yellow does not trigger trend", () => {
      const weekData: OrgLocationWeekData[] = [
        {
          restaurant_id: "r1",
          restaurant_name: "A",
          days: [
            { date: "2026-02-24", discrepancyCents: 500 },
            { date: "2026-02-25", discrepancyCents: 500 },
          ],
        },
      ];
      const result = analyzeTrends(weekData);
      expect(result.hasTrendWarning).toBe(false);
    });
  });
});
