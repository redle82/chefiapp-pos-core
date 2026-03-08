import { describe, expect, it, vi } from "vitest";
import { getBuildStamp, logBuildStamp } from "./buildStamp";

describe("buildStamp", () => {
  it("builds a stamp with mode and timestamp", () => {
    expect(getBuildStamp("production", "1234")).toBe(
      "chefiapp-build:production:1234",
    );
  });

  it("falls back to dev when timestamp is missing", () => {
    expect(getBuildStamp("development", undefined)).toBe(
      "chefiapp-build:development:dev",
    );
  });

  it("logs the stamp and returns it", () => {
    const log = { log: vi.fn() };
    const stamp = logBuildStamp({ mode: "test", buildTimestamp: "abc", log });
    expect(stamp).toBe("chefiapp-build:test:abc");
    expect(log.log).toHaveBeenCalledWith(
      "%c[ChefIApp] chefiapp-build:test:abc",
      "color: #f59e0b; font-weight: bold",
    );
  });
});
