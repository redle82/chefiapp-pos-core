/**
 * coreBillingApi — Testes 1–6 (clusters requireCore, currency, billing, restaurant, config).
 * ROI coverage: ~35–55 branches.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBillingConfig,
  getBillingStatus,
  getBillingStatusWithTrial,
  getRestaurantBillingCurrency,
  getRestaurantStatus,
  setBillingConfig,
} from "./coreBillingApi";
import { BackendType } from "../infra/backendAdapter";

const getBackendTypeMock = vi.hoisted(() => vi.fn());
vi.mock("../../config", () => ({
  CONFIG: {
    CORE_URL: "http://localhost:3001/rest/v1",
    CORE_ANON_KEY: "test-anon-key",
    API_BASE: "",
    INTERNAL_API_TOKEN: "",
    get isEdgeGateway() {
      return false;
    },
  },
}));
vi.mock("../infra/backendAdapter", () => ({
  getBackendType: (...args: unknown[]) => getBackendTypeMock(...args),
  BackendType: { docker: "docker", none: "none" },
}));

type FetchResponse = Partial<Response> & { json?: () => Promise<unknown>; text?: () => Promise<string> };

function mockFetch(response: FetchResponse): void {
  (globalThis as any).fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => ({}),
    text: async () => "",
    ...response,
  });
}

const restaurantId = "00000000-0000-0000-0000-000000000001";

describe("coreBillingApi — clusters 1–6", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBackendTypeMock.mockReturnValue(BackendType.docker);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Cluster 1: requireCore ─────────────────────────────────────
  describe("requireCore", () => {
    it("lança quando backend !== docker", async () => {
      getBackendTypeMock.mockReturnValue(BackendType.none);
      mockFetch({ ok: true, json: async () => [] });

      await expect(getRestaurantBillingCurrency(restaurantId)).rejects.toThrow(
        "[coreBillingApi] Billing requires Core (Docker)",
      );
    });
  });

  // ─── Cluster 2: getRestaurantBillingCurrency ─────────────────────
  describe("getRestaurantBillingCurrency", () => {
    it("retorna EUR quando res.ok = false", async () => {
      mockFetch({ ok: false });
      expect(await getRestaurantBillingCurrency(restaurantId)).toBe("EUR");
    });

    it("retorna EUR quando data = []", async () => {
      mockFetch({ ok: true, json: async () => [] });
      expect(await getRestaurantBillingCurrency(restaurantId)).toBe("EUR");
    });

    it("retorna currency do row quando válido", async () => {
      mockFetch({ ok: true, json: async () => [{ currency: "USD", country: "US" }] });
      expect(await getRestaurantBillingCurrency(restaurantId)).toBe("USD");
    });

    it("retorna country fallback quando currency ausente", async () => {
      mockFetch({ ok: true, json: async () => [{ country: "BR" }] });
      expect(await getRestaurantBillingCurrency(restaurantId)).toBe("BRL");
    });

    it("retorna EUR quando res.json() lança", async () => {
      mockFetch({
        ok: true,
        json: async () => {
          throw new Error("parse error");
        },
      });
      expect(await getRestaurantBillingCurrency(restaurantId)).toBe("EUR");
    });
  });

  // ─── Cluster 3: getBillingStatusWithTrial / getBillingStatus ──────
  describe("getBillingStatusWithTrial / getBillingStatus", () => {
    it("retorna null quando res.ok = false", async () => {
      mockFetch({ ok: false });
      expect(await getBillingStatusWithTrial(restaurantId)).toBeNull();
    });

    it("retorna null quando data = []", async () => {
      mockFetch({ ok: true, json: async () => [] });
      expect(await getBillingStatusWithTrial(restaurantId)).toBeNull();
    });

    it("retorna null quando billing_status inválido", async () => {
      mockFetch({ ok: true, json: async () => [{ billing_status: "invalid", trial_ends_at: null }] });
      expect(await getBillingStatusWithTrial(restaurantId)).toBeNull();
    });

    it("getBillingStatus retorna null quando withTrial é null", async () => {
      mockFetch({ ok: false });
      expect(await getBillingStatus(restaurantId)).toBeNull();
    });
  });

  // ─── Cluster 4: getRestaurantStatus ──────────────────────────────
  describe("getRestaurantStatus", () => {
    it("pilot mock válido retorna row do localStorage", async () => {
      const pilotRow = {
        id: restaurantId,
        onboarding_completed_at: "2024-01-01T00:00:00Z",
        billing_status: "trial",
        trial_ends_at: null,
      };
      vi.stubGlobal("window", {});
      (globalThis as any).localStorage = { getItem: vi.fn(() => JSON.stringify(pilotRow)) };

      const result = await getRestaurantStatus(restaurantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(restaurantId);
      expect(result?.onboarding_completed_at).toBe("2024-01-01T00:00:00Z");
      expect(result?.billing_status).toBe("trial");
    });

    it("pilot mock inválido (outro id) segue para fetch", async () => {
      const pilotRow = { id: "other-id", billing_status: "trial" };
      vi.stubGlobal("window", {});
      (globalThis as any).localStorage = { getItem: vi.fn(() => JSON.stringify(pilotRow)) };
      mockFetch({
        ok: true,
        text: async () => JSON.stringify([{ id: restaurantId, onboarding_completed_at: null, billing_status: "trial", trial_ends_at: null }]),
        headers: { get: () => "application/json" },
      });

      const result = await getRestaurantStatus(restaurantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(restaurantId);
    });

    it("retorna null quando res.ok = false", async () => {
      mockFetch({ ok: false, text: async () => "" });
      expect(await getRestaurantStatus(restaurantId)).toBeNull();
    });

    it("retorna null quando Content-Type sem application/json e body não vazio", async () => {
      mockFetch({
        ok: true,
        text: async () => '{"foo":1}',
        headers: { get: () => "text/plain" },
      });
      expect(await getRestaurantStatus(restaurantId)).toBeNull();
    });

    it("retorna null quando data = []", async () => {
      mockFetch({ ok: true, text: async () => "[]", headers: { get: () => "application/json" } });
      expect(await getRestaurantStatus(restaurantId)).toBeNull();
    });

    it("billing_status null quando status inválido", async () => {
      mockFetch({
        ok: true,
        text: async () =>
          JSON.stringify([
            { id: restaurantId, onboarding_completed_at: null, billing_status: "invalid", trial_ends_at: null },
          ]),
        headers: { get: () => "application/json" },
      });
      const result = await getRestaurantStatus(restaurantId);
      expect(result).not.toBeNull();
      expect(result?.billing_status).toBeNull();
    });

    it("retorna null quando JSON.parse lança", async () => {
      mockFetch({
        ok: true,
        text: async () => "not valid json",
        headers: { get: () => "application/json" },
      });
      expect(await getRestaurantStatus(restaurantId)).toBeNull();
    });
  });

  // ─── Cluster 5: getBillingConfig ─────────────────────────────────
  describe("getBillingConfig", () => {
    it("retorna null quando status 404", async () => {
      mockFetch({ ok: false, status: 404 });
      expect(await getBillingConfig(restaurantId)).toBeNull();
    });

    it("retorna null quando status 406", async () => {
      mockFetch({ ok: false, status: 406 });
      expect(await getBillingConfig(restaurantId)).toBeNull();
    });

    it("lança quando status 500", async () => {
      mockFetch({ ok: false, status: 500, statusText: "Internal Server Error" });
      await expect(getBillingConfig(restaurantId)).rejects.toThrow("Core billing config: 500");
    });
  });

  // ─── Cluster 6: setBillingConfig ─────────────────────────────────
  describe("setBillingConfig", () => {
    const config = {
      provider: "stripe" as const,
      currency: "EUR" as const,
      enabled: true,
    };

    it("retorna error null quando status 409", async () => {
      mockFetch({ ok: false, status: 409 });
      const result = await setBillingConfig(restaurantId, config);
      expect(result.error).toBeNull();
    });

    it("retorna error quando status 400", async () => {
      mockFetch({ ok: false, status: 400, text: async () => "Bad request" });
      const result = await setBillingConfig(restaurantId, config);
      expect(result.error).toContain("400");
    });
  });
});
