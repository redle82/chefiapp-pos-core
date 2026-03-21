import {
  assertOrgFinancialIntegrity,
  generateOrgDailyConsolidation,
} from "../../../docker-core/server/finance/orgConsolidationEngine";

type TableData = Record<string, unknown>[];

function createMockClient(options?: {
  orgRestaurants?: TableData;
  reconciliations?: TableData;
  consolidationRow?: Record<string, unknown>;
  lockRow?: Record<string, unknown> | null;
}) {
  const orgRestaurants =
    options?.orgRestaurants ?? ([{ restaurant_id: "rest-1" }] as TableData);
  const reconciliations =
    options?.reconciliations ??
    ([
      {
        restaurant_id: "rest-1",
        date: "2026-04-13",
        orders_total_cents: 10000,
        receipts_total_cents: 10000,
        discrepancy_amount_cents: 0,
        status: "green",
        details: {
          total_orders: 10,
          total_receipts: 10,
        },
      },
    ] as TableData);

  const consolidationRow =
    options?.consolidationRow ??
    ({
      id: "org-con-1",
      organization_id: "org-1",
      date: "2026-04-13",
      total_orders: 10,
      total_receipts: 10,
      total_revenue_cents: 10000,
      total_discrepancy_cents: 0,
      status: "green",
      created_at: "2026-04-13T00:00:00.000Z",
    } as Record<string, unknown>);

  const lockRow = options?.lockRow;

  const orgRestaurantsEq = jest.fn().mockResolvedValue({
    data: orgRestaurants,
    error: null,
  });

  const reconciliationEq = jest.fn().mockResolvedValue({
    data: reconciliations,
    error: null,
  });

  const reconciliationIn = jest.fn().mockReturnValue({
    eq: reconciliationEq,
  });

  const lockEqDate = jest.fn().mockReturnValue({
    maybeSingle: jest.fn().mockResolvedValue({
      data: lockRow,
      error: null,
    }),
  });

  const lockEqOrg = jest.fn().mockReturnValue({
    eq: lockEqDate,
  });

  const selectAfterUpsert = jest.fn().mockReturnValue({
    single: jest
      .fn()
      .mockResolvedValue({ data: consolidationRow, error: null }),
  });

  const upsert = jest.fn().mockReturnValue({
    select: selectAfterUpsert,
  });

  const from = jest.fn((table: string) => {
    if (table === "gm_organization_restaurants") {
      return {
        select: jest.fn().mockReturnValue({
          eq: orgRestaurantsEq,
        }),
      };
    }

    if (table === "gm_financial_reconciliation") {
      return {
        select: jest.fn().mockReturnValue({
          in: reconciliationIn,
        }),
      };
    }

    if (table === "gm_org_daily_consolidation") {
      if (lockRow !== undefined) {
        return {
          select: jest.fn().mockReturnValue({
            eq: lockEqOrg,
          }),
        };
      }

      return { upsert };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    client: {
      from,
    },
    upsert,
  };
}

describe("orgConsolidationEngine", () => {
  it("handles single restaurant organization", async () => {
    const { client } = createMockClient();

    const result = await generateOrgDailyConsolidation(
      "org-1",
      "2026-04-13",
      client as never,
    );

    expect(result.organization_id).toBe("org-1");
    expect(result.total_orders).toBe(10);
    expect(result.total_receipts).toBe(10);
    expect(result.total_revenue_cents).toBe(10000);
    expect(result.total_discrepancy_cents).toBe(0);
    expect(result.status).toBe("green");
  });

  it("aggregates multiple restaurants", async () => {
    const { client } = createMockClient({
      orgRestaurants: [
        { restaurant_id: "rest-1" },
        { restaurant_id: "rest-2" },
      ],
      reconciliations: [
        {
          restaurant_id: "rest-1",
          date: "2026-04-13",
          orders_total_cents: 10000,
          receipts_total_cents: 9900,
          discrepancy_amount_cents: 100,
          status: "yellow",
          details: {
            total_orders: 10,
            total_receipts: 10,
          },
        },
        {
          restaurant_id: "rest-2",
          date: "2026-04-13",
          orders_total_cents: 20000,
          receipts_total_cents: 20000,
          discrepancy_amount_cents: 0,
          status: "green",
          details: {
            total_orders: 20,
            total_receipts: 20,
          },
        },
      ],
      consolidationRow: {
        id: "org-con-2",
        organization_id: "org-1",
        date: "2026-04-13",
        total_orders: 30,
        total_receipts: 30,
        total_revenue_cents: 30000,
        total_discrepancy_cents: 100,
        status: "yellow",
        created_at: "2026-04-13T00:00:00.000Z",
      },
    });

    const result = await generateOrgDailyConsolidation(
      "org-1",
      "2026-04-13",
      client as never,
    );

    expect(result.total_orders).toBe(30);
    expect(result.total_receipts).toBe(30);
    expect(result.total_revenue_cents).toBe(30000);
    expect(result.total_discrepancy_cents).toBe(100);
    expect(result.status).toBe("yellow");
  });

  it("classifies mixed green and yellow as yellow", async () => {
    const { client } = createMockClient({
      orgRestaurants: [
        { restaurant_id: "rest-1" },
        { restaurant_id: "rest-2" },
      ],
      reconciliations: [
        {
          restaurant_id: "rest-1",
          orders_total_cents: 5000,
          receipts_total_cents: 5000,
          discrepancy_amount_cents: 0,
          status: "green",
          details: {
            total_orders: 5,
            total_receipts: 5,
          },
        },
        {
          restaurant_id: "rest-2",
          orders_total_cents: 5000,
          receipts_total_cents: 4950,
          discrepancy_amount_cents: 50,
          status: "yellow",
          details: {
            total_orders: 5,
            total_receipts: 5,
          },
        },
      ],
      consolidationRow: {
        id: "org-con-3",
        organization_id: "org-1",
        date: "2026-04-13",
        total_orders: 10,
        total_receipts: 10,
        total_revenue_cents: 10000,
        total_discrepancy_cents: 50,
        status: "yellow",
        created_at: "2026-04-13T00:00:00.000Z",
      },
    });

    const result = await generateOrgDailyConsolidation(
      "org-1",
      "2026-04-13",
      client as never,
    );

    expect(result.status).toBe("yellow");
  });

  it("propagates red when any restaurant is red", async () => {
    const { client } = createMockClient({
      orgRestaurants: [
        { restaurant_id: "rest-1" },
        { restaurant_id: "rest-2" },
      ],
      reconciliations: [
        {
          restaurant_id: "rest-1",
          orders_total_cents: 5000,
          receipts_total_cents: 5000,
          discrepancy_amount_cents: 0,
          status: "green",
          details: {
            total_orders: 5,
            total_receipts: 5,
          },
        },
        {
          restaurant_id: "rest-2",
          orders_total_cents: 5000,
          receipts_total_cents: 4500,
          discrepancy_amount_cents: 500,
          status: "red",
          details: {
            total_orders: 5,
            total_receipts: 5,
          },
        },
      ],
      consolidationRow: {
        id: "org-con-4",
        organization_id: "org-1",
        date: "2026-04-13",
        total_orders: 10,
        total_receipts: 10,
        total_revenue_cents: 10000,
        total_discrepancy_cents: 500,
        status: "red",
        created_at: "2026-04-13T00:00:00.000Z",
      },
    });

    const result = await generateOrgDailyConsolidation(
      "org-1",
      "2026-04-13",
      client as never,
    );

    expect(result.status).toBe("red");
  });

  it("is idempotent with upsert on (organization_id,date)", async () => {
    const { client, upsert } = createMockClient();

    await generateOrgDailyConsolidation("org-1", "2026-04-13", client as never);
    await generateOrgDailyConsolidation("org-1", "2026-04-13", client as never);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        date: "2026-04-13",
      }),
      { onConflict: "organization_id,date" },
    );
  });

  it("enforces enterprise lock behavior", async () => {
    const passing = createMockClient({ lockRow: { status: "green" } });
    await expect(
      assertOrgFinancialIntegrity(
        "org-1",
        "2026-04-13",
        passing.client as never,
      ),
    ).resolves.toBeUndefined();

    const yellow = createMockClient({ lockRow: { status: "yellow" } });
    await expect(
      assertOrgFinancialIntegrity(
        "org-1",
        "2026-04-13",
        yellow.client as never,
      ),
    ).rejects.toMatchObject({ code: "ORG_RECONCILIATION_REQUIRED" });

    const missing = createMockClient({ lockRow: null });
    await expect(
      assertOrgFinancialIntegrity(
        "org-1",
        "2026-04-13",
        missing.client as never,
      ),
    ).rejects.toMatchObject({ code: "ORG_RECONCILIATION_REQUIRED" });
  });
});
