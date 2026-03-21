import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateOrgPaymentStatus } from "../../../docker-core/server/billing/orgEnforcementEngine";

type EnterpriseStatus = "active" | "suspended" | "grace";
type PaymentStatus = "pending" | "paid" | "failed" | null;

function createClient(options: {
  previousStatus?: EnterpriseStatus;
  latestInvoice?: {
    payment_status: PaymentStatus;
    created_at: string;
  } | null;
}) {
  const previousStatus = options.previousStatus ?? "active";
  const latestInvoice = options.latestInvoice ?? null;

  const updateOrgEq = jest.fn().mockResolvedValue({ error: null });
  const updateOrg = jest.fn().mockReturnValue({
    eq: updateOrgEq,
  });

  const from = jest.fn((table: string) => {
    if (table === "gm_organizations") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: "org-1",
                enterprise_status: previousStatus,
                suspended_at: null,
                grace_until: null,
              },
              error: null,
            }),
          }),
        }),
        update: updateOrg,
      };
    }

    if (table === "gm_org_invoices") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: latestInvoice ? [latestInvoice] : [],
                error: null,
              }),
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    client: { from } as unknown as SupabaseClient,
    updateOrg,
  };
}

describe("orgEnforcementEngine", () => {
  it("paid → active", async () => {
    const { client, updateOrg } = createClient({
      previousStatus: "suspended",
      latestInvoice: {
        payment_status: "paid",
        created_at: "2026-04-10T10:00:00.000Z",
      },
    });

    const result = await evaluateOrgPaymentStatus("org-1", {
      client,
      now: new Date("2026-04-12T10:00:00.000Z"),
    });

    expect(result.previousStatus).toBe("suspended");
    expect(result.newStatus).toBe("active");
    expect(updateOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        enterprise_status: "active",
        suspended_at: null,
        grace_until: null,
      }),
    );
  });

  it("failed → suspended", async () => {
    const { client, updateOrg } = createClient({
      previousStatus: "active",
      latestInvoice: {
        payment_status: "failed",
        created_at: "2026-04-10T10:00:00.000Z",
      },
    });

    const result = await evaluateOrgPaymentStatus("org-1", {
      client,
      now: new Date("2026-04-12T10:00:00.000Z"),
    });

    expect(result.newStatus).toBe("suspended");
    expect(updateOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        enterprise_status: "suspended",
      }),
    );
  });

  it("pending <7 days → grace", async () => {
    const { client, updateOrg } = createClient({
      previousStatus: "active",
      latestInvoice: {
        payment_status: "pending",
        created_at: "2026-04-10T10:00:00.000Z",
      },
    });

    const result = await evaluateOrgPaymentStatus("org-1", {
      client,
      now: new Date("2026-04-14T10:00:00.000Z"),
    });

    expect(result.newStatus).toBe("grace");
    expect(updateOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        enterprise_status: "grace",
      }),
    );
  });

  it("pending >7 days → suspended", async () => {
    const { client, updateOrg } = createClient({
      previousStatus: "grace",
      latestInvoice: {
        payment_status: "pending",
        created_at: "2026-04-01T10:00:00.000Z",
      },
    });

    const result = await evaluateOrgPaymentStatus("org-1", {
      client,
      now: new Date("2026-04-12T10:00:00.000Z"),
    });

    expect(result.newStatus).toBe("suspended");
    expect(updateOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        enterprise_status: "suspended",
      }),
    );
  });

  it("idempotent behavior", async () => {
    const { client } = createClient({
      previousStatus: "active",
      latestInvoice: {
        payment_status: "paid",
        created_at: "2026-04-10T10:00:00.000Z",
      },
    });

    const run1 = await evaluateOrgPaymentStatus("org-1", {
      client,
      now: new Date("2026-04-12T10:00:00.000Z"),
    });

    const run2 = await evaluateOrgPaymentStatus("org-1", {
      client,
      now: new Date("2026-04-12T10:00:00.000Z"),
    });

    expect(run1.newStatus).toBe("active");
    expect(run2.newStatus).toBe("active");
  });
});
