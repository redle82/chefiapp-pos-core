import { describe, expect, it } from "vitest";
import { getRuntimeModeFromEnv } from "./RuntimeContext";

describe("RuntimeContext", () => {
  it("prefers explicit trial mode when VITE_RUNTIME_MODE=trial", () => {
    const mode = getRuntimeModeFromEnv({
      VITE_RUNTIME_MODE: "trial",
      NODE_ENV: "development",
    });
    expect(mode).toBe("trial");
  });

  it("returns production when VITE_RUNTIME_MODE=production", () => {
    const mode = getRuntimeModeFromEnv({
      VITE_RUNTIME_MODE: "production",
      NODE_ENV: "development",
    });
    expect(mode).toBe("production");
  });

  it("defaults to trial in development when not explicitly set", () => {
    const mode = getRuntimeModeFromEnv({ NODE_ENV: "development" });
    expect(mode).toBe("trial");
  });

  it("defaults to production when NODE_ENV=production", () => {
    const mode = getRuntimeModeFromEnv({ NODE_ENV: "production" });
    expect(mode).toBe("production");
  });
});
