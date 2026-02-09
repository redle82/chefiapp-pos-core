/**
 * FinanceEngine Tests — Real Revenue from Docker Core
 */
import { describe, expect, it, vi } from "vitest";

const mockOrders = [
  {
    id: "o1",
    total_cents: 2500,
    payment_method: "credit",
    created_at: "2026-02-09T12:30:00Z",
    status: "completed",
  },
  {
    id: "o2",
    total_cents: 1500,
    payment_method: "cash",
    created_at: "2026-02-09T13:15:00Z",
    status: "completed",
  },
  {
    id: "o3",
    total_cents: 3000,
    payment_method: "credit",
    created_at: "2026-02-09T20:00:00Z",
    status: "paid",
  },
];

function createFinanceMock() {
  const mockFrom = vi.fn((table: string) => {
    if (table === "gm_orders") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi
                  .fn()
                  .mockResolvedValue({ data: mockOrders, error: null }),
                not: vi
                  .fn()
                  .mockResolvedValue({ data: mockOrders, error: null }),
              }),
            }),
          }),
        }),
      };
    }
    if (table === "gm_z_reports") {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "z-2026-02-09" }, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "z-2026-02-09",
                total_gross: 7000,
                total_net: 4900,
                cash_diff: 50,
              },
              error: null,
            }),
          }),
        }),
      };
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
  });

  const mockRpc = vi.fn().mockResolvedValue({
    data: {
      balance: { available: 350000, pending: 25000, currency: "eur" },
      payouts: [{ id: "po_1", amount: 100000, arrival_date: "2026-02-10" }],
    },
    error: null,
  });

  return { mockFrom, mockRpc };
}

describe("FinanceEngine (Core-backed)", () => {
  it("should aggregate daily revenue from gm_orders", async () => {
    vi.resetModules();
    const { mockFrom, mockRpc } = createFinanceMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom, rpc: mockRpc }),
      }),
    );
    const mod = await import(
      "../../../merchant-portal/src/core/reports/FinanceEngine"
    );

    const snapshot = await mod.FinanceEngine.getDailySnapshot("rest-1");
    expect(snapshot.totalOrders).toBe(3);
    expect(snapshot.totalRevenue).toBe(7000);
    expect(snapshot.averageTicket).toBe(Math.round(7000 / 3));
    expect(snapshot.paymentMethods.credit).toBe(5500);
    expect(snapshot.paymentMethods.cash).toBe(1500);
  });

  it("should calculate hourly sales distribution", async () => {
    vi.resetModules();
    const { mockFrom, mockRpc } = createFinanceMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom, rpc: mockRpc }),
      }),
    );
    const mod = await import(
      "../../../merchant-portal/src/core/reports/FinanceEngine"
    );

    const snapshot = await mod.FinanceEngine.getDailySnapshot("rest-1");
    // Hourly keys depend on timezone — verify they exist and sum to total
    const hourlyTotal = Object.values(
      snapshot.hourlySales as Record<string, number>,
    ).reduce((s: number, v: number) => s + v, 0);
    expect(hourlyTotal).toBe(7000);
  });

  it("should estimate cost at 30% and gross margin", async () => {
    vi.resetModules();
    const { mockFrom, mockRpc } = createFinanceMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom, rpc: mockRpc }),
      }),
    );
    const mod = await import(
      "../../../merchant-portal/src/core/reports/FinanceEngine"
    );

    const snapshot = await mod.FinanceEngine.getDailySnapshot("rest-1");
    expect(snapshot.totalCost).toBe(2100);
    expect(snapshot.grossMargin).toBe(4900);
  });

  it("should get Stripe financials via RPC", async () => {
    vi.resetModules();
    const { mockFrom, mockRpc } = createFinanceMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom, rpc: mockRpc }),
      }),
    );
    const mod = await import(
      "../../../merchant-portal/src/core/reports/FinanceEngine"
    );

    const result = await mod.FinanceEngine.getStripeFinancials("rest-1");
    expect(result.balance.available).toBe(350000);
    expect(result.payouts).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledWith("get_stripe_financials", {
      p_restaurant_id: "rest-1",
    });
  });

  it("should close day with Z-report", async () => {
    vi.resetModules();
    const { mockFrom, mockRpc } = createFinanceMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom, rpc: mockRpc }),
      }),
    );
    const mod = await import(
      "../../../merchant-portal/src/core/reports/FinanceEngine"
    );

    const result = await mod.FinanceEngine.closeDay(
      "rest-1",
      1550,
      "Caixa fechado OK",
    );
    expect(result.id).toBe("z-2026-02-09");
    expect(result.gross).toBe(7000);
    expect(result.cash_diff).toBe(50);
  });

  it("should get Z-report by ID", async () => {
    vi.resetModules();
    const { mockFrom, mockRpc } = createFinanceMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom, rpc: mockRpc }),
      }),
    );
    const mod = await import(
      "../../../merchant-portal/src/core/reports/FinanceEngine"
    );

    const report = await mod.FinanceEngine.getZReport("z-2026-02-09");
    expect(report.total_gross).toBe(7000);
    expect(report.total_net).toBe(4900);
  });

  it("should return empty snapshot when Core is down", async () => {
    vi.resetModules();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => {
          throw new Error("offline");
        },
      }),
    );
    const mod = await import(
      "../../../merchant-portal/src/core/reports/FinanceEngine"
    );

    const snapshot = await mod.FinanceEngine.getDailySnapshot("rest-offline");
    expect(snapshot.totalRevenue).toBe(0);
    expect(snapshot.totalOrders).toBe(0);
  });
});
