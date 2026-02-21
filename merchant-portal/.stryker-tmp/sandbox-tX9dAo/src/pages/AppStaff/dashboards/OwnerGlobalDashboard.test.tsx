import { describe, expect, it } from "vitest";
import type { ShiftHistoryItem } from "../../../hooks/useShiftHistory";
import { deriveFinancialSnapshot } from "./ownerGlobalDashboardUtils";

function makeShift(overrides: Partial<ShiftHistoryItem>): ShiftHistoryItem {
  return {
    shift_id: overrides.shift_id ?? "shift-1",
    opened_at: overrides.opened_at ?? "2026-02-10T08:00:00.000Z",
    closed_at: overrides.closed_at ?? "2026-02-10T18:00:00.000Z",
    total_sales_cents: overrides.total_sales_cents ?? 0,
    orders_count: overrides.orders_count ?? 0,
    opening_balance_cents: overrides.opening_balance_cents ?? 0,
    closing_balance_cents: overrides.closing_balance_cents ?? 0,
    opened_by: overrides.opened_by ?? null,
    closed_by: overrides.closed_by ?? null,
    sales_by_method: overrides.sales_by_method ?? null,
  };
}

describe("deriveFinancialSnapshot", () => {
  it("computes today, yesterday, and avg 7d totals", () => {
    const now = new Date("2026-02-10T12:00:00.000Z");
    const history: ShiftHistoryItem[] = [
      makeShift({
        shift_id: "today",
        opened_at: "2026-02-10T08:00:00.000Z",
        total_sales_cents: 10_000,
      }),
      makeShift({
        shift_id: "yesterday",
        opened_at: "2026-02-09T09:00:00.000Z",
        total_sales_cents: 7_000,
      }),
      makeShift({
        shift_id: "day-2",
        opened_at: "2026-02-08T09:00:00.000Z",
        total_sales_cents: 4_000,
      }),
    ];

    const result = deriveFinancialSnapshot(history, now);

    expect(result.todayCents).toBe(10_000);
    expect(result.yesterdayCents).toBe(7_000);
    expect(result.avg7dCents).toBe(3_000);
  });

  it("returns zeros when history is empty", () => {
    const now = new Date("2026-02-10T12:00:00.000Z");
    const result = deriveFinancialSnapshot([], now);

    expect(result.todayCents).toBe(0);
    expect(result.yesterdayCents).toBe(0);
    expect(result.avg7dCents).toBe(0);
  });
});
