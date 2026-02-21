import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dockerCoreFetchClient
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

import { GroupEngine } from "./GroupEngine";
import type { GroupType } from "./GroupEngine";

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

describe("GroupEngine", () => {
  let engine: GroupEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new GroupEngine();
  });

  describe("createGroup", () => {
    it("calls PostgREST insert and returns created id", async () => {
      mockFrom.mockReturnValue(chainMock({ id: "grp-abc123" }));

      const id = await engine.createGroup({ name: "Cadeia Norte" });
      expect(id).toBe("grp-abc123");
      expect(mockFrom).toHaveBeenCalledWith("gm_restaurant_groups");
    });

    it("throws on insert error", async () => {
      mockFrom.mockReturnValue(
        chainMock(null, { message: "DB error" })
      );

      await expect(engine.createGroup({ name: "Fail" })).rejects.toThrow("DB error");
    });
  });

  describe("listGroups", () => {
    it("returns mapped groups from PostgREST", async () => {
      const rows = [
        {
          id: "g1",
          name: "Alpha",
          group_type: "franchise",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "g2",
          name: "Beta",
          group_type: "chain",
          created_at: "2025-02-01T00:00:00Z",
          updated_at: "2025-02-01T00:00:00Z",
        },
      ];
      mockFrom.mockReturnValue(chainMock(rows));

      const groups = await engine.listGroups();
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe("Alpha");
      expect(groups[0].groupType).toBe("franchise");
      expect(groups[1].groupType).toBe("chain");
    });

    it("returns empty array on error", async () => {
      mockFrom.mockReturnValue(chainMock(null, { message: "fail" }));

      const groups = await engine.listGroups();
      expect(groups).toEqual([]);
    });
  });

  describe("addRestaurantToGroup", () => {
    it("throws when group not found", async () => {
      mockFrom.mockReturnValue(chainMock(null));

      await expect(
        engine.addRestaurantToGroup({ restaurantId: "r1", groupId: "bad-group" })
      ).rejects.toThrow("Group not found");
    });

    it("inserts member and returns id", async () => {
      // First call: verify group exists  
      // Second call: insert member
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return chainMock({ id: "g1" });
        }
        return chainMock({ id: "member-1" });
      });

      const id = await engine.addRestaurantToGroup({
        restaurantId: "rest-1",
        groupId: "g1",
        role: "member",
      });
      expect(id).toBe("member-1");
    });
  });

  describe("listGroupMembers", () => {
    it("returns mapped members", async () => {
      const rows = [
        {
          id: "m1",
          group_id: "g1",
          restaurant_id: "r1",
          role: "master",
          inherits_config: true,
          inherits_menu: true,
          inherits_pricing: false,
          inherits_schedule: false,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ];
      mockFrom.mockReturnValue(chainMock(rows));

      const members = await engine.listGroupMembers("g1");
      expect(members).toHaveLength(1);
      expect(members[0].restaurantId).toBe("r1");
      expect(members[0].role).toBe("master");
      expect(members[0].inheritsMenu).toBe(true);
    });
  });

  describe("getRestaurantGroup", () => {
    it("returns null when restaurant has no group", async () => {
      mockFrom.mockReturnValue(chainMock(null));

      const group = await engine.getRestaurantGroup("orphan-rest");
      expect(group).toBeNull();
    });

    it("returns group when restaurant is a member", async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Query gm_restaurant_group_members
          return chainMock({ group_id: "g1" });
        }
        // Query gm_restaurant_groups
        return chainMock({
          id: "g1",
          name: "Cadeia Sul",
          group_type: "chain",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        });
      });

      const group = await engine.getRestaurantGroup("rest-1");
      expect(group).not.toBeNull();
      expect(group!.name).toBe("Cadeia Sul");
      expect(group!.groupType).toBe("chain");
    });
  });

  describe("applyInheritedConfiguration", () => {
    it("returns default when restaurant has no group", async () => {
      mockFrom.mockReturnValue(chainMock(null));

      const result = await engine.applyInheritedConfiguration("r1", "menu", "theme");
      expect(result.inherited).toBe(false);
    });
  });
});
