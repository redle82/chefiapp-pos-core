// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock(
  "../../../../merchant-portal/src/core/infra/coreClient",
  () => {
    const rpc = jest.fn();
    const fromChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    };

    return {
      coreClient: {
        rpc,
        from: jest.fn(() => fromChain),
      },
    };
  },
);

jest.mock(
  "../../../../merchant-portal/src/core/infra/eventBus",
  () => ({
    publishEvent: jest.fn(async () => undefined),
  }),
);

jest.mock(
  "../../../../merchant-portal/src/core/infra/eventTypes",
  () => ({
    createEvent: jest.fn(
      (type: string, payload: any, tenantId: string) => ({
        type,
        payload,
        tenantId,
      }),
    ),
  }),
);

jest.mock(
  "../../../../merchant-portal/src/core/observability/latencyStore",
  () => ({
    addSample: jest.fn(),
  }),
);

jest.mock("../../../../merchant-portal/src/core/logger", () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import {
  createOrderAtomic,
  orderExistsInCore,
} from "../../../../merchant-portal/src/core/infra/CoreOrdersApi";

const { coreClient } = jest.requireMock(
  "../../../../merchant-portal/src/core/infra/coreClient",
) as {
  coreClient: {
    rpc: jest.Mock;
    from: jest.Mock;
  };
};

const { publishEvent } = jest.requireMock(
  "../../../../merchant-portal/src/core/infra/eventBus",
) as { publishEvent: jest.Mock };

const { addSample } = jest.requireMock(
  "../../../../merchant-portal/src/core/observability/latencyStore",
) as { addSample: jest.Mock };

describe("CoreOrdersApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createOrderAtomic returns data on success and logs latency + event", async () => {
    const rpcResult = {
      data: {
        id: "core-order-1",
        total_cents: 1500,
        status: "open",
      },
      error: null,
    };
    (coreClient.rpc as jest.Mock).mockResolvedValueOnce(rpcResult);

    const result = await createOrderAtomic({
      p_restaurant_id: "rest-1",
      p_items: [
        {
          product_id: "p1",
          name: "Café",
          quantity: 1,
          unit_price: 1500,
        },
      ],
      p_payment_method: "cash",
      p_sync_metadata: { localId: "local-1" },
      p_idempotency_key: "idem-1",
    });

    expect(coreClient.rpc).toHaveBeenCalledWith(
      "create_order_atomic",
      expect.objectContaining({
        p_restaurant_id: "rest-1",
        p_items: expect.any(Array),
        p_payment_method: "cash",
        p_sync_metadata: { localId: "local-1" },
        p_idempotency_key: "idem-1",
      }),
    );

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      id: "core-order-1",
      total_cents: 1500,
      status: "open",
    });

    expect(addSample).toHaveBeenCalledWith(
      "rest-1",
      "create_order_atomic",
      expect.any(Number),
    );

    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "order.created",
        tenantId: "rest-1",
      }),
    );
  });

  it("createOrderAtomic returns error when Core RPC returns error", async () => {
    (coreClient.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: "core boom", code: "500" },
    });

    const result = await createOrderAtomic({
      p_restaurant_id: "rest-err",
      p_items: [
        {
          product_id: "p1",
          name: "Item",
          quantity: 1,
          unit_price: 100,
        },
      ],
    });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: "core boom",
      code: "500",
    });
  });

  it("createOrderAtomic returns error when Core RPC does not return id", async () => {
    (coreClient.rpc as jest.Mock).mockResolvedValueOnce({
      data: { total_cents: 1000, status: "open" },
      error: null,
    });

    const result = await createOrderAtomic({
      p_restaurant_id: "rest-missing-id",
      p_items: [
        {
          product_id: "p1",
          name: "Item",
          quantity: 1,
          unit_price: 1000,
        },
      ],
    });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: "Core RPC did not return order id",
    });
  });

  it("orderExistsInCore returns true when Core returns a row", async () => {
    const fromChain = (coreClient.from as jest.Mock)();

    fromChain.maybeSingle.mockResolvedValueOnce({
      data: { id: "order-1" },
      error: null,
    });

    const exists = await orderExistsInCore("order-1");
    expect(exists).toBe(true);
  });

  it("orderExistsInCore returns false when Core errors", async () => {
    const fromChain = (coreClient.from as jest.Mock)();

    fromChain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "fail" },
    });

    const exists = await orderExistsInCore("missing-order");
    expect(exists).toBe(false);
  });
});
