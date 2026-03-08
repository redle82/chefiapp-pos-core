import { beforeEach, describe, expect, it, vi } from "vitest";
import { orderExistsInCore } from "../infra/CoreOrdersApi";
import { requestPrint } from "./CorePrintApi";
import { PrintQueue } from "./PrintQueue";
import { processPrintQueue } from "./PrintQueueProcessor";

vi.mock("../infra/CoreOrdersApi", () => ({
  orderExistsInCore: vi.fn(),
}));

vi.mock("./CorePrintApi", () => ({
  requestPrint: vi.fn(),
}));

vi.mock("./PrintQueue", () => ({
  PrintQueue: {
    getPending: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("../fiscal/FiscalPrinter", () => ({
  FiscalPrinter: class MockFiscalPrinter {
    printKitchenTicket = vi.fn().mockResolvedValue(undefined);
  },
}));

describe("PrintQueueProcessor", () => {
  const orderExistsInCoreMock = vi.mocked(orderExistsInCore);
  const requestPrintMock = vi.mocked(requestPrint);

  beforeEach(() => {
    vi.clearAllMocks();
    orderExistsInCoreMock.mockResolvedValue(true);
  });

  it("processes pending job when order exists in Core", async () => {
    const job = {
      id: "job-1",
      type: "kitchen_ticket" as const,
      orderId: "ord-1",
      restaurantId: "res-1",
      payload: { tableNumber: "5", items: [] },
      status: "pending" as const,
      createdAt: Date.now(),
      attempts: 0,
    };
    (PrintQueue.getPending as any).mockResolvedValue([job]);
    requestPrintMock.mockResolvedValue({ data: { status: "sent" }, error: null });

    await processPrintQueue();

    expect(orderExistsInCoreMock).toHaveBeenCalledWith("ord-1");
    expect(requestPrintMock).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "ord-1", restaurantId: "res-1" })
    );
  });

  it("print dependency: does NOT process job when order does not exist in Core", async () => {
    const job = {
      id: "job-2",
      type: "kitchen_ticket" as const,
      orderId: "ord-not-synced",
      restaurantId: "res-1",
      payload: {},
      status: "pending" as const,
      createdAt: Date.now(),
      attempts: 0,
    };
    (PrintQueue.getPending as any).mockResolvedValue([job]);
    orderExistsInCoreMock.mockResolvedValue(false);

    await processPrintQueue();

    expect(orderExistsInCoreMock).toHaveBeenCalledWith("ord-not-synced");
    expect(requestPrintMock).not.toHaveBeenCalled();
    expect(PrintQueue.updateStatus).not.toHaveBeenCalled();
  });

  it("processes job without orderId (e.g. z_report) without checking order", async () => {
    const job = {
      id: "job-3",
      type: "z_report" as const,
      orderId: "",
      restaurantId: "res-1",
      payload: {},
      status: "pending" as const,
      createdAt: Date.now(),
      attempts: 0,
    };
    (PrintQueue.getPending as any).mockResolvedValue([job]);
    requestPrintMock.mockResolvedValue({ data: { status: "sent" }, error: null });

    await processPrintQueue();

    expect(orderExistsInCoreMock).not.toHaveBeenCalled();
    expect(requestPrintMock).toHaveBeenCalled();
  });
});
