/**
 * insforgeClient — checkInsforgeHealth error path
 */

import { describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
vi.mock("@insforge/sdk", () => ({
  createClient: vi.fn(() => ({
    database: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        limit: mockLimit,
      })),
    },
  })),
}));

describe("insforgeClient", () => {
  it("checkInsforgeHealth returns false when query throws", async () => {
    mockLimit.mockRejectedValueOnce(new Error("Network error"));

    const { checkInsforgeHealth } = await import("./insforgeClient");
    const result = await checkInsforgeHealth();

    expect(result).toBe(false);
  });

  it("checkInsforgeHealth returns true when query succeeds", async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null });

    const { checkInsforgeHealth } = await import("./insforgeClient");
    const result = await checkInsforgeHealth();

    expect(result).toBe(true);
  });
});
