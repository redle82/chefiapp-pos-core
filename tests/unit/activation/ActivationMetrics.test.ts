/**
 * 🧪 ACTIVATION METRICS — UNIT TESTS
 *
 * Tests the metrics aggregation functions for activation tracking.
 * ActivationMetrics reads via TabIsolatedStorage (getTabIsolated), so we mock it to use the test store.
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  aggregateActivationMetrics,
  formatCTR,
  formatTimeRange,
  getActivationMetrics,
  getActivationMetricsInRange,
  getActivationMetricsLastDays,
  getMetricsSummaryText,
  type ActivationEvent,
  type ActivationMetricsSummary,
} from "../../../merchant-portal/src/core/activation/ActivationMetrics";

// Store used by both localStorage mock and TabIsolatedStorage mock (ActivationMetrics uses getTabIsolated, not localStorage)
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
};

Object.defineProperty(global, "localStorage", { value: localStorageMock });

jest.mock(
  "../../../merchant-portal/src/core/storage/TabIsolatedStorage",
  () => ({
    getTabIsolated: jest.fn((key: string) => store[key] ?? null),
    setTabIsolated: jest.fn(),
    removeTabIsolated: jest.fn(),
    clearTabIsolated: jest.fn(),
  })
);

describe("ActivationMetrics", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("aggregateActivationMetrics", () => {
    it("should return empty metrics for empty events", () => {
      const result = aggregateActivationMetrics([]);

      expect(result.panelOpens).toBe(0);
      expect(result.views).toBe(0);
      expect(result.clicks).toBe(0);
      expect(result.dismisses).toBe(0);
      expect(result.clickThroughRate).toBe(0);
    });

    it("should count panel opens", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.panel_opened",
          ts: Date.now(),
          payload: { variant: "full" },
        },
        {
          name: "activation.panel_opened",
          ts: Date.now(),
          payload: { variant: "compact" },
        },
      ];

      const result = aggregateActivationMetrics(events);
      expect(result.panelOpens).toBe(2);
    });

    it("should count recommendation views", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-2", impact: "medium" },
        },
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-3", impact: "low" },
        },
      ];

      const result = aggregateActivationMetrics(events);
      expect(result.views).toBe(3);
    });

    it("should count recommendation clicks", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-2", impact: "medium" },
        },
      ];

      const result = aggregateActivationMetrics(events);
      expect(result.clicks).toBe(2);
    });

    it("should count dismisses", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.recommendation_dismissed",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
      ];

      const result = aggregateActivationMetrics(events);
      expect(result.dismisses).toBe(1);
    });

    it("should calculate click-through rate correctly", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-2", impact: "medium" },
        },
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
      ];

      const result = aggregateActivationMetrics(events);
      expect(result.clickThroughRate).toBe(0.5); // 1 click / 2 views
    });

    it("should handle zero views for CTR", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
      ];

      const result = aggregateActivationMetrics(events);
      expect(result.clickThroughRate).toBe(0);
    });

    it("should break down by impact level", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-2", impact: "high" },
        },
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-3", impact: "medium" },
        },
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
      ];

      const result = aggregateActivationMetrics(events);

      expect(result.byImpact.high.views).toBe(2);
      expect(result.byImpact.high.clicks).toBe(1);
      expect(result.byImpact.medium.views).toBe(1);
      expect(result.byImpact.medium.clicks).toBe(0);
      expect(result.byImpact.low.views).toBe(0);
      expect(result.byImpact.low.clicks).toBe(0);
    });

    it("should track top clicked recommendations", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-2", impact: "medium" },
        },
        {
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: "rec-3", impact: "low" },
        },
      ];

      const result = aggregateActivationMetrics(events);

      expect(result.topClicked.length).toBeGreaterThan(0);
      expect(result.topClicked[0].id).toBe("rec-1");
      expect(result.topClicked[0].clicks).toBe(2);
    });

    it("should limit top clicked to 5", () => {
      const events: ActivationEvent[] = [];
      for (let i = 1; i <= 10; i++) {
        events.push({
          name: "activation.recommendation_clicked",
          ts: Date.now(),
          payload: { recommendationId: `rec-${i}`, impact: "high" },
        });
      }

      const result = aggregateActivationMetrics(events);
      expect(result.topClicked.length).toBeLessThanOrEqual(5);
    });

    it("should calculate time range", () => {
      const now = Date.now();
      const events: ActivationEvent[] = [
        { name: "activation.panel_opened", ts: now - 1000, payload: {} },
        { name: "activation.panel_opened", ts: now, payload: {} },
      ];

      const result = aggregateActivationMetrics(events);

      expect(result.timeRange.earliest).toBe(now - 1000);
      expect(result.timeRange.latest).toBe(now);
    });

    it("should filter out non-activation events", () => {
      const events: ActivationEvent[] = [
        { name: "activation.panel_opened", ts: Date.now(), payload: {} },
        { name: "other.event", ts: Date.now(), payload: {} },
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
      ];

      const result = aggregateActivationMetrics(events);

      expect(result.panelOpens).toBe(1);
      expect(result.views).toBe(1);
    });
  });

  describe("getActivationMetrics", () => {
    it("should read from localStorage and aggregate", () => {
      const events: ActivationEvent[] = [
        {
          name: "activation.panel_opened",
          ts: Date.now(),
          payload: { variant: "full" },
        },
        {
          name: "activation.recommendation_viewed",
          ts: Date.now(),
          payload: { recommendationId: "rec-1", impact: "high" },
        },
      ];

      localStorage.setItem("chefiapp_analytics_queue", JSON.stringify(events));

      const result = getActivationMetrics();

      expect(result.panelOpens).toBe(1);
      expect(result.views).toBe(1);
    });

    it("should handle empty localStorage", () => {
      const result = getActivationMetrics();

      expect(result.panelOpens).toBe(0);
      expect(result.views).toBe(0);
    });

    it("should handle invalid JSON in localStorage", () => {
      localStorage.setItem("chefiapp_analytics_queue", "invalid json");

      const result = getActivationMetrics();

      expect(result.panelOpens).toBe(0);
    });
  });

  describe("getActivationMetricsInRange", () => {
    it("should filter events by time range", () => {
      const now = Date.now();
      const events: ActivationEvent[] = [
        { name: "activation.panel_opened", ts: now - 2000, payload: {} },
        { name: "activation.panel_opened", ts: now - 1000, payload: {} },
        { name: "activation.panel_opened", ts: now + 1000, payload: {} },
      ];

      localStorage.setItem("chefiapp_analytics_queue", JSON.stringify(events));

      const result = getActivationMetricsInRange(now - 1500, now - 500);

      expect(result.panelOpens).toBe(1); // Only the middle event
    });
  });

  describe("getActivationMetricsLastDays", () => {
    it("should get metrics for last N days", () => {
      const now = Date.now();
      const events: ActivationEvent[] = [
        {
          name: "activation.panel_opened",
          ts: now - 2 * 24 * 60 * 60 * 1000,
          payload: {},
        },
        {
          name: "activation.panel_opened",
          ts: now - 1 * 24 * 60 * 60 * 1000,
          payload: {},
        },
        {
          name: "activation.panel_opened",
          ts: now - 5 * 24 * 60 * 60 * 1000,
          payload: {},
        },
      ];

      localStorage.setItem("chefiapp_analytics_queue", JSON.stringify(events));

      const result = getActivationMetricsLastDays(3);

      expect(result.panelOpens).toBe(2); // Only last 3 days
    });
  });

  describe("formatCTR", () => {
    it("should format CTR as percentage", () => {
      expect(formatCTR(0.5)).toBe("50.0%");
      expect(formatCTR(0.123)).toBe("12.3%");
      expect(formatCTR(1)).toBe("100.0%");
    });
  });

  describe("formatTimeRange", () => {
    it("should format time range correctly", () => {
      const now = Date.now();
      const result = formatTimeRange(now - 86400000, now);

      expect(result).toContain("-");
    });

    it('should return "Sem dados" for null range', () => {
      expect(formatTimeRange(null, null)).toBe("Sem dados");
    });

    it("should return single date when start equals end", () => {
      const now = Date.now();
      const result = formatTimeRange(now, now);

      // Should be a single date, not a range
      expect(result).not.toContain("-");
    });
  });

  describe("getMetricsSummaryText", () => {
    it("should return message for no views", () => {
      const metrics: ActivationMetricsSummary = {
        panelOpens: 0,
        views: 0,
        clicks: 0,
        dismisses: 0,
        clickThroughRate: 0,
        byImpact: {
          high: { views: 0, clicks: 0 },
          medium: { views: 0, clicks: 0 },
          low: { views: 0, clicks: 0 },
        },
        topClicked: [],
        timeRange: { earliest: null, latest: null },
      };

      const result = getMetricsSummaryText(metrics);
      expect(result).toContain("Nenhuma recomendação");
    });

    it("should return summary with CTR and high priority", () => {
      const metrics: ActivationMetricsSummary = {
        panelOpens: 5,
        views: 10,
        clicks: 3,
        dismisses: 2,
        clickThroughRate: 0.3,
        byImpact: {
          high: { views: 5, clicks: 2 },
          medium: { views: 3, clicks: 1 },
          low: { views: 2, clicks: 0 },
        },
        topClicked: [],
        timeRange: { earliest: Date.now(), latest: Date.now() },
      };

      const result = getMetricsSummaryText(metrics);
      expect(result).toContain("10 visualizações");
      expect(result).toContain("3 cliques");
      expect(result).toContain("30.0%");
      expect(result).toContain("2/5");
    });
  });
});
