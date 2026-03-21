import {
  assertGreenReconciliationOrThrow,
  calculateDiscrepancies,
  classifyStatus,
  generateDailyReconciliation,
} from "../../../docker-core/server/finance/reconciliationEngine";

type TableData = Record<string, unknown>[];

function createMockClient(options?: {
  report?: Record<string, unknown>;
  zReports?: TableData;
  upsertResult?: Record<string, unknown>;
}) {
  const report =
    options?.report ??
    ({
      total_orders: 4,
      total_order_amount: 10000,
      total_receipts: 4,
      total_receipt_amount: 10000,
      missing_receipts: 0,
      orphan_receipts: 0,
      mismatched_orders: 0,
      discrepancies: [],
    } as Record<string, unknown>);

  const zReports =
    options?.zReports ??
    ([{ z_report: { total_gross_cents: 10000 } }] as TableData);

  const upsertResult =
    options?.upsertResult ??
    ({
      id: "recon-1",
      restaurant_id: "rest-1",
      date: "2026-04-12",
      orders_total_cents: 10000,
      receipts_total_cents: 10000,
      z_report_total_cents: 10000,
      discrepancy_amount_cents: 0,
      discrepancy_ratio: 0,
      status: "green",
      details: {},
      generated_at: "2026-04-12T00:00:00.000Z",
    } as Record<string, unknown>);

  const queryResult = {
    data: zReports,
    error: null,
  };

  const selectForRead = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(queryResult),
    }),
  });

  const selectAfterUpsert = jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({ data: upsertResult, error: null }),
  });

  const upsert = jest.fn().mockReturnValue({
    select: selectAfterUpsert,
  });

  const from = jest.fn((table: string) => {
    if (table === "gm_z_reports") {
      return { select: selectForRead };
    }

    if (table === "gm_financial_reconciliation") {
      return { upsert };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  const rpc = jest.fn().mockResolvedValue({ data: report, error: null });

  return {
    client: {
      from,
      rpc,
    },
    rpc,
    upsert,
  };
}

describe("reconciliationEngine", () => {
  it("returns green for perfect match", async () => {
    const { client } = createMockClient();

    const result = await calculateDiscrepancies(
      "rest-1",
      "2026-04-12",
      client as never,
    );

    expect(result.status).toBe("green");
    expect(result.discrepancyAmountCents).toBe(0);
    expect(result.ordersTotalCents).toBe(10000);
    expect(result.receiptsTotalCents).toBe(10000);
    expect(result.zReportTotalCents).toBe(10000);
  });

  it("returns yellow for discrepancy below 1% of revenue", async () => {
    const { client } = createMockClient({
      report: {
        total_orders: 4,
        total_order_amount: 10000,
        total_receipts: 4,
        total_receipt_amount: 9950,
      },
      zReports: [{ z_report: { total_gross_cents: 9950 } }],
    });

    const result = await calculateDiscrepancies(
      "rest-1",
      "2026-04-12",
      client as never,
    );

    expect(result.status).toBe("yellow");
    expect(result.discrepancyAmountCents).toBe(50);
    expect(result.discrepancyRatio).toBe(0.005);
  });

  it("returns red for discrepancy above threshold", async () => {
    const { client } = createMockClient({
      report: {
        total_orders: 3,
        total_order_amount: 10000,
        total_receipts: 3,
        total_receipt_amount: 9600,
      },
      zReports: [{ z_report: { total_gross_cents: 9600 } }],
    });

    const result = await calculateDiscrepancies(
      "rest-1",
      "2026-04-12",
      client as never,
    );

    expect(result.status).toBe("red");
    expect(result.discrepancyAmountCents).toBe(400);
    expect(result.discrepancyRatio).toBe(0.04);
  });

  it("is idempotent by upserting using (restaurant_id,date)", async () => {
    const { client, upsert } = createMockClient();

    await generateDailyReconciliation("rest-1", "2026-04-12", client as never);
    await generateDailyReconciliation("rest-1", "2026-04-12", client as never);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurant_id: "rest-1",
        date: "2026-04-12",
      }),
      { onConflict: "restaurant_id,date" },
    );
  });

  it("enforces lock behavior with RECONCILIATION_REQUIRED", () => {
    expect(() => assertGreenReconciliationOrThrow("green")).not.toThrow();

    expect(() => assertGreenReconciliationOrThrow("yellow")).toThrow(
      "Daily reconciliation must be green before close_cash_register_atomic",
    );

    try {
      assertGreenReconciliationOrThrow("red");
      throw new Error("Expected lock to throw");
    } catch (error) {
      expect((error as Error & { code?: string }).code).toBe(
        "RECONCILIATION_REQUIRED",
      );
    }
  });

  it("classifyStatus applies threshold rules", () => {
    expect(classifyStatus(0, 10000)).toBe("green");
    expect(classifyStatus(99, 10000)).toBe("yellow");
    expect(classifyStatus(100, 10000)).toBe("red");
  });
});
