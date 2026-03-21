import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureBillingIntegrity } from "../../../docker-core/server/billing/billingIntegrityGuard";

type OrgStatus = "green" | "yellow" | "red" | null;
type RestaurantStatus = "green" | "yellow" | "red" | null;

function createClient(options?: {
  orgStatus?: OrgStatus;
  restaurantStatus?: RestaurantStatus;
  enterpriseStatus?: "active" | "suspended" | "grace";
}) {
  const orgStatus = options?.orgStatus ?? null;
  const restaurantStatus = options?.restaurantStatus ?? null;
  const enterpriseStatus = options?.enterpriseStatus ?? "active";

  const from = jest.fn((table: string) => {
    if (table === "gm_organizations") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                enterprise_status: enterpriseStatus,
              },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "gm_org_daily_consolidation") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: orgStatus ? { status: orgStatus } : null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }

    if (table === "gm_financial_reconciliation") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: restaurantStatus ? { status: restaurantStatus } : null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { from } as unknown as SupabaseClient;
}

describe("billingGuard enterprise mode layering", () => {
  it("restaurant only", async () => {
    const client = createClient({ restaurantStatus: "green" });

    await expect(
      ensureBillingIntegrity({
        restaurantId: "rest-1",
        date: "2026-04-15",
        client,
      }),
    ).resolves.toBeUndefined();
  });

  it("org healthy", async () => {
    const client = createClient({
      orgStatus: "green",
      restaurantStatus: "red",
    });

    await expect(
      ensureBillingIntegrity({
        restaurantId: "rest-1",
        organizationId: "org-1",
        date: "2026-04-15",
        client,
      }),
    ).resolves.toBeUndefined();
  });

  it("org blocked", async () => {
    const client = createClient({ orgStatus: "yellow" });

    await expect(
      ensureBillingIntegrity({
        restaurantId: "rest-1",
        organizationId: "org-1",
        date: "2026-04-15",
        client,
      }),
    ).rejects.toMatchObject({ code: "ORG_RECONCILIATION_REQUIRED" });
  });

  it("mixed scenario", async () => {
    const orgClient = createClient({
      orgStatus: "green",
      restaurantStatus: "red",
    });

    const singleRestaurantClient = createClient({ restaurantStatus: "red" });

    await expect(
      ensureBillingIntegrity({
        restaurantId: "rest-multi",
        organizationId: "org-ok",
        date: "2026-04-15",
        client: orgClient,
      }),
    ).resolves.toBeUndefined();

    await expect(
      ensureBillingIntegrity({
        restaurantId: "rest-single",
        date: "2026-04-15",
        client: singleRestaurantClient,
      }),
    ).rejects.toMatchObject({ code: "RECONCILIATION_REQUIRED" });
  });

  it("suspended org blocked with ORG_SUSPENDED", async () => {
    const client = createClient({
      enterpriseStatus: "suspended",
      orgStatus: "green",
    });

    await expect(
      ensureBillingIntegrity({
        restaurantId: "rest-1",
        organizationId: "org-1",
        date: "2026-04-15",
        client,
      }),
    ).rejects.toMatchObject({ code: "ORG_SUSPENDED" });
  });
});
