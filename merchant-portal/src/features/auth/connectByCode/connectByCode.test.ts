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

  it("Fase 3 conformance: role always from invite/backend, never parsed from code text", async () => {
    // CODE_AND_DEVICE_PAIRING_CONTRACT: role comes from contract/invite, never from code string.
    const result = await connectByCode("CHEF-OWN-MOCK", { restaurantHint: "r1" });
    expect(result.success).toBe(true);
    expect(result.roleSource).toBe("invite");
    expect(result.resolvedRole).toBe("owner");
    // If we had parsed "OWN" from the code we would be violating the contract;
    // we use getTrialGuideRoleFromInviteTable(code) / active_invites.role_granted instead.
  });
});
