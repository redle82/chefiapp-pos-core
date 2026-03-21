import {
  getOrgDailyConsolidation,
  normalizeOrgDailyConsolidationPayload,
} from "../../../docker-core/server/finance/getOrgDailyConsolidationRpc";

type RpcPayload = Record<string, unknown>;

function createMockClient(payload: RpcPayload) {
  return {
    rpc: jest.fn().mockResolvedValue({ data: payload, error: null }),
  };
}

describe("getOrgDailyConsolidationRpc", () => {
  it("org missing -> empty payload", async () => {
    const client = createMockClient({
      org: null,
      restaurants: [],
      heatmap: [],
      integrity_ok: null,
      integrity_code: null,
    });

    const result = await getOrgDailyConsolidation(
      "org-missing",
      "2026-04-14",
      client as never,
    );

    expect(result.org).toBeNull();
    expect(result.restaurants).toEqual([]);
    expect(result.heatmap).toEqual([]);
    expect(result.integrity_ok).toBeNull();
    expect(result.integrity_code).toBeNull();
  });

  it("org with 1 restaurant -> matches reconciliation totals", async () => {
    const client = createMockClient({
      org: {
        organization_id: "org-1",
        date: "2026-04-14",
        status: "green",
        total_orders: 20,
        total_receipts: 20,
        total_revenue_cents: 20000,
        total_discrepancy_cents: 0,
      },
      restaurants: [
        {
          restaurant_id: "rest-1",
          restaurant_name: "Sofia",
          status: "green",
          orders_total_cents: 20000,
          receipts_total_cents: 20000,
          z_report_total_cents: 20000,
          discrepancy_amount_cents: 0,
          discrepancy_ratio: 0,
        },
      ],
      heatmap: [],
      integrity_ok: true,
      integrity_code: null,
    });

    const result = await getOrgDailyConsolidation(
      "org-1",
      "2026-04-14",
      client as never,
    );

    expect(result.org?.total_revenue_cents).toBe(20000);
    expect(result.restaurants).toHaveLength(1);
    expect(result.restaurants[0].orders_total_cents).toBe(20000);
    expect(result.restaurants[0].receipts_total_cents).toBe(20000);
    expect(result.integrity_ok).toBe(true);
  });

  it("org with 2 restaurants -> aggregated totals match sum", async () => {
    const client = createMockClient({
      org: {
        organization_id: "org-2",
        date: "2026-04-14",
        status: "yellow",
        total_orders: 30,
        total_receipts: 29,
        total_revenue_cents: 30000,
        total_discrepancy_cents: 100,
      },
      restaurants: [
        {
          restaurant_id: "rest-1",
          restaurant_name: "Alpha",
          status: "green",
          orders_total_cents: 10000,
          receipts_total_cents: 10000,
          z_report_total_cents: 10000,
          discrepancy_amount_cents: 0,
          discrepancy_ratio: 0,
        },
        {
          restaurant_id: "rest-2",
          restaurant_name: "Beta",
          status: "yellow",
          orders_total_cents: 20000,
          receipts_total_cents: 19900,
          z_report_total_cents: 19900,
          discrepancy_amount_cents: 100,
          discrepancy_ratio: 0.005,
        },
      ],
      heatmap: [],
      integrity_ok: false,
      integrity_code: "ORG_RECONCILIATION_REQUIRED",
    });

    const result = await getOrgDailyConsolidation(
      "org-2",
      "2026-04-14",
      client as never,
    );

    const totals = result.restaurants.reduce(
      (acc, row) => ({
        orders: acc.orders + row.orders_total_cents,
        receipts: acc.receipts + row.receipts_total_cents,
        discrepancy: acc.discrepancy + row.discrepancy_amount_cents,
      }),
      { orders: 0, receipts: 0, discrepancy: 0 },
    );

    expect(result.org?.total_revenue_cents).toBe(totals.orders);
    expect(result.org?.total_discrepancy_cents).toBe(totals.discrepancy);
    expect(result.org?.total_orders).toBe(30);
    expect(result.org?.total_receipts).toBe(29);
  });

  it("heatmap 7-day grid builds correctly", async () => {
    const days = [
      { date: "2026-04-08", status: "green", discrepancy_amount_cents: 0 },
      { date: "2026-04-09", status: "green", discrepancy_amount_cents: 0 },
      { date: "2026-04-10", status: "yellow", discrepancy_amount_cents: 40 },
      { date: "2026-04-11", status: "green", discrepancy_amount_cents: 0 },
      { date: "2026-04-12", status: "red", discrepancy_amount_cents: 200 },
      { date: "2026-04-13", status: "green", discrepancy_amount_cents: 0 },
      { date: "2026-04-14", status: "yellow", discrepancy_amount_cents: 60 },
    ];

    const client = createMockClient({
      org: {
        organization_id: "org-3",
        date: "2026-04-14",
        status: "yellow",
        total_orders: 10,
        total_receipts: 10,
        total_revenue_cents: 10000,
        total_discrepancy_cents: 60,
      },
      restaurants: [],
      heatmap: [
        {
          restaurant_id: "rest-1",
          days,
        },
      ],
      integrity_ok: false,
      integrity_code: "ORG_RECONCILIATION_REQUIRED",
    });

    const result = await getOrgDailyConsolidation(
      "org-3",
      "2026-04-14",
      client as never,
    );

    expect(result.heatmap).toHaveLength(1);
    expect(result.heatmap[0].days).toHaveLength(7);
    expect(result.heatmap[0].days[0].date).toBe("2026-04-08");
    expect(result.heatmap[0].days[6].date).toBe("2026-04-14");
  });

  it("integrity_ok false when any day != green", async () => {
    const client = createMockClient({
      org: {
        organization_id: "org-4",
        date: "2026-04-14",
        status: "red",
        total_orders: 10,
        total_receipts: 9,
        total_revenue_cents: 10000,
        total_discrepancy_cents: 500,
      },
      restaurants: [
        {
          restaurant_id: "rest-1",
          restaurant_name: "Gamma",
          status: "red",
          orders_total_cents: 10000,
          receipts_total_cents: 9500,
          z_report_total_cents: 9500,
          discrepancy_amount_cents: 500,
          discrepancy_ratio: 0.05,
        },
      ],
      heatmap: [
        {
          restaurant_id: "rest-1",
          days: [
            {
              date: "2026-04-14",
              status: "red",
              discrepancy_amount_cents: 500,
            },
          ],
        },
      ],
      integrity_ok: false,
      integrity_code: "ORG_RECONCILIATION_REQUIRED",
    });

    const result = await getOrgDailyConsolidation(
      "org-4",
      "2026-04-14",
      client as never,
    );

    expect(result.integrity_ok).toBe(false);
    expect(result.integrity_code).toBe("ORG_RECONCILIATION_REQUIRED");
  });

  it("does not throw for dashboard use with empty or malformed payload", () => {
    expect(() => normalizeOrgDailyConsolidationPayload(null)).not.toThrow();
    expect(() =>
      normalizeOrgDailyConsolidationPayload({
        org: null,
      }),
    ).not.toThrow();

    const result = normalizeOrgDailyConsolidationPayload({
      org: null,
      restaurants: "invalid",
      heatmap: 123,
      integrity_ok: "nope",
      integrity_code: false,
    });

    expect(result.org).toBeNull();
    expect(result.restaurants).toEqual([]);
    expect(result.heatmap).toEqual([]);
    expect(result.integrity_ok).toBeNull();
    expect(result.integrity_code).toBeNull();
  });
});
