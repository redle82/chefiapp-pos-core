import { generateOrgInvoice } from "../../../docker-core/server/billing/orgInvoiceEngine";

type TableData = Record<string, unknown>[];

function createMockClient(options?: {
  statusByDate?: Record<string, string | null>;
  periodRows?: TableData;
  invoiceRow?: Record<string, unknown>;
}) {
  const statusByDate = options?.statusByDate ?? { "2026-04-15": "green" };
  const periodRows =
    options?.periodRows ??
    ([
      {
        date: "2026-04-14",
        total_revenue_cents: 10000,
        total_discrepancy_cents: 0,
        status: "green",
      },
      {
        date: "2026-04-15",
        total_revenue_cents: 20000,
        total_discrepancy_cents: 100,
        status: "green",
      },
    ] as TableData);

  const invoiceRow =
    options?.invoiceRow ??
    ({
      id: "inv-1",
      organization_id: "org-1",
      period_start: "2026-04-14",
      period_end: "2026-04-15",
      total_revenue_cents: 30000,
      discrepancy_cents: 100,
      status: "issued",
      integrity_snapshot: {
        integrity_ok: true,
      },
      created_at: "2026-04-15T00:00:00.000Z",
    } as Record<string, unknown>);

  const maybeSingle = jest
    .fn()
    .mockImplementation((query: { date?: string }) => {
      const date = query?.date;
      const status = date ? statusByDate[date] : null;
      return Promise.resolve({
        data: status ? { status } : null,
        error: null,
      });
    });

  const eqDate = jest.fn().mockImplementation((date: string) => ({
    maybeSingle: () => maybeSingle({ date }),
  }));

  const eqOrgForAssert = jest.fn().mockReturnValue({
    eq: eqDate,
  });

  const lte = jest.fn().mockResolvedValue({
    data: periodRows,
    error: null,
  });

  const gte = jest.fn().mockReturnValue({
    lte,
  });

  const eqOrgForPeriod = jest.fn().mockReturnValue({
    gte,
  });

  const selectForInvoicesAfterUpsert = jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({ data: invoiceRow, error: null }),
  });

  const upsert = jest.fn().mockReturnValue({
    select: selectForInvoicesAfterUpsert,
  });

  const from = jest.fn((table: string) => {
    if (table === "gm_org_daily_consolidation") {
      return {
        select: jest.fn().mockImplementation((columns: string) => {
          if (columns === "status") {
            return {
              eq: eqOrgForAssert,
            };
          }
          return {
            eq: eqOrgForPeriod,
          };
        }),
      };
    }

    if (table === "gm_org_invoices") {
      return {
        upsert,
      };
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

describe("orgInvoiceEngine", () => {
  it("green org -> issued", async () => {
    const { client } = createMockClient({
      statusByDate: { "2026-04-15": "green" },
      invoiceRow: {
        id: "inv-green",
        organization_id: "org-1",
        period_start: "2026-04-14",
        period_end: "2026-04-15",
        total_revenue_cents: 30000,
        discrepancy_cents: 100,
        status: "issued",
        integrity_snapshot: { integrity_ok: true },
        created_at: "2026-04-15T00:00:00.000Z",
      },
    });

    const result = await generateOrgInvoice(
      "org-1",
      "2026-04-14",
      "2026-04-15",
      client as never,
    );

    expect(result.status).toBe("issued");
    expect(result.total_revenue_cents).toBe(30000);
  });

  it("yellow/red org -> blocked", async () => {
    const { client } = createMockClient({
      statusByDate: { "2026-04-15": "yellow" },
      periodRows: [
        {
          date: "2026-04-14",
          total_revenue_cents: 12000,
          total_discrepancy_cents: 0,
          status: "green",
        },
        {
          date: "2026-04-15",
          total_revenue_cents: 13000,
          total_discrepancy_cents: 500,
          status: "yellow",
        },
      ],
      invoiceRow: {
        id: "inv-blocked",
        organization_id: "org-1",
        period_start: "2026-04-14",
        period_end: "2026-04-15",
        total_revenue_cents: 25000,
        discrepancy_cents: 500,
        status: "blocked",
        integrity_snapshot: {
          integrity_ok: false,
          integrity_code: "ORG_RECONCILIATION_REQUIRED",
        },
        created_at: "2026-04-15T00:00:00.000Z",
      },
    });

    const result = await generateOrgInvoice(
      "org-1",
      "2026-04-14",
      "2026-04-15",
      client as never,
    );

    expect(result.status).toBe("blocked");
  });

  it("idempotency", async () => {
    const { client, upsert } = createMockClient();

    await generateOrgInvoice(
      "org-1",
      "2026-04-14",
      "2026-04-15",
      client as never,
    );
    await generateOrgInvoice(
      "org-1",
      "2026-04-14",
      "2026-04-15",
      client as never,
    );

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        period_start: "2026-04-14",
        period_end: "2026-04-15",
      }),
      { onConflict: "organization_id,period_start,period_end" },
    );
  });

  it("integrity_snapshot stored", async () => {
    const { client, upsert } = createMockClient({
      statusByDate: { "2026-04-15": "red" },
      invoiceRow: {
        id: "inv-snapshot",
        organization_id: "org-1",
        period_start: "2026-04-14",
        period_end: "2026-04-15",
        total_revenue_cents: 22000,
        discrepancy_cents: 900,
        status: "blocked",
        integrity_snapshot: {
          integrity_ok: false,
          integrity_code: "ORG_RECONCILIATION_REQUIRED",
        },
        created_at: "2026-04-15T00:00:00.000Z",
      },
    });

    await generateOrgInvoice(
      "org-1",
      "2026-04-14",
      "2026-04-15",
      client as never,
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        integrity_snapshot: expect.objectContaining({
          integrity_ok: false,
          integrity_code: "ORG_RECONCILIATION_REQUIRED",
          statuses: expect.any(Array),
        }),
      }),
      { onConflict: "organization_id,period_start,period_end" },
    );
  });

  it("revenue aggregation correct", async () => {
    const { client } = createMockClient({
      periodRows: [
        {
          date: "2026-04-10",
          total_revenue_cents: 5000,
          total_discrepancy_cents: 10,
          status: "green",
        },
        {
          date: "2026-04-11",
          total_revenue_cents: 7000,
          total_discrepancy_cents: 20,
          status: "green",
        },
        {
          date: "2026-04-12",
          total_revenue_cents: 8000,
          total_discrepancy_cents: 30,
          status: "green",
        },
      ],
      invoiceRow: {
        id: "inv-agg",
        organization_id: "org-1",
        period_start: "2026-04-10",
        period_end: "2026-04-12",
        total_revenue_cents: 20000,
        discrepancy_cents: 60,
        status: "issued",
        integrity_snapshot: { integrity_ok: true },
        created_at: "2026-04-12T00:00:00.000Z",
      },
    });

    const result = await generateOrgInvoice(
      "org-1",
      "2026-04-10",
      "2026-04-12",
      client as never,
    );

    expect(result.total_revenue_cents).toBe(20000);
    expect(result.discrepancy_cents).toBe(60);
  });
});
