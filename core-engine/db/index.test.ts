import { describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const rpcMock = vi.fn();
const channelMock = vi.fn(() => ({ unsubscribe: vi.fn() }));

vi.mock("../infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: () => ({
    from: fromMock,
    rpc: rpcMock,
    channel: channelMock,
  }),
}));

describe("core-engine/db", () => {
  it("db delega from/rpc/channel para o cliente Docker Core", async () => {
    const { db } = await import("./index");

    fromMock.mockReturnValue({ select: vi.fn() });
    rpcMock.mockResolvedValue({ data: null, error: null });

    db.from("gm_orders");
    await db.rpc("fn_test", { a: 1 });
    db.channel("realtime:gm_orders");

    expect(fromMock).toHaveBeenCalledWith("gm_orders");
    expect(rpcMock).toHaveBeenCalledWith("fn_test", { a: 1 });
    expect(channelMock).toHaveBeenCalledWith("realtime:gm_orders");
  });

  it("db.functions.invoke rejeita com erro explícito", async () => {
    const { db } = await import("./index");

    await expect(db.functions.invoke("fn")).rejects.toThrow(
      /Use Core endpoint for serverless functions/i,
    );
  });

  it("auth expõe métodos básicos sem falhar", async () => {
    const { db } = await import("./index");

    const session = await db.auth.getSession();
    const user = await db.auth.getUser();
    const unsubscribe = db.auth.onAuthStateChange(() => {}).data.subscription
      .unsubscribe;

    expect(session.data.session).toBeNull();
    expect(user.data.user).toBeNull();
    expect(typeof unsubscribe).toBe("function");
  });

  it("supabase é alias de db e coreNotImplemented lança erro", async () => {
    const { db, supabase, coreNotImplemented } = await import("./index");

    expect(supabase).toBe(db);
    await expect(coreNotImplemented("x")).rejects.toThrow(/CORE TODO: x/);
  });
});

