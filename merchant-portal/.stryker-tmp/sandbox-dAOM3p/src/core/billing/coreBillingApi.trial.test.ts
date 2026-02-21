/**
 * Testes da lógica trial_ends_at e trial_expired (paywall).
 * FASE 2 pós-vendável: garantir que trial expirado é tratado como past_due.
 */
// @ts-nocheck


import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBillingStatus,
  getBillingStatusWithTrial,
} from "./coreBillingApi";
import { BackendType } from "../infra/backendAdapter";

vi.mock("../../config", () => ({
  CONFIG: {
    CORE_URL: "http://localhost:3001/rest/v1",
    CORE_ANON_KEY: "test-anon-key",
  },
}));

vi.mock("../infra/backendAdapter", () => ({
  getBackendType: vi.fn(),
  BackendType: { docker: "docker", none: "none" },
}));

import { getBackendType } from "../infra/backendAdapter";

describe("coreBillingApi — trial_ends_at e paywall", () => {
  const restaurantId = "00000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    vi.mocked(getBackendType).mockReturnValue(BackendType.docker);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("trial_expired é true quando billing_status=trial e trial_ends_at no passado", async () => {
    const pastDate = "2020-01-01T00:00:00.000Z";
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { billing_status: "trial", trial_ends_at: pastDate },
        ]),
    });

    const result = await getBillingStatusWithTrial(restaurantId);

    expect(result).not.toBeNull();
    expect(result?.status).toBe("trial");
    expect(result?.trial_ends_at).toBe(pastDate);
    expect(result?.trial_expired).toBe(true);
  });

  it("trial_expired é false quando trial_ends_at no futuro", async () => {
    const futureDate = "2030-12-31T23:59:59.000Z";
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { billing_status: "trial", trial_ends_at: futureDate },
        ]),
    });

    const result = await getBillingStatusWithTrial(restaurantId);

    expect(result).not.toBeNull();
    expect(result?.status).toBe("trial");
    expect(result?.trial_expired).toBe(false);
  });

  it("getBillingStatus devolve past_due quando trial_expired", async () => {
    const pastDate = "2020-01-01T00:00:00.000Z";
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { billing_status: "trial", trial_ends_at: pastDate },
        ]),
    });

    const status = await getBillingStatus(restaurantId);

    expect(status).toBe("past_due");
  });
});
