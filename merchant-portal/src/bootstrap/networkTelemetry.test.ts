import { describe, expect, it, vi } from "vitest";
import { initFetchTelemetry } from "./networkTelemetry";

describe("networkTelemetry", () => {
  it("records duration and errors for failed http responses", async () => {
    const distribution = vi.fn();
    const increment = vi.fn();
    const windowObj = {
      location: { origin: "http://localhost:5175" },
      fetch: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    };
    const performanceObj = {
      now: vi
        .fn(() => 10)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(15),
    } as unknown as Performance;

    initFetchTelemetry({
      metrics: {
        increment,
        distribution,
        gauge: vi.fn(),
      },
      windowObj,
      performanceObj,
    });

    await windowObj.fetch("/rest/v1/health");

    expect(distribution).toHaveBeenCalledWith("http.request_duration", 15, {
      unit: "millisecond",
      tags: {
        method: "GET",
        status: "503",
        path: "/rest/v1/health",
      },
    });
    expect(increment).toHaveBeenCalledWith("http.error", 1, {
      tags: { status: "503", path: "/rest/v1/health" },
    });
  });
});
