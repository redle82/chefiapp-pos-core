import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRevenueDashboard } from "./useRevenueDashboard";

const mockRpc = vi.fn();

vi.mock("../../../core/infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: () => ({
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

describe("useRevenueDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrega métricas reais via RPC e mapeia payload", async () => {
    mockRpc.mockResolvedValue({
      data: {
        mrr_cents: 247500,
        arr_cents: 2970000,
        churn_rate_pct: 2.4,
        active_orgs: 42,
        grace_orgs: 2,
        suspended_orgs: 1,
        revenue_by_country: [
          { country: "PT", mrr: 148500, org_count: 18 },
          { country: "ES", mrr: 66000, org_count: 12 },
        ],
        mrr_growth_mom_pct: 12.5,
        arr_growth_yoy_pct: 18.2,
        arpu_cents: 5893,
        ltv_cents: 245500,
        net_revenue_retention_pct: 102.5,
      },
      error: null,
    });

    const { result } = renderHook(() => useRevenueDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockRpc).toHaveBeenCalledWith("get_enterprise_revenue_metrics", {
      p_reference_month: expect.stringMatching(/^\d{4}-\d{2}$/),
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({
      totalMrrCents: 247500,
      totalArrCents: 2970000,
      activeOrgs: 42,
      graceOrgs: 2,
      suspendedOrgs: 1,
      revenueByCountry: [
        { country: "PT", mrrCents: 148500, orgCount: 18 },
        { country: "ES", mrrCents: 66000, orgCount: 12 },
      ],
      churnRatePct: 2.4,
      mrrGrowthMonthOverMonthPct: 12.5,
      arpuCents: 5893,
      ltvCents: 245500,
      nrrPct: 102.5,
      arrGrowthYoYPct: 18.2,
    });
  });

  it("trata erro de RPC", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "rpc failed" },
    });

    const { result } = renderHook(() => useRevenueDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toContain("rpc failed");
  });
});
