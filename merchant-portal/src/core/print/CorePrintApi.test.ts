import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInvokeRpc = vi.fn();

vi.mock("../infra/coreRpc", () => ({
  invokeRpc: (...args: unknown[]) => mockInvokeRpc(...args),
}));

import { getPrintJobStatus, requestPrint } from "./CorePrintApi";

describe("CorePrintApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a label print job", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: { job_id: "job-1", status: "pending" },
      error: null,
    });

    const result = await requestPrint({
      restaurantId: "rest-1",
      type: "receipt",
      orderId: null,
      payload: { profile_id: "profile-1" },
    });

    expect(mockInvokeRpc).toHaveBeenCalledWith("request_print", {
      p_restaurant_id: "rest-1",
      p_type: "receipt",
      p_order_id: null,
      p_payload: { profile_id: "profile-1" },
    });
    expect(result.error).toBeNull();
    expect(result.data?.job_id).toBe("job-1");
  });

  it("queries a print job status", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: { job_id: "job-1", status: "sent" },
      error: null,
    });

    const result = await getPrintJobStatus("job-1");

    expect(mockInvokeRpc).toHaveBeenCalledWith("get_print_job_status", {
      p_job_id: "job-1",
    });
    expect(result.error).toBeNull();
    expect(result.data?.status).toBe("sent");
  });

  it("propagates RPC errors when requesting print", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "rpc failed" },
    });

    const result = await requestPrint({
      restaurantId: "rest-1",
      type: "kitchen_ticket",
      orderId: "order-1",
      payload: {},
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("rpc failed");
  });
});
