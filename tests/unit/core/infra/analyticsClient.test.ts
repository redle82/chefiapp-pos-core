/**
 * analyticsClient — Unit tests (fallback Docker vs InsForge, health check).
 * Fase 2 Infra: fallback, health, latency warning.
 */

import {
  checkAnalyticsHealth,
  getAnalyticsClient,
  isInsforgeEnabled,
} from "../../../../merchant-portal/src/core/infra/analyticsClient";

jest.mock(
  "../../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
  () => ({
    getDockerCoreFetchClient: jest.fn(),
  })
);

import { getDockerCoreFetchClient } from "../../../../merchant-portal/src/core/infra/dockerCoreFetchClient";
const mockGetDockerCoreFetchClient = getDockerCoreFetchClient as jest.Mock;

jest.mock("../../../../merchant-portal/src/core/infra/insforgeClient", () => ({
  insforge: {
    database: {
      from: () => ({ select: () => ({ limit: () => Promise.resolve({ error: null }) }) }),
    },
  },
}));

describe("analyticsClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isInsforgeEnabled", () => {
    it("is false when CONFIG.INSFORGE_URL is unset (mock)", () => {
      expect(isInsforgeEnabled).toBe(false);
    });
  });

  describe("getAnalyticsClient", () => {
    it("returns Docker client when InsForge is not enabled", () => {
      const fakeClient = { from: jest.fn() };
      mockGetDockerCoreFetchClient.mockReturnValue(fakeClient);

      const client = getAnalyticsClient();

      expect(client).toBe(fakeClient);
      expect(mockGetDockerCoreFetchClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("checkAnalyticsHealth", () => {
    it("returns healthy when query succeeds", async () => {
      mockGetDockerCoreFetchClient.mockReturnValue({
        from: () => ({
          select: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      });

      const result = await checkAnalyticsHealth();

      expect(result.healthy).toBe(true);
      expect(result.backend).toBe("docker");
      expect(typeof result.latencyMs).toBe("number");
    });

    it("returns unhealthy when query returns error", async () => {
      mockGetDockerCoreFetchClient.mockReturnValue({
        from: () => ({
          select: () => ({
            limit: () =>
              Promise.resolve({
                data: null,
                error: { message: "permission denied" },
              }),
          }),
        }),
      });

      const result = await checkAnalyticsHealth();

      expect(result.healthy).toBe(false);
      expect(result.backend).toBe("docker");
      expect(typeof result.latencyMs).toBe("number");
    });

    it("returns unhealthy when query throws", async () => {
      mockGetDockerCoreFetchClient.mockReturnValue({
        from: () => ({
          select: () => ({
            limit: () => Promise.reject(new Error("network error")),
          }),
        }),
      });

      const result = await checkAnalyticsHealth();

      expect(result.healthy).toBe(false);
      expect(result.backend).toBe("docker");
      expect(typeof result.latencyMs).toBe("number");
    });
  });
});
