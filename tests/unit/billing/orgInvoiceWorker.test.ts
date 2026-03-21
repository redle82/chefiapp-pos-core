import type { SupabaseClient } from "@supabase/supabase-js";
import {
  runOrgInvoiceWorker,
  scanOrgsAndGenerateInvoices,
} from "../../../docker-core/server/workers/orgInvoiceWorker";

describe("orgInvoiceWorker", () => {
  function createClientWithInvoices() {
    const invoiceByOrg = new Map<string, string>([
      ["org-1", "inv-org-1"],
      ["org-2", "inv-org-2"],
      ["org-3", "inv-org-3"],
    ]);

    const rpc = jest
      .fn()
      .mockImplementation((fn: string, params?: Record<string, unknown>) => {
        if (fn === "generate_org_invoice") {
          const orgId = String(params?.p_org_id ?? "");
          const invoiceId = invoiceByOrg.get(orgId) ?? `inv-${orgId}`;
          return Promise.resolve({
            data: {
              invoice_id: invoiceId,
              status: orgId === "org-2" ? "blocked" : "issued",
              total_revenue_cents: 10000,
              integrity_ok: orgId !== "org-2",
            },
            error: null,
          });
        }

        return Promise.resolve({ data: null, error: null });
      });

    const from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: "org-1" }, { id: "org-2" }, { id: "org-3" }],
        error: null,
      }),
    });

    return {
      client: { from, rpc } as unknown as SupabaseClient,
      rpc,
    };
  }

  it("worker processes multiple orgs", async () => {
    const { client } = createClientWithInvoices();
    const createStripeInvoice = jest
      .fn()
      .mockResolvedValue({ stripe_invoice_id: "in_1" });
    const evaluateOrgPaymentStatus = jest
      .fn()
      .mockResolvedValue({ newStatus: "active" });

    const result = await scanOrgsAndGenerateInvoices(
      "2026-04-01",
      "2026-04-30",
      client,
      {
        createStripeInvoiceForOrgInvoice: createStripeInvoice as never,
        evaluateOrgPaymentStatus: evaluateOrgPaymentStatus as never,
      },
    );

    expect(result.scanned).toBe(3);
    expect(result.processed).toBe(3);
    expect(result.issued).toBe(2);
    expect(result.blocked).toBe(1);
    expect(result.failed).toBe(0);
    expect(createStripeInvoice).toHaveBeenCalledTimes(2);
    expect(evaluateOrgPaymentStatus).toHaveBeenCalledTimes(3);
  });

  it("worker is idempotent (2 runs => same invoices, no duplicates)", async () => {
    const { client } = createClientWithInvoices();
    const createStripeInvoice = jest
      .fn()
      .mockResolvedValue({ stripe_invoice_id: "in_1" });
    const evaluateOrgPaymentStatus = jest
      .fn()
      .mockResolvedValue({ newStatus: "active" });

    const run1 = await runOrgInvoiceWorker(
      { periodStart: "2026-04-01", periodEnd: "2026-04-30" },
      client,
      {
        createStripeInvoiceForOrgInvoice: createStripeInvoice as never,
        evaluateOrgPaymentStatus: evaluateOrgPaymentStatus as never,
      },
    );

    const run2 = await runOrgInvoiceWorker(
      { periodStart: "2026-04-01", periodEnd: "2026-04-30" },
      client,
      {
        createStripeInvoiceForOrgInvoice: createStripeInvoice as never,
        evaluateOrgPaymentStatus: evaluateOrgPaymentStatus as never,
      },
    );

    const run1Ids = run1.invoices.map((item) => item.invoice_id).sort();
    const run2Ids = run2.invoices.map((item) => item.invoice_id).sort();

    expect(run1Ids).toEqual(run2Ids);
    expect(new Set(run1Ids).size).toBe(run1Ids.length);
  });

  it("worker continues if one org fails unexpectedly", async () => {
    const rpc = jest
      .fn()
      .mockImplementation((fn: string, params?: Record<string, unknown>) => {
        if (fn === "generate_org_invoice") {
          if (params?.p_org_id === "org-2") {
            return Promise.reject(new Error("db timeout"));
          }

          return Promise.resolve({
            data: {
              invoice_id: `inv-${params?.p_org_id}`,
              status: "issued",
              total_revenue_cents: 12000,
              integrity_ok: true,
            },
            error: null,
          });
        }

        return Promise.resolve({ data: null, error: null });
      });

    const client = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: "org-1" }, { id: "org-2" }, { id: "org-3" }],
          error: null,
        }),
      }),
      rpc,
    } as unknown as SupabaseClient;

    const result = await runOrgInvoiceWorker(
      { periodStart: "2026-04-01", periodEnd: "2026-04-30" },
      client,
      {
        createStripeInvoiceForOrgInvoice: jest
          .fn()
          .mockResolvedValue({ stripe_invoice_id: "in_1" }) as never,
        evaluateOrgPaymentStatus: jest
          .fn()
          .mockResolvedValue({ newStatus: "active" }) as never,
      },
    );

    expect(result.scanned).toBe(3);
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.failures[0].organizationId).toBe("org-2");
  });
});
