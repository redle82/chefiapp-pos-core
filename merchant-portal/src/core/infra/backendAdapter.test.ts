/**
 * backendAdapter — getBackendType, isDockerBackend, isBackendNone
 */

import { describe, expect, it, vi } from "vitest";
import {
  BackendType,
  getBackendConfigured,
  getBackendHealthCheckBaseUrl,
  getBackendType,
  isBackendNone,
  isDockerBackend,
} from "./backendAdapter";

describe("backendAdapter", () => {
  it("BackendType enum has docker and none", () => {
    expect(BackendType.docker).toBe("docker");
    expect(BackendType.none).toBe("none");
  });

  it("isDockerBackend is consistent with getBackendType", () => {
    const type = getBackendType();
    expect(isDockerBackend()).toBe(type === BackendType.docker);
  });

  it("isBackendNone is opposite of isDockerBackend when backend is docker", () => {
    const type = getBackendType();
    expect(isBackendNone()).toBe(type === BackendType.none);
  });

  it("getBackendType returns docker or none", () => {
    const type = getBackendType();
    expect([BackendType.docker, BackendType.none]).toContain(type);
  });

  it("returns none/configured=false when NODE_ENV=production and no core URL", () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevCoreUrl = process.env.VITE_CORE_URL;
    const prevSupaUrl = process.env.VITE_SUPABASE_URL;

    process.env.NODE_ENV = "production";
    delete process.env.VITE_CORE_URL;
    delete process.env.VITE_SUPABASE_URL;

    expect(getBackendConfigured()).toBe(false);
    expect(getBackendType()).toBe(BackendType.none);

    process.env.NODE_ENV = prevNodeEnv;
    process.env.VITE_CORE_URL = prevCoreUrl;
    process.env.VITE_SUPABASE_URL = prevSupaUrl;
  });

  it("getBackendHealthCheckBaseUrl uses window.origin when backend is docker", () => {
    const origin = "http://localhost:5175";
    vi.stubGlobal("window", { location: { origin } });

    const prevCoreUrl = process.env.VITE_CORE_URL;
    process.env.VITE_CORE_URL = "http://localhost:3001";

    expect(getBackendType()).toBe(BackendType.docker);
    expect(getBackendHealthCheckBaseUrl()).toBe(origin);

    process.env.VITE_CORE_URL = prevCoreUrl;
  });

  it("getBackendType stays docker for frontend origin URL branch", () => {
    const origin = "http://localhost:5175";
    vi.stubGlobal("window", { location: { origin } });

    const prevNodeEnv = process.env.NODE_ENV;
    const prevCoreUrl = process.env.VITE_CORE_URL;
    process.env.NODE_ENV = "development";
    process.env.VITE_CORE_URL = origin;

    expect(getBackendType()).toBe(BackendType.docker);

    process.env.NODE_ENV = prevNodeEnv;
    process.env.VITE_CORE_URL = prevCoreUrl;
  });

  it("getBackendHealthCheckBaseUrl returns raw localhost URL when no window is available", () => {
    const prevWindow = (globalThis as any).window;
    const prevCoreUrl = process.env.VITE_CORE_URL;

    (globalThis as any).window = undefined;
    process.env.VITE_CORE_URL = "http://localhost:3001";

    expect(getBackendHealthCheckBaseUrl()).toBe("http://localhost:3001");

    (globalThis as any).window = prevWindow;
    process.env.VITE_CORE_URL = prevCoreUrl;
  });

  it("getBackendHealthCheckBaseUrl returns empty for non-localhost URL", () => {
    const prevWindow = (globalThis as any).window;
    const prevCoreUrl = process.env.VITE_CORE_URL;

    (globalThis as any).window = undefined;
    process.env.VITE_CORE_URL = "https://api.example.com";

    expect(getBackendHealthCheckBaseUrl()).toBe("");

    (globalThis as any).window = prevWindow;
    process.env.VITE_CORE_URL = prevCoreUrl;
  });

  // --- ROI Cluster 1: getRawBaseUrl (L29, 34, 36) ---
  it("getRawBaseUrl uses import.meta.env.VITE_SUPABASE_URL when VITE_CORE_URL absent", async () => {
    vi.stubEnv("VITE_CORE_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "http://localhost:3001");
    vi.resetModules();

    const mod = await import("./backendAdapter");
    expect(mod.getBackendConfigured()).toBe(true);
    expect(mod.getBackendType()).toBe(BackendType.docker);

    vi.resetModules();
  });

  it("getRawBaseUrl uses process.env.VITE_CORE_URL when import.meta vars absent", async () => {
    vi.stubEnv("VITE_CORE_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    const prevCore = process.env.VITE_CORE_URL;
    const prevSupa = process.env.VITE_SUPABASE_URL;
    process.env.VITE_CORE_URL = "http://localhost:3001";
    delete process.env.VITE_SUPABASE_URL;
    vi.resetModules();

    const mod = await import("./backendAdapter");
    expect(mod.getBackendType()).toBe(BackendType.docker);

    process.env.VITE_CORE_URL = prevCore;
    process.env.VITE_SUPABASE_URL = prevSupa;
    vi.resetModules();
  });

  it("getRawBaseUrl uses process.env.VITE_SUPABASE_URL when VITE_CORE_URL absent", async () => {
    vi.stubEnv("VITE_CORE_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    const prevCore = process.env.VITE_CORE_URL;
    const prevSupa = process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_CORE_URL;
    process.env.VITE_SUPABASE_URL = "http://localhost:3001";
    vi.resetModules();

    const mod = await import("./backendAdapter");
    expect(mod.getBackendType()).toBe(BackendType.docker);

    process.env.VITE_CORE_URL = prevCore;
    process.env.VITE_SUPABASE_URL = prevSupa;
    vi.resetModules();
  });

  // --- ROI Cluster 2: getUrl (L48) ---
  it("getUrl returns /rest when no URL and NODE_ENV not production", () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevCoreUrl = process.env.VITE_CORE_URL;
    const prevSupaUrl = process.env.VITE_SUPABASE_URL;

    process.env.NODE_ENV = "development";
    delete process.env.VITE_CORE_URL;
    delete process.env.VITE_SUPABASE_URL;

    expect(getBackendConfigured()).toBe(true);
    expect(getBackendType()).toBe(BackendType.docker);

    process.env.NODE_ENV = prevNodeEnv;
    process.env.VITE_CORE_URL = prevCoreUrl;
    process.env.VITE_SUPABASE_URL = prevSupaUrl;
  });

  // --- ROI Cluster 3: getBackendType window/origin (L97) ---
  it("getBackendType returns docker when url contains :5175", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:5175" } });

    const prevCoreUrl = process.env.VITE_CORE_URL;
    process.env.VITE_CORE_URL = "http://localhost:5175";

    expect(getBackendType()).toBe(BackendType.docker);

    process.env.VITE_CORE_URL = prevCoreUrl;
  });

  it("getBackendType returns docker when url equals window.location.origin", () => {
    const origin = "https://app.example.com";
    vi.stubGlobal("window", { location: { origin } });

    const prevCoreUrl = process.env.VITE_CORE_URL;
    process.env.VITE_CORE_URL = origin;

    expect(getBackendType()).toBe(BackendType.docker);

    process.env.VITE_CORE_URL = prevCoreUrl;
  });

  // --- ROI Cluster 4: DOCKER_INDICATORS /rest (L92) ---
  it("getBackendType returns docker when url includes /rest", () => {
    const prevCoreUrl = process.env.VITE_CORE_URL;
    process.env.VITE_CORE_URL = "https://api.example.com/rest";

    expect(getBackendType()).toBe(BackendType.docker);

    process.env.VITE_CORE_URL = prevCoreUrl;
  });

  it("getBackendType returns docker for DOCKER_INDICATORS 127.0.0.1:3001", () => {
    const prevCoreUrl = process.env.VITE_CORE_URL;
    process.env.VITE_CORE_URL = "http://127.0.0.1:3001";

    expect(getBackendType()).toBe(BackendType.docker);

    process.env.VITE_CORE_URL = prevCoreUrl;
  });
});
