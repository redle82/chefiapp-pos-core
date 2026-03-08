import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => {
  const dbStub = {
    from: vi.fn(),
  };
  const getCoreClient = vi.fn(() => dbStub);
  return {
    db: dbStub,
    supabase: dbStub,
    coreClient: { kind: "docker-core" },
    getCoreClient,
    coreNotImplemented: vi.fn(),
  };
});

describe("core/supabase barrel (deprecated)", () => {
  it("reexporta db como supabase para retrocompatibilidade", async () => {
    const { db, supabase } = await import("../db");
    const supabaseBarrel = await import("./index");

    expect(supabaseBarrel.db).toBe(db);
    expect(supabaseBarrel.supabase).toBe(supabase);
  });

  it("reexporta coreClient e getCoreClient de core/db", async () => {
    const { coreClient, getCoreClient } = await import("../db");
    const barrel = await import("./index");

    expect(barrel.coreClient).toBe(coreClient);
    expect(barrel.getCoreClient).toBe(getCoreClient);
  });
});

