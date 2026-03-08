import { describe, expect, it } from "vitest";
import { connectByCode } from "./connectByCode";

describe("connectByCode", () => {
  it("resolves the Comandante owner code to owner", async () => {
    const result = await connectByCode("CHEF-CMDT-MOCK", {
      restaurantHint: "restaurant-1",
    });

    expect(result.success).toBe(true);
    expect(result.resolvedRole).toBe("owner");
    expect(result.roleSource).toBe("invite");
    expect(result.operationalContract?.name).toBe("Seu Restaurante");
  });

  it("keeps the legacy owner mock code working", async () => {
    const result = await connectByCode("CHEF-OWN-MOCK", {
      restaurantHint: "restaurant-1",
    });

    expect(result.success).toBe(true);
    expect(result.resolvedRole).toBe("owner");
    expect(result.roleSource).toBe("invite");
  });

  it("keeps trial environment out of the restaurant name", async () => {
    const result = await connectByCode("CHEF-MANAGER-MOCK", {
      restaurantHint: "restaurant-1",
    });

    expect(result.success).toBe(true);
    expect(result.operationalContract?.name).toBe("Seu Restaurante");
    expect(result.operationalContract?.name).not.toMatch(/trial|free/i);
  });
});
