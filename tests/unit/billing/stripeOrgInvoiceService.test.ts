import type { SupabaseClient } from "@supabase/supabase-js";
import { createStripeInvoiceForOrgInvoice } from "../../../docker-core/server/billing/stripeOrgInvoiceService";

describe("stripeOrgInvoiceService", () => {
  function createClient(options?: { existingStripeInvoiceId?: string | null }) {
    const existingStripeInvoiceId = options?.existingStripeInvoiceId ?? null;

    const invoiceRow = {
      id: "inv-db-1",
      organization_id: "org-1",
      total_revenue_cents: 45000,
      period_start: "2026-04-01",
      period_end: "2026-04-30",
      stripe_invoice_id: existingStripeInvoiceId,
      payment_status: null,
    };

    const orgRow = {
      id: "org-1",
      name: "Org One",
      billing_email: "billing@org.one",
      metadata: {},
    };

    const updateInvoiceEq = jest.fn().mockResolvedValue({ error: null });
    const updateInvoice = jest.fn().mockReturnValue({
      eq: updateInvoiceEq,
    });

    const updateOrgEq = jest.fn().mockResolvedValue({ error: null });
    const updateOrg = jest.fn().mockReturnValue({
      eq: updateOrgEq,
    });

    const from = jest.fn((table: string) => {
      if (table === "gm_org_invoices") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: invoiceRow, error: null }),
            }),
          }),
          update: updateInvoice,
        };
      }

      if (table === "gm_organizations") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: orgRow, error: null }),
            }),
          }),
          update: updateOrg,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    return {
      client: { from } as unknown as SupabaseClient,
      updateInvoice,
      updateOrg,
    };
  }

  function createStripeMock() {
    const customersList = jest.fn().mockResolvedValue({ data: [] });
    const customersCreate = jest.fn().mockResolvedValue({ id: "cus_123" });
    const invoiceItemsCreate = jest.fn().mockResolvedValue({ id: "ii_123" });
    const invoicesCreate = jest.fn().mockResolvedValue({
      id: "in_123",
      payment_intent: "pi_123",
    });

    return {
      customers: {
        list: customersList,
        create: customersCreate,
      },
      invoiceItems: {
        create: invoiceItemsCreate,
      },
      invoices: {
        create: invoicesCreate,
      },
    };
  }

  it("create invoice", async () => {
    const { client, updateInvoice } = createClient();
    const stripeMock = createStripeMock();

    const result = await createStripeInvoiceForOrgInvoice("inv-db-1", {
      client,
      stripeClient: stripeMock,
    });

    expect(result.stripe_invoice_id).toBe("in_123");
    expect(result.payment_status).toBe("pending");
    expect(updateInvoice).toHaveBeenCalled();
    expect(stripeMock.invoices.create).toHaveBeenCalled();
  });

  it("idempotent behavior", async () => {
    const { client } = createClient({ existingStripeInvoiceId: "in_existing" });
    const stripeMock = createStripeMock();

    const result = await createStripeInvoiceForOrgInvoice("inv-db-1", {
      client,
      stripeClient: stripeMock,
    });

    expect(result.stripe_invoice_id).toBe("in_existing");
    expect(result.idempotent).toBe(true);
    expect(stripeMock.invoices.create).not.toHaveBeenCalled();
  });
});
