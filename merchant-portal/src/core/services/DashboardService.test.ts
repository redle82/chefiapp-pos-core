import { describe, expect, it, vi } from "vitest";
import { DashboardService } from "./DashboardService";

// Mock Supabase
vi.mock("../../supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock Env
vi.stubGlobal("import.meta", { env: { DEV: true } });

describe("DashboardService - Forecaster", () => {
  it("should generate a valid bell curve forecast for trial mode", async () => {
    const service = new DashboardService();
    const forecast = await DashboardService.getShiftForecast("trial-id");

    // 1. Check Data Quantity (24 hours or close)
    expect(forecast.length).toBeGreaterThan(0);
    console.log(`Generated ${forecast.length} data points.`);

    // 2. Check Structure
    const sample = forecast[0];
    expect(sample).toHaveProperty("hour");
    expect(sample).toHaveProperty("expected");
    expect(sample).toHaveProperty("actual");

    // 3. Verify Bell Curve Peaks
    // Find expected sales at peak hours
    const lunchPeak = forecast.find((f) => f.hour === 13)?.expected || 0;
    const dinnerPeak = forecast.find((f) => f.hour === 20)?.expected || 0;
    const offPeak = forecast.find((f) => f.hour === 16)?.expected || 0;
    const veryOffPeak = forecast.find((f) => f.hour === 3)?.expected || 0; // 3 AM

    console.log(`
            Lunch Peak (13h): ${lunchPeak.toFixed(1)}
            Off Peak (16h): ${offPeak.toFixed(1)}
            Dinner Peak (20h): ${dinnerPeak.toFixed(1)}
            Night (03h): ${veryOffPeak.toFixed(1)}
        `);

    // Lunch should be significantly higher than off-peak
    expect(lunchPeak).toBeGreaterThan(offPeak);

    // Dinner should be significantly higher than off-peak
    expect(dinnerPeak).toBeGreaterThan(offPeak);

    // Night should be baseline (around 1000-2000)
    expect(veryOffPeak).toBeLessThan(3000);
  });
});
