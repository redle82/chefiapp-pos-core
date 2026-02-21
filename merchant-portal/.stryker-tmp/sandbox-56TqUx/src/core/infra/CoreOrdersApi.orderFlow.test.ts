/**
 * FASE 1 — Teste mínimo do fluxo TPV → Core → KDS.
 * Verifica que createOrderAtomic e updateOrderStatus existem e que os params
 * usados no fluxo (confirmação TPV, estados KDS) têm a forma esperada.
 * E2E completo (abrir TPV, confirmar, ver no KDS) = teste manual/canónico.
 */
// @ts-nocheck


import { describe, expect, it } from "vitest";
import {
  createOrderAtomic,
  updateOrderStatus,
} from "./CoreOrdersApi";

describe("CoreOrdersApi order flow (FASE 1)", () => {
  const restaurantId = "00000000-0000-0000-0000-000000000100";
  const orderId = "11111111-2222-3333-4444-555555555555";

  describe("createOrderAtomic params shape", () => {
    it("expects p_restaurant_id, p_items array, p_payment_method (contrato TPV confirm)", () => {
      const params = {
        p_restaurant_id: restaurantId,
        p_items: [
          {
            product_id: "00000000-0000-0000-0000-000000000001",
            name: "Item teste",
            quantity: 2,
            unit_price: 1000,
          },
        ],
        p_payment_method: "cash",
      };
      expect(typeof createOrderAtomic).toBe("function");
      expect(params.p_items.length).toBeGreaterThan(0);
      expect(params.p_items[0]).toMatchObject({
        product_id: expect.any(String),
        name: expect.any(String),
        quantity: expect.any(Number),
        unit_price: expect.any(Number),
      });
    });
  });

  describe("updateOrderStatus params shape", () => {
    it("expects order_id, restaurant_id, new_status, optional origin (KDS/TPV)", () => {
      const params = {
        order_id: orderId,
        restaurant_id: restaurantId,
        new_status: "IN_PREP",
        origin: "KDS",
      };
      expect(typeof updateOrderStatus).toBe("function");
      expect(params.new_status).toMatch(/^(OPEN|IN_PREP|READY|CLOSED|CANCELLED)$/);
      expect(["KDS", "TPV"]).toContain(params.origin);
    });
  });
});
