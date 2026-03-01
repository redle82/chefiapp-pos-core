import { describe, expect, it, vi } from "vitest";

import {
  getTenantIdFromRuntime,
  resolveTenantIdFromSources,
} from "./tenantAccess";

vi.mock("../tenant/TenantResolver", () => ({
  readTenantIdWithLegacyFallback: vi.fn(),
}));

import { readTenantIdWithLegacyFallback } from "../tenant/TenantResolver";

describe("tenantAccess", () => {
  it("prioritizes launchContext tenant", () => {
    const tenantId = resolveTenantIdFromSources({
      launchContextTenantId: "launch-tenant",
      explicitTenantId: "explicit-tenant",
      activeTenantId: "active-tenant",
      storageTenantId: "storage-tenant",
    });
    expect(tenantId).toBe("launch-tenant");
  });

  it("falls back to explicit -> active -> storage", () => {
    expect(
      resolveTenantIdFromSources({
        explicitTenantId: "explicit-tenant",
        activeTenantId: "active-tenant",
        storageTenantId: "storage-tenant",
      }),
    ).toBe("explicit-tenant");

    expect(
      resolveTenantIdFromSources({
        activeTenantId: "active-tenant",
        storageTenantId: "storage-tenant",
      }),
    ).toBe("active-tenant");

    expect(
      resolveTenantIdFromSources({
        storageTenantId: "storage-tenant",
      }),
    ).toBe("storage-tenant");
  });

  it("returns null when no source has tenant", () => {
    expect(resolveTenantIdFromSources({})).toBeNull();
  });

  it("reads from canonical resolver in runtime fallback", () => {
    vi.mocked(readTenantIdWithLegacyFallback).mockReturnValue("active-tenant");

    const tenantId = getTenantIdFromRuntime(null, null);
    expect(tenantId).toBe("active-tenant");
  });
});
