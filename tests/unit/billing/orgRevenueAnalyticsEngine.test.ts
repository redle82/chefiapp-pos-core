import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateARR,
  calculateChurnRate,
  calculateEnterpriseRevenueBreakdown,
  calculateMRR,
} from "../../../docker-core/server/billing/orgRevenueAnalyticsEngine";

type EnterpriseStatus = "active" | "grace" | "suspended";

type OrgRecord = {
  id: string;
  country: string | null;
  enterprise_status: EnterpriseStatus;
  metadata?: Record<string, unknown>;
};

type InvoiceRecord = {
  organization_id: string;
  total_revenue_cents: number;
  payment_status: "pending" | "paid" | "failed";
  created_at: string;
};

function createMockClient(options: {
  organizations: OrgRecord[];
  invoices: InvoiceRecord[];
}) {
  const organizations = options.organizations;
  const invoices = options.invoices;

  const orgEq = jest
    .fn()
    .mockImplementation((column: string, value: unknown) => {
      if (column === "enterprise_status") {
        const filtered = organizations.filter(
          (org) => org.enterprise_status === value,
        );
        return Promise.resolve({ data: filtered, error: null });
      }

      return Promise.resolve({ data: organizations, error: null });
    });
  const orgSelect = jest.fn().mockReturnValue({
    eq: orgEq,
  });

  const invoiceLimit = jest.fn().mockImplementation((limitValue: number) => {
    if (limitValue === 1) {
      return Promise.resolve({
        data: invoices,
        error: null,
      });
    }

    return Promise.resolve({ data: invoices, error: null });
  });

  const invoiceOrder = jest.fn().mockReturnValue({
    limit: invoiceLimit,
  });

  const invoiceLte = jest.fn().mockReturnValue({
    order: invoiceOrder,
  });

  const invoiceGte = jest.fn().mockReturnValue({
    lte: invoiceLte,
    order: invoiceOrder,
  });

  const invoiceEq = jest.fn().mockReturnValue({
    gte: invoiceGte,
    lte: invoiceLte,
    order: invoiceOrder,
  });

  const invoiceSelect = jest.fn().mockReturnValue({
    eq: invoiceEq,
    gte: invoiceGte,
    lte: invoiceLte,
    order: invoiceOrder,
  });

  const from = jest.fn((table: string) => {
    if (table === "gm_organizations") {
      return { select: orgSelect };
    }

    if (table === "gm_org_invoices") {
      return { select: invoiceSelect };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { from } as unknown as SupabaseClient;
}

describe("orgRevenueAnalyticsEngine", () => {
  it("monthly plan", async () => {
    const client = createMockClient({
      organizations: [
        {
          id: "org-1",
          country: "PT",
          enterprise_status: "active",
          metadata: { billing_cycle: "monthly" },
        },
      ],
      invoices: [
        {
          organization_id: "org-1",
          total_revenue_cents: 12000,
          payment_status: "paid",
          created_at: "2026-02-10T00:00:00.000Z",
        },
      ],
    });

    const mrr = await calculateMRR(
      new Date("2026-02-25T00:00:00.000Z"),
      client,
    );

    expect(mrr).toBe(12000);
  });

  it("annual plan conversion", async () => {
    const client = createMockClient({
      organizations: [
        {
          id: "org-annual",
          country: "ES",
          enterprise_status: "active",
          metadata: { billing_cycle: "annual" },
        },
      ],
      invoices: [
        {
          organization_id: "org-annual",
          total_revenue_cents: 120000,
          payment_status: "paid",
          created_at: "2026-02-01T00:00:00.000Z",
        },
      ],
    });

    const mrr = await calculateMRR(
      new Date("2026-02-25T00:00:00.000Z"),
      client,
    );

    expect(mrr).toBe(10000);
  });

  it("suspended excluded", async () => {
    const client = createMockClient({
      organizations: [
        {
          id: "org-suspended",
          country: "PT",
          enterprise_status: "suspended",
          metadata: { billing_cycle: "monthly" },
        },
      ],
      invoices: [
        {
          organization_id: "org-suspended",
          total_revenue_cents: 33000,
          payment_status: "failed",
          created_at: "2026-02-10T00:00:00.000Z",
        },
      ],
    });

    const mrr = await calculateMRR(
      new Date("2026-02-25T00:00:00.000Z"),
      client,
    );

    expect(mrr).toBe(0);
  });

  it("grace included", async () => {
    const client = createMockClient({
      organizations: [
        {
          id: "org-grace",
          country: "PT",
          enterprise_status: "grace",
          metadata: { billing_cycle: "monthly" },
        },
      ],
      invoices: [
        {
          organization_id: "org-grace",
          total_revenue_cents: 21000,
          payment_status: "pending",
          created_at: "2026-02-20T00:00:00.000Z",
        },
      ],
    });

    const mrr = await calculateMRR(
      new Date("2026-02-25T00:00:00.000Z"),
      client,
    );

    expect(mrr).toBe(21000);
  });

  it("ARR calculation", async () => {
    const client = createMockClient({
      organizations: [
        {
          id: "org-1",
          country: "PT",
          enterprise_status: "active",
          metadata: { billing_cycle: "monthly" },
        },
      ],
      invoices: [
        {
          organization_id: "org-1",
          total_revenue_cents: 5000,
          payment_status: "paid",
          created_at: "2026-02-10T00:00:00.000Z",
        },
      ],
    });

    const arr = await calculateARR(
      new Date("2026-02-25T00:00:00.000Z"),
      client,
    );

    expect(arr).toBe(60000);
  });

  it("churn calculation", async () => {
    const client = createMockClient({
      organizations: [
        {
          id: "org-a",
          country: "PT",
          enterprise_status: "active",
          metadata: { billing_cycle: "monthly" },
        },
        {
          id: "org-b",
          country: "ES",
          enterprise_status: "active",
          metadata: { billing_cycle: "monthly" },
        },
      ],
      invoices: [
        {
          organization_id: "org-a",
          total_revenue_cents: 9000,
          payment_status: "paid",
          created_at: "2026-01-10T00:00:00.000Z",
        },
        {
          organization_id: "org-b",
          total_revenue_cents: 9000,
          payment_status: "paid",
          created_at: "2026-01-11T00:00:00.000Z",
        },
        {
          organization_id: "org-a",
          total_revenue_cents: 9000,
          payment_status: "failed",
          created_at: "2026-02-10T00:00:00.000Z",
        },
        {
          organization_id: "org-b",
          total_revenue_cents: 9000,
          payment_status: "paid",
          created_at: "2026-02-11T00:00:00.000Z",
        },
      ],
    });

    const churn = await calculateChurnRate("2026-02", client);

    expect(churn).toBe(50);
  });

  it("breakdown shape", async () => {
    const client = createMockClient({
      organizations: [
        {
          id: "org-1",
          country: "PT",
          enterprise_status: "active",
          metadata: { billing_cycle: "monthly" },
        },
        {
          id: "org-2",
          country: "ES",
          enterprise_status: "grace",
          metadata: { billing_cycle: "annual" },
        },
        {
          id: "org-3",
          country: "PT",
          enterprise_status: "suspended",
          metadata: { billing_cycle: "monthly" },
        },
      ],
      invoices: [
        {
          organization_id: "org-1",
          total_revenue_cents: 10000,
          payment_status: "paid",
          created_at: "2026-02-10T00:00:00.000Z",
        },
        {
          organization_id: "org-2",
          total_revenue_cents: 120000,
          payment_status: "pending",
          created_at: "2026-02-10T00:00:00.000Z",
        },
        {
          organization_id: "org-3",
          total_revenue_cents: 45000,
          payment_status: "failed",
          created_at: "2026-02-10T00:00:00.000Z",
        },
      ],
    });

    const result = await calculateEnterpriseRevenueBreakdown(
      new Date("2026-02-25T00:00:00.000Z"),
      client,
    );

    expect(result).toEqual({
      totalMRR: 20000,
      totalARR: 240000,
      activeOrgs: 1,
      graceOrgs: 1,
      suspendedOrgs: 1,
      revenueByCountry: [
        { country: "ES", mrr: 10000 },
        { country: "PT", mrr: 10000 },
      ],
    });
  });
});
