import { getPreviousMonthPeriod } from "../../../docker-core/server/billing/periodUtils";

describe("periodUtils/getPreviousMonthPeriod", () => {
  it("normal month", () => {
    const result = getPreviousMonthPeriod(new Date("2026-02-25T10:00:00Z"));

    expect(result).toEqual({
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
    });
  });

  it("january edge case", () => {
    const result = getPreviousMonthPeriod(new Date("2026-01-05T10:00:00Z"));

    expect(result).toEqual({
      periodStart: "2025-12-01",
      periodEnd: "2025-12-31",
    });
  });

  it("leap year", () => {
    const result = getPreviousMonthPeriod(new Date("2024-03-10T10:00:00Z"));

    expect(result).toEqual({
      periodStart: "2024-02-01",
      periodEnd: "2024-02-29",
    });
  });

  it("timezone independence", () => {
    const plus14 = getPreviousMonthPeriod(
      new Date("2026-03-15T12:00:00+14:00"),
    );
    const minus11 = getPreviousMonthPeriod(
      new Date("2026-03-15T12:00:00-11:00"),
    );

    expect(plus14).toEqual({
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
    });
    expect(minus11).toEqual({
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
    });
  });
});
