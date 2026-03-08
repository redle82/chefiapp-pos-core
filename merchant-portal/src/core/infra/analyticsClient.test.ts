import { describe, expect, it, vi, beforeEach } from "vitest";

const dockerClientMock = {
  from: vi.fn(),
} as any;

const insforgeDbMock = {
  from: vi.fn(),
} as any;

let INSFORGE_URL_VALUE = "";

vi.mock("../../config", () => ({
  CONFIG: {
    get INSFORGE_URL() {
      return INSFORGE_URL_VALUE;
    },
  },
}));

vi.mock("../logger", () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: vi.fn(() => dockerClientMock),
}));

vi.mock("./insforgeClient", () => ({
  insforge: {
    database: insforgeDbMock,
  },
}));

describe("analyticsClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    INSFORGE_URL_VALUE = "";
  });

  it("usa Docker Core quando INSFORGE_URL não está configurado", async () => {
    const { getAnalyticsClient, isInsforgeEnabled } =
      await import("./analyticsClient");

    expect(isInsforgeEnabled).toBe(false);
    const client = getAnalyticsClient();
    expect(client).toBe(dockerClientMock);
  });

  it("checkAnalyticsHealth devolve healthy:true quando query não tem erro", async () => {
    dockerClientMock.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ error: null }),
    }));

    const { checkAnalyticsHealth } = await import("./analyticsClient");

    const result = await checkAnalyticsHealth();

    expect(result.healthy).toBe(true);
    expect(result.backend).toBe("docker");
    expect(typeof result.latencyMs).toBe("number");
  });

  it("checkAnalyticsHealth devolve healthy:false quando query devolve erro", async () => {
    dockerClientMock.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ error: { message: "bad" } }),
    }));

    const { checkAnalyticsHealth } = await import("./analyticsClient");

    const result = await checkAnalyticsHealth();

    expect(result.healthy).toBe(false);
  });

  it("checkAnalyticsHealth devolve healthy:false quando há exceção", async () => {
    dockerClientMock.from = vi.fn(() => {
      throw new Error("offline");
    });

    const { checkAnalyticsHealth } = await import("./analyticsClient");

    const result = await checkAnalyticsHealth();

    expect(result.healthy).toBe(false);
  });
});

