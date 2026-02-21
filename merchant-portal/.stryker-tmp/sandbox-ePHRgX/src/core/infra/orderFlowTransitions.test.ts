/**
 * FASE 1 — Contrato de transições de estado do pedido (FLUXO_DE_PEDIDO_OPERACIONAL).
 * Testes de transições permitidas e proibidas; o Core (RPC update_order_status) aceita
 * qualquer status válido; esta suite documenta e valida o contrato esperado na aplicação.
 */
// @ts-nocheck


import { describe, expect, it } from "vitest";

const VALID_STATUSES = ["OPEN", "IN_PREP", "READY", "CLOSED", "CANCELLED"] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

/** Transições permitidas no fluxo canónico TPV → KDS (Fase 1). */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  OPEN: ["IN_PREP", "CANCELLED"],
  IN_PREP: ["READY", "CANCELLED"],
  READY: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

function isAllowedTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

describe("Order flow transitions (FASE 1 contract)", () => {
  describe("allowed transitions", () => {
    it("OPEN → IN_PREP (KDS inicia preparo)", () => {
      expect(isAllowedTransition("OPEN", "IN_PREP")).toBe(true);
    });
    it("IN_PREP → READY (KDS marca pronto)", () => {
      expect(isAllowedTransition("IN_PREP", "READY")).toBe(true);
    });
    it("READY → CLOSED (pedido entregue)", () => {
      expect(isAllowedTransition("READY", "CLOSED")).toBe(true);
    });
    it("OPEN → CANCELLED", () => {
      expect(isAllowedTransition("OPEN", "CANCELLED")).toBe(true);
    });
    it("IN_PREP → CANCELLED", () => {
      expect(isAllowedTransition("IN_PREP", "CANCELLED")).toBe(true);
    });
    it("READY → CANCELLED", () => {
      expect(isAllowedTransition("READY", "CANCELLED")).toBe(true);
    });
  });

  describe("forbidden transitions", () => {
    it("READY → OPEN is not allowed", () => {
      expect(isAllowedTransition("READY", "OPEN")).toBe(false);
    });
    it("CLOSED → IN_PREP is not allowed", () => {
      expect(isAllowedTransition("CLOSED", "IN_PREP")).toBe(false);
    });
    it("CLOSED → OPEN is not allowed", () => {
      expect(isAllowedTransition("CLOSED", "OPEN")).toBe(false);
    });
    it("CLOSED → READY is not allowed", () => {
      expect(isAllowedTransition("CLOSED", "READY")).toBe(false);
    });
    it("CANCELLED → any is not allowed", () => {
      expect(isAllowedTransition("CANCELLED", "OPEN")).toBe(false);
      expect(isAllowedTransition("CANCELLED", "IN_PREP")).toBe(false);
    });
  });

  describe("valid status set", () => {
    it("only gm_orders statuses are valid", () => {
      expect(VALID_STATUSES).toContain("OPEN");
      expect(VALID_STATUSES).toContain("IN_PREP");
      expect(VALID_STATUSES).toContain("READY");
      expect(VALID_STATUSES).toContain("CLOSED");
      expect(VALID_STATUSES).toContain("CANCELLED");
      expect(VALID_STATUSES.length).toBe(5);
    });
  });
});
