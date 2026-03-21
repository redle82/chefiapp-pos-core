import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commercialTracking } from "../../commercial/tracking";
import { createOrderAtomic } from "./CoreOrdersApi";
import { coreClient } from "./coreClient";

vi.mock("./coreClient", () => ({
  coreClient: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

vi.mock("./eventBus", () => ({
  publishEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../commercial/tracking", () => ({
  commercialTracking: {
    track: vi.fn(),
  },
  isCommercialTrackingEnabled: () => true,
  detectDevice: () => "desktop",
}));

describe("CoreOrdersApi milestones", () => {
  const restaurantId = "00000000-0000-0000-0000-000000000100";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(coreClient.rpc).mockResolvedValue({
      data: {
        id: "order-1",
        total_cents: 2000,
        status: "OPEN",
      },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("tracks first_order_created when restaurant has exactly one order", async () => {
    vi.mocked(coreClient.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 1 }),
        limit: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: "order-1" }],
            count: 1,
            error: null,
          }),
        }),
      }),
    } as any);

    const result = await createOrderAtomic({
      p_restaurant_id: restaurantId,
      p_items: [
        {
          product_id: "p1",
          name: "Item",
          quantity: 1,
          unit_price: 2000,
        },
      ],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.error).toBeNull();
    expect(commercialTracking.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "first_order_created",
        restaurant_id: restaurantId,
        order_id: "order-1",
      }),
    );
  });

  it("does not track first_order_created when restaurant already has multiple orders", async () => {
    vi.mocked(coreClient.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 2 }),
        limit: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: "order-1" }, { id: "order-2" }],
            count: 2,
            error: null,
          }),
        }),
      }),
    } as any);

    await createOrderAtomic({
      p_restaurant_id: restaurantId,
      p_items: [
        {
          product_id: "p1",
          name: "Item",
          quantity: 1,
          unit_price: 2000,
        },
      ],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(commercialTracking.track).not.toHaveBeenCalled();
  });
});
