import { describe, expect, it } from "@jest/globals";

jest.mock("../../../core-engine/db", () => {
  const dbStub = { from: jest.fn() };
  return {
    db: dbStub,
    supabase: dbStub,
    coreClient: { kind: "docker-core" },
    coreNotImplemented: jest.fn(),
  };
});

describe("core-engine/supabase barrel (deprecated)", () => {
  it("reexports db and supabase from core-engine/db", async () => {
    const dbModule = await import("../../../core-engine/db");
    const barrel = await import("../../../core-engine/supabase");

    expect(barrel.db).toBe(dbModule.db);
    expect(barrel.supabase).toBe(dbModule.supabase);
  });

  it("reexports coreClient and coreNotImplemented from core-engine/db", async () => {
    const dbModule = await import("../../../core-engine/db");
    const barrel = await import("../../../core-engine/supabase");

    expect(barrel.coreClient).toBe(dbModule.coreClient);
    expect(barrel.coreNotImplemented).toBe(dbModule.coreNotImplemented);
  });
});

