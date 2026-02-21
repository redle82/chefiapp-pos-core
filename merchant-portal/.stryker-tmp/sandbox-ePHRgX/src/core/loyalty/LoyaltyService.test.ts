// @ts-nocheck
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dockerCoreFetchClient before importing LoyaltyService
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("../infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
    channel: () => ({ subscribe: vi.fn(), unsubscribe: vi.fn(), on: vi.fn() }),
    removeChannel: vi.fn(),
  }),
}));

import { LoyaltyService } from "./LoyaltyService";

// Helper to build a chainable filter builder mock
function chainMock(finalData: any = null, finalError: any = null) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: finalData, error: finalError })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: finalData, error: finalError })),
    then: (resolve: any) =>
      resolve({ data: Array.isArray(finalData) ? finalData : finalData ? [finalData] : [], error: finalError }),
  };
  return chain;
}

describe("LoyaltyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateTier", () => {
    const config = {
      id: "t1",
      restaurant_id: "r1",
      points_per_euro: 1,
      silver_threshold: 0,
      gold_threshold: 100,
      platinum_threshold: 500,
    };

    it("returns silver for 0 points", () => {
      expect(LoyaltyService.calculateTier(0, config)).toBe("silver");
    });

    it("returns gold for 100 points", () => {
      expect(LoyaltyService.calculateTier(100, config)).toBe("gold");
    });

    it("returns platinum for 500+ points", () => {
      expect(LoyaltyService.calculateTier(600, config)).toBe("platinum");
    });
  });

  describe("getTierConfig", () => {
    it("returns default config with correct restaurant_id", async () => {
      const config = await LoyaltyService.getTierConfig("rest-1");
      expect(config.restaurant_id).toBe("rest-1");
      expect(config.points_per_euro).toBe(1);
      expect(config.gold_threshold).toBe(100);
      expect(config.platinum_threshold).toBe(500);
    });
  });

  describe("getAvailableRewards", () => {
    it("returns 3 placeholder rewards", async () => {
      const rewards = await LoyaltyService.getAvailableRewards("rest-1");
      expect(rewards).toHaveLength(3);
      expect(rewards[0].name).toBe("Café grátis");
      expect(rewards[2].pointsCost).toBe(200);
    });
  });

  describe("findOrCreateCard", () => {
    it("returns existing customer when found by customerId", async () => {
      const customerRow = {
        id: "cust-1",
        restaurant_id: "rest-1",
        phone: "+351999",
        name: "Ana",
        points_balance: 50,
        total_spend_cents: 5000,
        visit_count: 3,
        last_visit_at: "2025-01-01T00:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };
      mockFrom.mockReturnValue(chainMock(customerRow));

      const card = await LoyaltyService.findOrCreateCard("rest-1", "cust-1");
      expect(card.id).toBe("cust-1");
      expect(card.current_points).toBe(50);
      expect(card.current_tier).toBe("silver");
    });

    it("returns anon-card when no phone or customerId given", async () => {
      const card = await LoyaltyService.findOrCreateCard("rest-1");
      expect(card.id).toBe("anon-card");
      expect(card.current_points).toBe(0);
    });
  });

  describe("getCustomerCard", () => {
    it("returns null when customer not found", async () => {
      mockFrom.mockReturnValue(chainMock(null));

      const card = await LoyaltyService.getCustomerCard("rest-1", "nonexistent");
      expect(card).toBeNull();
    });

    it("returns card when customer found", async () => {
      const row = {
        id: "cust-1",
        restaurant_id: "rest-1",
        phone: "+351111",
        name: "Joao",
        points_balance: 200,
        total_spend_cents: 20000,
        visit_count: 10,
        last_visit_at: null,
        created_at: "2024-06-01T00:00:00Z",
        updated_at: "2024-06-01T00:00:00Z",
      };
      mockFrom.mockReturnValue(chainMock(row));

      const card = await LoyaltyService.getCustomerCard("rest-1", "cust-1");
      expect(card).not.toBeNull();
      expect(card!.current_tier).toBe("gold");
      expect(card!.current_points).toBe(200);
    });
  });

  describe("redeemPoints", () => {
    it("returns error when customer not found", async () => {
      mockFrom.mockReturnValue(chainMock(null));

      const result = await LoyaltyService.redeemPoints("rest-1", "bad-id", "reward-1", 50);
      expect(result.success).toBe(false);
      expect(result.error).toContain("não encontrado");
    });

    it("returns error when insufficient balance", async () => {
      mockFrom.mockReturnValue(chainMock({ id: "cust-1", points_balance: 10 }));

      const result = await LoyaltyService.redeemPoints("rest-1", "cust-1", "reward-1", 50);
      expect(result.success).toBe(false);
      expect(result.error).toContain("insuficiente");
    });
  });
});
