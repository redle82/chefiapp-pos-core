import {
  RestaurantResolutionRepository,
  resolveRestaurantIdFromPaymentContext,
} from "./restaurant-resolution";

function makeRepository(
  overrides?: Partial<RestaurantResolutionRepository>,
): RestaurantResolutionRepository {
  return {
    findRestaurantByOrderId: jest.fn(async () => null),
    findRestaurantByMerchantCode: jest.fn(async () => null),
    findPaymentByExternalRef: jest.fn(async () => null),
    ...overrides,
  };
}

describe("resolveRestaurantIdFromPaymentContext", () => {
  it("prioritizes order id when available", async () => {
    const repository = makeRepository({
      findRestaurantByOrderId: jest.fn(async (orderId) =>
        orderId === "order_1" ? "rest_1" : null,
      ),
    });

    const result = await resolveRestaurantIdFromPaymentContext(
      {
        provider: "sumup",
        orderId: "order_1",
        merchantCode: "merchant_1",
      },
      repository,
    );

    expect(result).toBe("rest_1");
    expect(repository.findRestaurantByOrderId).toHaveBeenCalledWith("order_1");
    expect(repository.findRestaurantByMerchantCode).not.toHaveBeenCalled();
  });

  it("falls back to merchant mapping when order does not resolve", async () => {
    const repository = makeRepository({
      findRestaurantByOrderId: jest.fn(async () => null),
      findRestaurantByMerchantCode: jest.fn(async () => "rest_merchant"),
    });

    const result = await resolveRestaurantIdFromPaymentContext(
      {
        provider: "sumup",
        orderId: "missing",
        merchantCode: "merchant_1",
      },
      repository,
    );

    expect(result).toBe("rest_merchant");
    expect(repository.findRestaurantByMerchantCode).toHaveBeenCalledWith(
      "merchant_1",
      "sumup",
    );
  });

  it("falls back to payment reference and then order from payment", async () => {
    const repository = makeRepository({
      findPaymentByExternalRef: jest.fn(async (reference) =>
        reference === "chk_1"
          ? { restaurantId: null, orderId: "order_from_payment" }
          : null,
      ),
      findRestaurantByOrderId: jest.fn(async (orderId) =>
        orderId === "order_from_payment" ? "rest_from_payment" : null,
      ),
    });

    const result = await resolveRestaurantIdFromPaymentContext(
      {
        provider: "sumup",
        paymentReference: "chk_1",
      },
      repository,
    );

    expect(result).toBe("rest_from_payment");
  });

  it("uses event id fallback when payment reference is missing", async () => {
    const repository = makeRepository({
      findPaymentByExternalRef: jest.fn(async (reference) =>
        reference === "evt_1"
          ? { restaurantId: "rest_evt", orderId: null }
          : null,
      ),
    });

    const result = await resolveRestaurantIdFromPaymentContext(
      {
        provider: "sumup",
        eventId: "evt_1",
      },
      repository,
    );

    expect(result).toBe("rest_evt");
  });

  it("returns null when all strategies fail", async () => {
    const repository = makeRepository();
    const result = await resolveRestaurantIdFromPaymentContext(
      {
        provider: "sumup",
        orderId: "unknown",
        merchantCode: "unknown",
        paymentReference: "unknown",
        eventId: "unknown_evt",
      },
      repository,
    );

    expect(result).toBeNull();
  });
});
