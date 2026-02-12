/**
 * CONFIG_RUNTIME_CONTRACT: garante que readProducts usa filtro available=eq.true e restaurant_id=eq.X.
 * Ver docs/contracts/CONFIG_RUNTIME_CONTRACT.md.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readProducts } from "./RestaurantReader";

describe("RestaurantReader.readProducts (CONFIG_RUNTIME_CONTRACT)", () => {
  const restaurantId = "test-restaurant-id-123";

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("chama gm_products com restaurant_id e available=eq.true", async () => {
    await readProducts(restaurantId);

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(fetchCall).toBeDefined();
    const url = fetchCall?.[0] as string;
    expect(url).toContain("gm_products");
    expect(url).toContain("restaurant_id=eq." + restaurantId);
    expect(url).toContain("available=eq.true");
  });
});
