/**
 * E2E — Realtime Reconnect (ReconnectManager)
 *
 * Valida a API atual do ReconnectManager:
 * - getAttempts, increment, reset, shouldRetry, getDelay, getDelayFormatted
 * - Sem constructor options; sem attemptReconnect (lógica de reconnect é externa).
 */

import { describe, it, expect } from "@jest/globals";
import { ReconnectManager } from "../../merchant-portal/src/core/realtime/ReconnectManager";

describe("E2E - Realtime Reconnect", () => {
  it("deve criar ReconnectManager com estado inicial", () => {
    const manager = new ReconnectManager();

    expect(manager).toBeDefined();
    expect(manager.getAttempts()).toBe(0);
    expect(manager.shouldRetry()).toBe(true);
  });

  it("deve incrementar tentativas e calcular delay (exponential backoff)", () => {
    const manager = new ReconnectManager();

    expect(manager.getAttempts()).toBe(0);
    manager.increment();
    expect(manager.getAttempts()).toBe(1);
    manager.increment();
    expect(manager.getAttempts()).toBe(2);

    const delay0 = manager.getDelay();
    expect(typeof delay0).toBe("number");
    expect(delay0).toBeGreaterThanOrEqual(0);

    manager.reset();
    expect(manager.getAttempts()).toBe(0);
  });

  it("deve resetar tentativas após reconexão (reset)", () => {
    const manager = new ReconnectManager();

    manager.increment();
    manager.increment();
    expect(manager.getAttempts()).toBe(2);

    manager.reset();
    expect(manager.getAttempts()).toBe(0);
  });

  it("deve expor getDelayFormatted", () => {
    const manager = new ReconnectManager();

    const formatted = manager.getDelayFormatted();
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});
