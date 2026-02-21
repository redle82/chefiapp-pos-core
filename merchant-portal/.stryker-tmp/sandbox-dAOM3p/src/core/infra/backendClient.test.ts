// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest";

const mockDockerClient = { from: vi.fn() };
const mockInsforgeDb = { from: vi.fn() };

async function setup(insforgeUrl: string) {
  vi.resetModules();
  vi.doMock("../../config", () => ({
    CONFIG: {
      INSFORGE_URL: insforgeUrl,
      INSFORGE_ANON_KEY: "",
    },
  }));
  vi.doMock("./dockerCoreFetchClient", () => ({
    getDockerCoreFetchClient: () => mockDockerClient,
  }));
  vi.doMock("./insforgeClient", () => ({
    insforge: { database: mockInsforgeDb },
  }));
  return import("./backendClient");
}

describe("backendClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("uses Docker Core when INSFORGE_URL is empty", async () => {
    const mod = await setup("");
    expect(mod.backendClient).toBe(mockDockerClient);
  });

  it("uses InsForge when INSFORGE_URL is set", async () => {
    const mod = await setup("https://example.insforge.app");
    expect(mod.backendClient).toBe(mockInsforgeDb);
  });

  it("aliases dockerCoreClient to backendClient", async () => {
    const mod = await setup("");
    const connection = await import(
      "../../infra/docker-core/connection"
    );
    expect(connection.dockerCoreClient).toBe(mod.backendClient);
  });
});
