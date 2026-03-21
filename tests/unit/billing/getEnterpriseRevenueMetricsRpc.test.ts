import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnterpriseRevenueMetricsRpc } from "../../../docker-core/server/billing/getEnterpriseRevenueMetricsRpc";

describe("getEnterpriseRevenueMetricsRpc", () => {
  it("dados normais", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          mrr_cents: 250000,
          arr_cents: 3000000,
          churn_rate_pct: 4.5,
          active_orgs: 12,
          grace_orgs: 2,
          suspended_orgs: 1,
          revenue_by_country: [
            { country: "PT", mrr: 150000 },
            { country: "ES", mrr: 100000 },
          ],
          mrr_growth_mom_pct: 8.1,
          arr_growth_yoy_pct: 12.4,
          arpu_cents: 17857,
          ltv_cents: 392854,
          net_revenue_retention_pct: 106.2,
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await getEnterpriseRevenueMetricsRpc("2026-02", client);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        mrr_cents: 250000,
        arr_cents: 3000000,
        churn_rate_pct: 4.5,
        active_orgs: 12,
        grace_orgs: 2,
        suspended_orgs: 1,
        revenue_by_country: [
          { country: "ES", mrr: 100000 },
          { country: "PT", mrr: 150000 },
        ],
        mrr_growth_mom_pct: 8.1,
        arr_growth_yoy_pct: 12.4,
        arpu_cents: 17857,
        ltv_cents: 392854,
        net_revenue_retention_pct: 106.2,
      });
    }
  });

  it("sem invoices", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          mrr_cents: 0,
          arr_cents: 0,
          churn_rate_pct: 0,
          active_orgs: 3,
          grace_orgs: 1,
          suspended_orgs: 0,
          revenue_by_country: [],
          mrr_growth_mom_pct: 0,
          arr_growth_yoy_pct: 0,
          arpu_cents: 0,
          ltv_cents: 0,
          net_revenue_retention_pct: 100,
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await getEnterpriseRevenueMetricsRpc("2026-02", client);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mrr_cents).toBe(0);
      expect(result.data.arr_cents).toBe(0);
      expect(result.data.revenue_by_country).toEqual([]);
    }
  });

  it("apenas suspensas", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          mrr_cents: 0,
          arr_cents: 0,
          churn_rate_pct: 100,
          active_orgs: 0,
          grace_orgs: 0,
          suspended_orgs: 9,
          revenue_by_country: [],
          mrr_growth_mom_pct: -100,
          arr_growth_yoy_pct: -100,
          arpu_cents: 0,
          ltv_cents: 0,
          net_revenue_retention_pct: 0,
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await getEnterpriseRevenueMetricsRpc("2026-02", client);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.active_orgs).toBe(0);
      expect(result.data.suspended_orgs).toBe(9);
      expect(result.data.mrr_cents).toBe(0);
    }
  });

  it("crescimento negativo", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          mrr_cents: 90000,
          arr_cents: 1080000,
          churn_rate_pct: 19.5,
          active_orgs: 7,
          grace_orgs: 1,
          suspended_orgs: 2,
          revenue_by_country: [{ country: "PT", mrr: 90000 }],
          mrr_growth_mom_pct: -12.75,
          arr_growth_yoy_pct: -5.2,
          arpu_cents: 11250,
          ltv_cents: 57690,
          net_revenue_retention_pct: 92.8,
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await getEnterpriseRevenueMetricsRpc("2026-02", client);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mrr_growth_mom_pct).toBeLessThan(0);
      expect(result.data.arr_growth_yoy_pct).toBeLessThan(0);
    }
  });

  it("crescimento positivo", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          mrr_cents: 410000,
          arr_cents: 4920000,
          churn_rate_pct: 2.1,
          active_orgs: 22,
          grace_orgs: 1,
          suspended_orgs: 0,
          revenue_by_country: [
            { country: "PT", mrr: 210000 },
            { country: "ES", mrr: 200000 },
          ],
          mrr_growth_mom_pct: 16.3,
          arr_growth_yoy_pct: 28.7,
          arpu_cents: 17826,
          ltv_cents: 848857,
          net_revenue_retention_pct: 112.3,
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await getEnterpriseRevenueMetricsRpc("2026-02", client);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mrr_growth_mom_pct).toBeGreaterThan(0);
      expect(result.data.arr_growth_yoy_pct).toBeGreaterThan(0);
      expect(result.data.net_revenue_retention_pct).toBeGreaterThan(100);
    }
  });

  it("normaliza erro estável", async () => {
    const client = {
      rpc: jest.fn().mockRejectedValue(new Error("boom metrics")),
    } as unknown as SupabaseClient;

    const result = await getEnterpriseRevenueMetricsRpc("2026-02", client);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual(
        expect.objectContaining({
          code: "UNEXPECTED_ERROR",
          message: expect.stringContaining("boom metrics"),
        }),
      );
    }
  });
});
