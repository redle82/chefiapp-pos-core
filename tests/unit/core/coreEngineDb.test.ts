import { describe, expect, it, jest } from "@jest/globals";

const fromMock = jest.fn();
const rpcMock = jest.fn();
const channelMock = jest.fn(() => ({ unsubscribe: jest.fn() }));

jest.mock("../../../core-engine/infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: () => ({
    from: fromMock,
    rpc: rpcMock,
    channel: channelMock,
  }),
}));

describe("core-engine/db integration with Core client", () => {
  it("delegates db methods to Docker Core client", async () => {
    const { db } = await import("../../../core-engine/db");

    fromMock.mockReturnValue({ select: jest.fn() });
    (rpcMock as any).mockResolvedValue({ data: { ok: true }, error: null });

    db.from("gm_orders");
    await db.rpc("my_fn", { x: 1 });
    db.channel("realtime:gm_orders");

    expect(fromMock).toHaveBeenCalledWith("gm_orders");
    expect(rpcMock).toHaveBeenCalledWith("my_fn", { x: 1 });
    expect(channelMock).toHaveBeenCalledWith("realtime:gm_orders");
  });

  it("auth helpers and supabase alias behave as expected", async () => {
    const { db, supabase, coreClient, coreNotImplemented } = await import(
      "../../../core-engine/db"
    );

    expect(supabase).toBe(db);
    expect(coreClient.kind).toBe("docker-core");

    const session = await db.auth.getSession();
    const user = await db.auth.getUser();
    const subscription = db.auth.onAuthStateChange().data.subscription;

    expect(session.data.session).toBeNull();
    expect(user.data.user).toBeNull();
    expect(typeof subscription.unsubscribe).toBe("function");

    await expect(coreNotImplemented("feature-x")).rejects.toThrow(
      /CORE TODO: feature-x/,
    );
  });
});

