import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as BackendAdapterModule from "./backendAdapter";
import type * as DockerClientModule from "./dockerCoreFetchClient";

vi.mock("./backendAdapter", async () => {
  const actual = (await vi.importActual<
    typeof BackendAdapterModule
  >("./backendAdapter")) as typeof BackendAdapterModule;
  return {
    ...actual,
    getBackendType: vi.fn(),
  };
});

const dockerClientMock = {
  rpc: vi.fn(),
} as unknown as ReturnType<typeof import("./dockerCoreFetchClient").getDockerCoreFetchClient>;

vi.mock("./dockerCoreFetchClient", async () => {
  const actual = (await vi.importActual<
    typeof DockerClientModule
  >("./dockerCoreFetchClient")) as typeof DockerClientModule;
  return {
    ...actual,
    getDockerCoreFetchClient: vi.fn(() => dockerClientMock),
  };
});

describe("coreRpc", () => {
  let BackendType: typeof BackendAdapterModule.BackendType;
  let getBackendType: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const backendAdapter = (await import("./backendAdapter")) as typeof BackendAdapterModule;
    BackendType = backendAdapter.BackendType;
    getBackendType = backendAdapter
      .getBackendType as unknown as typeof getBackendType;
  });

  it("getTableClient lança erro quando backend não é Docker", async () => {
    getBackendType.mockReturnValue(BackendType.remote);
    const { getTableClient } = await import("./coreRpc");

    await expect(getTableClient()).rejects.toThrow(
      /Domain operations require Docker Core/i,
    );
  });

  it("getTableClient devolve DockerCore client quando backend é Docker", async () => {
    getBackendType.mockReturnValue(BackendType.docker);
    const { getTableClient } = await import("./coreRpc");

    const client = await getTableClient();
    expect(client).toBe(dockerClientMock);
  });

  it("invokeRpc delega em DockerCore rpc quando backend é Docker", async () => {
    getBackendType.mockReturnValue(BackendType.docker);
    dockerClientMock.rpc = vi
      .fn()
      .mockResolvedValue({ data: { ok: true }, error: null });

    const { invokeRpc } = await import("./coreRpc");

    const result = await invokeRpc("my_function", { a: 1 });

    expect(dockerClientMock.rpc).toHaveBeenCalledWith("my_function", { a: 1 });
    expect(result).toEqual({ data: { ok: true }, error: null });
  });

  it("invokeRpc lança erro quando backend não é Docker", async () => {
    getBackendType.mockReturnValue(BackendType.remote);
    const { invokeRpc } = await import("./coreRpc");

    await expect(invokeRpc("fn")).rejects.toThrow(
      /Domain operations require Docker Core/i,
    );
  });
});

