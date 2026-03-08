import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInvokeRpc = vi.fn();

vi.mock("../infra/coreRpc", () => ({
  invokeRpc: (...args: unknown[]) => mockInvokeRpc(...args),
}));

import {
  listPrinterAssignments,
  resolvePrinterAssignment,
  upsertPrinterAssignment,
} from "./PrinterAssignmentsApi";

describe("PrinterAssignmentsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists assignments by restaurant and station", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: [
        {
          id: "a-1",
          restaurant_id: "rest-1",
          station_id: "st-1",
          print_function: "kitchen",
          transport: "tcp9100",
          target: "192.168.0.20:9100",
          is_enabled: true,
          updated_at: "2026-03-02T10:00:00.000Z",
        },
      ],
      error: null,
    });

    const result = await listPrinterAssignments({
      restaurantId: "rest-1",
      stationId: "st-1",
    });

    expect(mockInvokeRpc).toHaveBeenCalledWith("list_printer_assignments", {
      p_restaurant_id: "rest-1",
      p_station_id: "st-1",
    });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("upserts assignment with expected payload", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: { id: "a-1" },
      error: null,
    });

    const result = await upsertPrinterAssignment({
      restaurantId: "rest-1",
      stationId: "st-1",
      printFunction: "labels",
      transport: "spooler",
      target: "MUNBYN_LABEL_1",
      displayName: "Etiquetas produção",
      isEnabled: true,
      metadata: { paper: "4x6" },
    });

    expect(mockInvokeRpc).toHaveBeenCalledWith("upsert_printer_assignment", {
      p_restaurant_id: "rest-1",
      p_station_id: "st-1",
      p_print_function: "labels",
      p_transport: "spooler",
      p_target: "MUNBYN_LABEL_1",
      p_display_name: "Etiquetas produção",
      p_is_enabled: true,
      p_metadata: { paper: "4x6" },
    });
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("a-1");
  });

  it("resolves assignment for print function", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: {
        found: true,
        assignment: {
          id: "a-2",
          restaurant_id: "rest-1",
          station_id: null,
          print_function: "receipt",
          transport: "spooler",
          target: "EPSON_TM_M30II",
          is_enabled: true,
          updated_at: "2026-03-02T10:01:00.000Z",
        },
      },
      error: null,
    });

    const result = await resolvePrinterAssignment({
      restaurantId: "rest-1",
      printFunction: "receipt",
      stationId: "st-1",
    });

    expect(mockInvokeRpc).toHaveBeenCalledWith("resolve_printer_assignment", {
      p_restaurant_id: "rest-1",
      p_print_function: "receipt",
      p_station_id: "st-1",
    });
    expect(result.error).toBeNull();
    expect(result.data?.found).toBe(true);
  });
});
