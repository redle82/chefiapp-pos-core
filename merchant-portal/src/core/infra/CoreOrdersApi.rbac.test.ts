/**
 * RBAC NEGATIVE TESTS — update_order_status
 *
 * Valida que o RBAC está efetivamente aplicado:
 * - actor ausente → ACTOR_REQUIRED
 * - actor sem role → UNAUTHORIZED (propagado do Core)
 * - status inválido → INVALID_STATUS (propagado do Core)
 *
 * Sem estes testes, RBAC é teórico.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateOrderStatus } from "./CoreOrdersApi";
import { coreClient } from "./coreClient";

vi.mock("./coreClient", () => ({
  coreClient: {
    rpc: vi.fn(),
  },
}));

const mockRpc = vi.mocked(coreClient.rpc);

describe("CoreOrdersApi — RBAC negative paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CLIENT-SIDE: actor ausente — nunca chama RPC
  // ==========================================================================
  describe("actor_user_id required (client guard)", () => {
    it("returns ACTOR_REQUIRED when actor_user_id is missing", async () => {
      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "CLOSED",
        // actor_user_id: undefined
      } as any);

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("ACTOR_REQUIRED"),
      });
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("returns ACTOR_REQUIRED when actor_user_id is null", async () => {
      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "CLOSED",
        actor_user_id: null as any,
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("ACTOR_REQUIRED"),
      });
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("returns ACTOR_REQUIRED when actor_user_id is empty string", async () => {
      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "CLOSED",
        actor_user_id: "",
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("ACTOR_REQUIRED"),
      });
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CORE ERRORS: propagados ao caller
  // ==========================================================================
  describe("Core RPC errors propagation", () => {
    it("propagates ACTOR_REQUIRED when Core returns it", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message:
            "ACTOR_REQUIRED: p_actor_user_id is required for order status transitions",
          code: "PGRST301",
        },
      });

      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "CLOSED",
        actor_user_id: "00000000-0000-0000-0000-000000000002",
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("ACTOR_REQUIRED"),
      });
    });

    it("propagates UNAUTHORIZED when actor lacks manager+ role", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message:
            "UNAUTHORIZED: actor lacks required role for order status transitions",
          code: "PGRST301",
        },
      });

      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "IN_PREP",
        actor_user_id: "00000000-0000-0000-0000-000000000099", // user sem role
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("UNAUTHORIZED"),
      });
    });

    it("propagates UNAUTHORIZED when actor is from another restaurant", async () => {
      // gm_has_role retorna false → mesmo erro UNAUTHORIZED
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message:
            "UNAUTHORIZED: actor lacks required role for order status transitions",
          code: "PGRST301",
        },
      });

      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-A",
        new_status: "READY",
        actor_user_id: "user-of-rest-B", // actor de outro restaurante
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("UNAUTHORIZED"),
      });
    });

    it("returns INVALID_ORDER_STATUS locally when status is not in enum", async () => {
      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "SERVED" as any, // status inválido (AgoraSection usa)
        actor_user_id: "00000000-0000-0000-0000-000000000002",
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        code: "INVALID_ORDER_STATUS",
      });
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("propagates INVALID_TRANSITION when state machine rejects (e.g. OPEN→CLOSED)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message:
            "INVALID_TRANSITION: OPEN can only go to PREPARING, IN_PREP, or READY. Got: CLOSED. Use CLOSED for payment, CANCELLED to cancel.",
          code: "PGRST301",
        },
      });

      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "CLOSED",
        actor_user_id: "00000000-0000-0000-0000-000000000002",
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("INVALID_TRANSITION"),
      });
    });

    it("propagates INVALID_TRANSITION when CLOSED→OPEN (terminal to active)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message:
            "INVALID_TRANSITION: CLOSED is terminal. Cannot transition to OPEN.",
          code: "PGRST301",
        },
      });

      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "OPEN",
        actor_user_id: "00000000-0000-0000-0000-000000000002",
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        message: expect.stringContaining("INVALID_TRANSITION"),
      });
    });
  });

  // ==========================================================================
  // SUCCESS PATH: confirma que com actor válido passa
  // ==========================================================================
  describe("success with valid actor", () => {
    it("succeeds when actor_user_id is present and Core returns success", async () => {
      mockRpc.mockResolvedValueOnce({
        data: {
          order_id: "order-123",
          new_status: "CLOSED",
        },
        error: null,
      });

      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "CLOSED",
        actor_user_id: "00000000-0000-0000-0000-000000000002",
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        order_id: "order-123",
        new_status: "CLOSED",
      });
      expect(mockRpc).toHaveBeenCalledWith(
        "update_order_status",
        expect.objectContaining({
          p_actor_user_id: "00000000-0000-0000-0000-000000000002",
        }),
      );
    });
  });
});
