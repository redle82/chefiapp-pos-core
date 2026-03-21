import { runOrgInvoiceMonthly } from "../../../docker-core/server/workers/orgInvoiceMonthly";
import type { OrgInvoiceWorkerResult } from "../../../docker-core/server/workers/orgInvoiceWorker";

describe("orgInvoiceMonthly", () => {
  const baseWorkerResult: OrgInvoiceWorkerResult = {
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    scanned: 2,
    processed: 2,
    issued: 1,
    blocked: 1,
    failed: 0,
    invoices: [
      {
        invoice_id: "inv-1",
        status: "issued",
        total_revenue_cents: 20000,
        integrity_ok: true,
      },
      {
        invoice_id: "inv-2",
        status: "blocked",
        total_revenue_cents: 12000,
        integrity_ok: false,
      },
    ],
    failures: [],
  };

  it("correct previous month selected", async () => {
    const runWorker = jest.fn().mockResolvedValue(baseWorkerResult);

    const result = await runOrgInvoiceMonthly({
      referenceDate: new Date("2026-02-25T10:00:00Z"),
      runWorker,
    });

    expect(runWorker).toHaveBeenCalledWith({
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
    });
    expect(result.blocked).toBe(false);
  });

  it("worker called with correct args", async () => {
    const runWorker = jest.fn().mockResolvedValue(baseWorkerResult);

    await runOrgInvoiceMonthly({
      periodStart: "2026-04-01",
      periodEnd: "2026-04-30",
      referenceDate: new Date("2026-07-15T10:00:00Z"),
      runWorker,
    });

    expect(runWorker).toHaveBeenCalledWith({
      periodStart: "2026-04-01",
      periodEnd: "2026-04-30",
    });
  });

  it("blocks current month", async () => {
    const runWorker = jest.fn().mockResolvedValue(baseWorkerResult);
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {
      return;
    });

    const result = await runOrgInvoiceMonthly({
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
      referenceDate: new Date("2026-02-25T10:00:00Z"),
      runWorker,
    });

    expect(result.blocked).toBe(true);
    expect(runWorker).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("org.invoice.monthly.blocked_current_month"),
    );

    consoleLogSpy.mockRestore();
  });

  it("idempotent safe behavior", async () => {
    const runWorker = jest.fn().mockResolvedValue(baseWorkerResult);

    const run1 = await runOrgInvoiceMonthly({
      referenceDate: new Date("2026-02-25T10:00:00Z"),
      runWorker,
    });
    const run2 = await runOrgInvoiceMonthly({
      referenceDate: new Date("2026-02-25T10:00:00Z"),
      runWorker,
    });

    expect(runWorker).toHaveBeenNthCalledWith(1, {
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
    });
    expect(runWorker).toHaveBeenNthCalledWith(2, {
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
    });
    expect(run1).toEqual(run2);
  });
});
