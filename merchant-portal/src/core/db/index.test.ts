/**
 * Tests for core/db (stub branch when Core is unavailable).
 * Covers db.from, db.rpc, db.channel, db.auth, getCoreClient, coreNotImplemented.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DB_UNAVAILABLE_MSG = "db is not available in this environment (e.g. test).";

describe("core/db (stub branch)", () => {
  let mod: typeof import("./index");

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock("../auth/getCoreSession", () => ({
      getCoreSessionAsync: () => Promise.resolve(null),
    }));
    vi.doMock("../infra/dockerCoreFetchClient", () => ({
      getDockerCoreFetchClient: () => {
        throw new Error("Core not available in test");
      },
    }));
    mod = await import("./index");
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("db.from() throws when stub", () => {
    expect(() => mod.db.from("gm_orders")).toThrow(DB_UNAVAILABLE_MSG);
  });

  it("db.rpc() rejects when stub", async () => {
    await expect(mod.db.rpc("fn")).rejects.toThrow(DB_UNAVAILABLE_MSG);
  });

  it("db.channel() throws when stub", () => {
    expect(() => mod.db.channel("public", { event: "*" })).toThrow(
      DB_UNAVAILABLE_MSG
    );
  });

  it("db.removeChannel() resolves when stub", async () => {
    await expect(mod.db.removeChannel()).resolves.toBeUndefined();
  });

  it("db.functions.invoke() rejects when stub", async () => {
    await expect(mod.db.functions.invoke("fn")).rejects.toThrow(
      DB_UNAVAILABLE_MSG
    );
  });

  it("db.auth.getSession() rejects when stub", async () => {
    await expect(mod.db.auth.getSession()).rejects.toThrow(DB_UNAVAILABLE_MSG);
  });

  it("db.auth.getUser() rejects when stub", async () => {
    await expect(mod.db.auth.getUser()).rejects.toThrow(DB_UNAVAILABLE_MSG);
  });

  it("db.auth.onAuthStateChange() returns subscription when stub", () => {
    const result = mod.db.auth.onAuthStateChange(() => {});
    expect(result.data.subscription).toBeDefined();
    expect(typeof result.data.subscription.unsubscribe).toBe("function");
  });

  it("db.auth.signInWithPassword rejects when stub", async () => {
    await expect(
      mod.db.auth.signInWithPassword({ email: "", password: "" })
    ).rejects.toThrow("Use getAuthActions().signIn()");
  });

  it("db.auth.signOut rejects when stub", async () => {
    await expect(mod.db.auth.signOut()).rejects.toThrow(
      "Use getAuthActions().signOut()"
    );
  });

  it("supabase is alias of db", () => {
    expect(mod.supabase).toBe(mod.db);
  });

  it("coreNotImplemented warns and throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(mod.coreNotImplemented("foo")).rejects.toThrow(
      "CORE: foo not implemented. Use Core client.",
    );
    expect(warn).toHaveBeenCalledWith(
      "[warn]",
      "[CORE] Legacy: foo not implemented. Use Core client.",
      {},
    );
    warn.mockRestore();
  });

  it("coreClient has kind docker-core", () => {
    expect(mod.coreClient.kind).toBe("docker-core");
  });
});
