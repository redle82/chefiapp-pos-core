import { describe, expect, it } from "vitest";
import {
  deriveRestaurantReadiness,
  type RestaurantReadiness,
} from "./deriveRestaurantReadiness";
import type { Restaurant } from "./restaurant.types";

function makeBaseRestaurant(): Restaurant {
  const now = new Date().toISOString();
  return {
    id: "rest-1",
    ownerUserId: "owner-1",
    ownerPhone: "+351000000000",
    identity: {
      status: "INCOMPLETE",
      name: undefined,
    },
    local: {
      status: "READY",
      country: "PT",
      currency: "EUR",
      timezone: "Europe/Lisbon",
    },
    menu: {
      status: "INCOMPLETE",
      hasItems: false,
    },
    publication: {
      status: "INCOMPLETE",
      isPublished: false,
    },
    operation: {
      isTurnOpen: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

describe("deriveRestaurantReadiness", () => {
  it("deriva estado inicial de criação por telefone (apenas local pronto)", () => {
    const restaurant = makeBaseRestaurant();

    const readiness: RestaurantReadiness =
      deriveRestaurantReadiness(restaurant);

    expect(readiness.configStatus).toBe("INCOMPLETE");
    expect(readiness.operationStatus).toBe("TURN_CLOSED");
    expect(readiness.blockingReasons).toEqual([
      "Identidade",
      "Cardápio",
      "Publicação",
    ]);
  });

  it("considera config incompleta quando qualquer bloco está INCOMPLETE", () => {
    const restaurant: Restaurant = {
      ...makeBaseRestaurant(),
      identity: { status: "READY", name: "Restaurante XPTO" },
      menu: { status: "READY", hasItems: true },
      publication: { status: "INCOMPLETE", isPublished: false },
    };

    const readiness = deriveRestaurantReadiness(restaurant);

    expect(readiness.configStatus).toBe("INCOMPLETE");
    expect(readiness.blockingReasons).toEqual(["Publicação"]);
    expect(readiness.operationStatus).toBe("TURN_CLOSED");
  });

  it("marca config READY quando todos os blocos estão READY", () => {
    const restaurant: Restaurant = {
      ...makeBaseRestaurant(),
      identity: { status: "READY", name: "Restaurante XPTO" },
      local: {
        status: "READY",
        country: "PT",
        currency: "EUR",
        timezone: "Europe/Lisbon",
      },
      menu: { status: "READY", hasItems: true },
      publication: { status: "READY", isPublished: true },
    };

    const readiness = deriveRestaurantReadiness(restaurant);

    expect(readiness.configStatus).toBe("READY");
    expect(readiness.blockingReasons).toEqual([]);
  });

  it("define TURN_OPEN apenas quando turno aberto e com currentTurnId", () => {
    const restaurant: Restaurant = {
      ...makeBaseRestaurant(),
      identity: { status: "READY", name: "Restaurante XPTO" },
      local: {
        status: "READY",
        country: "PT",
        currency: "EUR",
        timezone: "Europe/Lisbon",
      },
      menu: { status: "READY", hasItems: true },
      publication: { status: "READY", isPublished: true },
      operation: {
        isTurnOpen: true,
        currentTurnId: "turn-123",
      },
    };

    const readiness = deriveRestaurantReadiness(restaurant);

    expect(readiness.configStatus).toBe("READY");
    expect(readiness.operationStatus).toBe("TURN_OPEN");
    expect(readiness.blockingReasons).toEqual([]);
  });

  it("usa PREVIEW_ONLY quando config está READY mas turno fechado", () => {
    const restaurant: Restaurant = {
      ...makeBaseRestaurant(),
      identity: { status: "READY", name: "Restaurante XPTO" },
      local: {
        status: "READY",
        country: "PT",
        currency: "EUR",
        timezone: "Europe/Lisbon",
      },
      menu: { status: "READY", hasItems: true },
      publication: { status: "READY", isPublished: true },
      operation: {
        isTurnOpen: false,
      },
    };

    const readiness = deriveRestaurantReadiness(restaurant);

    expect(readiness.configStatus).toBe("READY");
    expect(readiness.operationStatus).toBe("PREVIEW_ONLY");
    expect(readiness.blockingReasons).toEqual([]);
  });

  it("mantém TURN_CLOSED quando config está INCOMPLETE, independentemente do turno", () => {
    const restaurant: Restaurant = {
      ...makeBaseRestaurant(),
      operation: {
        isTurnOpen: true,
        currentTurnId: undefined,
      },
    };

    const readiness = deriveRestaurantReadiness(restaurant);

    expect(readiness.configStatus).toBe("INCOMPLETE");
    expect(readiness.operationStatus).toBe("TURN_CLOSED");
  });
});
