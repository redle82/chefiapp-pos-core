import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CoreClient } from "./coreClient";

vi.mock("./dockerCoreFetchClient", () => {
  const clientMock = {
    from: vi.fn(),
  } as unknown as CoreClient;

  return {
    getDockerCoreFetchClient: vi.fn(() => clientMock),
  };
});

vi.mock("../logger", () => ({
  Logger: {
    error: vi.fn(),
  },
}));

describe("coreClient", () => {
  let clientMock: CoreClient;

  beforeEach(async () => {
    vi.resetModules();
    const { getDockerCoreFetchClient } = await import("./dockerCoreFetchClient");
    clientMock = getDockerCoreFetchClient() as unknown as CoreClient;
  });

  it("getCoreClient devolve sempre o cliente Docker Core", async () => {
    const { getCoreClient } = await import("./coreClient");

    const client = getCoreClient();

    expect(client).toBe(clientMock);
  });

  it("checkCoreHealth devolve true quando query simples não devolve erro", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ error: null }),
    };
    (clientMock as any).from = vi.fn(() => chain);

    const { checkCoreHealth } = await import("./coreClient");

    const healthy = await checkCoreHealth();

    expect((clientMock as any).from).toHaveBeenCalledWith("gm_restaurants");
    expect(healthy).toBe(true);
  });

  it("checkCoreHealth devolve false quando há erro na query", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ error: { message: "boom" } }),
    };
    (clientMock as any).from = vi.fn(() => chain);

    const { checkCoreHealth } = await import("./coreClient");

    const healthy = await checkCoreHealth();

    expect(healthy).toBe(false);
  });

  it("checkCoreHealth devolve false e faz log quando o cliente lança exceção", async () => {
    (clientMock as any).from = vi.fn(() => {
      throw new Error("network down");
    });

    const { Logger } = await import("../logger");
    const { checkCoreHealth } = await import("./coreClient");

    const healthy = await checkCoreHealth();

    expect(healthy).toBe(false);
    expect(Logger.error).toHaveBeenCalled();
  });
});

