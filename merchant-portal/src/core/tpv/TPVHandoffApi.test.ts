import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInvokeRpc = vi.fn();

vi.mock("../infra/coreRpc", () => ({
  invokeRpc: (...args: unknown[]) => mockInvokeRpc(...args),
}));

import {
  createTPVHandoff,
  listTPVHandoffs,
  markTPVHandoffStatus,
} from "./TPVHandoffApi";

describe("TPVHandoffApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a handoff request", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: { id: "h-1", status: "pending" },
      error: null,
    });

    const result = await createTPVHandoff({
      restaurantId: "rest-1",
      tableId: "table-1",
      tableNumber: 12,
      waiterId: "waiter-1",
      waiterName: "João",
      totalEstimatedCents: 2590,
      notes: "Enviar para caixa",
    });

    expect(mockInvokeRpc).toHaveBeenCalledWith("create_tpv_handoff", {
      p_restaurant_id: "rest-1",
      p_table_id: "table-1",
      p_table_number: 12,
      p_waiter_id: "waiter-1",
      p_waiter_name: "João",
      p_total_estimated_cents: 2590,
      p_notes: "Enviar para caixa",
    });
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("h-1");
  });

  it("lists pending handoffs", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: [{ id: "h-1", status: "pending" }],
      error: null,
    });

    const result = await listTPVHandoffs("rest-1", "pending");

    expect(mockInvokeRpc).toHaveBeenCalledWith("list_tpv_handoffs", {
      p_restaurant_id: "rest-1",
      p_status: "pending",
    });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("marks handoff as closed", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: { ok: true },
      error: null,
    });

    const result = await markTPVHandoffStatus({
      handoffId: "h-1",
      status: "closed",
      notes: "Pago no caixa central",
    });

    expect(mockInvokeRpc).toHaveBeenCalledWith("mark_tpv_handoff_status", {
      p_handoff_id: "h-1",
      p_status: "closed",
      p_notes: "Pago no caixa central",
    });
    expect(result.error).toBeNull();
    expect(result.data?.ok).toBe(true);
  });
});
