/**
 * CONFIG_RUNTIME_CONTRACT: garante que createOrder valida produtos com available=eq.true e restaurant_id.
 * Ver docs/contracts/CONFIG_RUNTIME_CONTRACT.md.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOrder } from "./OrderWriter";

describe("OrderWriter.createOrder (CONFIG_RUNTIME_CONTRACT)", () => {
  const restaurantId = "rest-test-123";
  const productId = "prod-test-456";
  const items = [
    {
      product_id: productId,
      name: "Produto Teste",
      quantity: 1,
      unit_price: 1000,
    },
  ];

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, options?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : (url as URL).toString();
        // Primeira chamada: validação GET gm_products
        if (urlStr.includes("gm_products") && (options?.method === "GET" || !options?.method)) {
          return Promise.resolve(
            new Response(JSON.stringify([{ id: productId }]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
        // Segunda chamada: RPC create_order_atomic
        if (urlStr.includes("create_order_atomic")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: "order-1",
                total_cents: 1000,
                status: "OPEN",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        return Promise.resolve(new Response("", { status: 404 }));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("chama validação gm_products com restaurant_id e available=eq.true", async () => {
    await createOrder(restaurantId, items);

    const fetchCalls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const validationCall = fetchCalls.find(
      (call) =>
        typeof call[0] === "string" &&
        (call[0] as string).includes("gm_products") &&
        (call[1]?.method === "GET" || !(call[1] as RequestInit)?.method)
    );
    expect(validationCall).toBeDefined();
    const url = validationCall?.[0] as string;
    expect(url).toContain("gm_products");
    expect(url).toContain("restaurant_id=eq." + restaurantId);
    expect(url).toContain("available=eq.true");
  });
});
