/**
 * coreRpc — Unit tests (backend guard, getTableClient, invokeRpc).
 * Fase 2 Infra: Supabase RPC wrappers; throws when backend is not Docker.
 */

import { BackendType } from "../../../../merchant-portal/src/core/infra/backendAdapter";
import {
  getTableClient,
  invokeRpc,
} from "../../../../merchant-portal/src/core/infra/coreRpc";

const mockGetBackendType = jest.fn();
const mockGetDockerCoreFetchClient = jest.fn();

jest.mock(
  "../../../../merchant-portal/src/core/infra/backendAdapter",
  () => ({
    BackendType: { docker: "docker", none: "none" },
    getBackendType: (...args: unknown[]) => mockGetBackendType(...args),
  })
);

jest.mock(
  "../../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
  () => ({
    getDockerCoreFetchClient: (...args: unknown[]) =>
      mockGetDockerCoreFetchClient(...args),
  })
);

describe("coreRpc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTableClient", () => {
    it("throws when backend is not Docker", async () => {
      mockGetBackendType.mockReturnValue(BackendType.none);

      await expect(getTableClient()).rejects.toThrow(
        /Domain operations require Docker Core/
      );
      expect(mockGetDockerCoreFetchClient).not.toHaveBeenCalled();
    });

    it("returns table client when backend is Docker", async () => {
      const fakeClient = { from: jest.fn(), rpc: jest.fn() };
      mockGetBackendType.mockReturnValue(BackendType.docker);
      mockGetDockerCoreFetchClient.mockReturnValue(fakeClient);

      const client = await getTableClient();

      expect(client).toBe(fakeClient);
      expect(mockGetDockerCoreFetchClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("invokeRpc", () => {
    it("throws when backend is not Docker", async () => {
      mockGetBackendType.mockReturnValue(BackendType.none);

      await expect(
        invokeRpc("some_rpc", { id: "x" })
      ).rejects.toThrow(/Domain operations require Docker Core/);
      expect(mockGetDockerCoreFetchClient).not.toHaveBeenCalled();
    });

    it("invokes rpc and returns result when backend is Docker", async () => {
      const rpcResult = { data: { ok: true }, error: null };
      const fakeClient = {
        rpc: jest.fn().mockResolvedValue(rpcResult),
      };
      mockGetBackendType.mockReturnValue(BackendType.docker);
      mockGetDockerCoreFetchClient.mockReturnValue(fakeClient);

      const result = await invokeRpc("sync_stripe_subscription_from_event", {
        p_tenant_id: "t1",
        p_event_id: "ev_1",
      });

      expect(result).toEqual(rpcResult);
      expect(fakeClient.rpc).toHaveBeenCalledWith(
        "sync_stripe_subscription_from_event",
        { p_tenant_id: "t1", p_event_id: "ev_1" }
      );
    });
  });
});
