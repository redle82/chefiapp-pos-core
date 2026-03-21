import type { SupabaseClient } from "@supabase/supabase-js";
import { generateOrgInvoiceRpc } from "../../../docker-core/server/billing/generateOrgInvoiceRpc";

describe("generateOrgInvoiceRpc", () => {
  it("wrapper returns issued invoice payload", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          invoice_id: "inv-100",
          status: "issued",
          total_revenue_cents: 45000,
          integrity_ok: true,
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await generateOrgInvoiceRpc(
      "org-1",
      "2026-04-01",
      "2026-04-30",
      client,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        invoice_id: "inv-100",
        status: "issued",
        total_revenue_cents: 45000,
        integrity_ok: true,
      });
    }
  });

  it("wrapper returns blocked invoice payload", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          invoice_id: "inv-101",
          status: "blocked",
          total_revenue_cents: 45000,
          integrity_ok: false,
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await generateOrgInvoiceRpc(
      "org-1",
      "2026-04-01",
      "2026-04-30",
      client,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("blocked");
      expect(result.data.integrity_ok).toBe(false);
    }
  });

  it("wrapper normalizes thrown errors", async () => {
    const client = {
      rpc: jest.fn().mockRejectedValue(new Error("boom")),
    } as unknown as SupabaseClient;

    const result = await generateOrgInvoiceRpc(
      "org-1",
      "2026-04-01",
      "2026-04-30",
      client,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual(
        expect.objectContaining({
          code: "UNEXPECTED_ERROR",
          message: expect.stringContaining("boom"),
        }),
      );
    }
  });
});
