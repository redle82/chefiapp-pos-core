/**
 * Fase 3 conformance: devicesApi must use Core RPC for provisioning.
 * - consumeInstallToken calls coreClient.rpc("consume_device_install_token", …)
 * - No direct db or alternate client; authority stays in Core.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumeInstallToken } from "./devicesApi";

vi.mock("../../../../core/infra/coreClient", () => ({
  coreClient: {
    rpc: vi.fn(),
  },
}));

vi.mock("../../../../core/logger", () => ({
  Logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe("devicesApi — Fase 3 conformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consumeInstallToken uses coreClient.rpc(consume_device_install_token) with p_token and p_device_meta", async () => {
    const { coreClient } = await import("../../../../core/infra/coreClient");
    (coreClient.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          id: "term-1",
          restaurant_id: "rest-1",
          type: "TPV",
          name: "TPV_01",
          registered_at: new Date().toISOString(),
          last_heartbeat_at: null,
          last_seen_at: null,
          status: "active",
          metadata: {},
        },
      ],
      error: null,
    });

    await consumeInstallToken("abc123token", {
      userAgent: "test",
      screen: "800x600",
    });

    expect(coreClient.rpc).toHaveBeenCalledTimes(1);
    expect(coreClient.rpc).toHaveBeenCalledWith(
      "consume_device_install_token",
      expect.objectContaining({
        p_token: "abc123token",
        p_device_meta: expect.objectContaining({
          userAgent: "test",
          screen: "800x600",
        }),
      }),
    );
  });
});
