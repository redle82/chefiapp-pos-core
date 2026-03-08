import { buildOperationSummaryModel } from "../../features/manager/operationSummaryModel";

describe("buildOperationSummaryModel", () => {
  it("builds operation metrics with pending/preparing queue and urgent tasks", () => {
    const model = buildOperationSummaryModel({
      orders: [
        { id: "o1", status: "pending", total: 10, shiftId: "s1" },
        { id: "o2", status: "preparing", total: 12, shiftId: "s1" },
        { id: "o3", status: "ready", total: 15, shiftId: "s1" },
        { id: "o4", status: "paid", total: 20, shiftId: "s2" },
      ],
      tasks: [
        { id: "t1", status: "pending", priority: "urgent" },
        { id: "t2", status: "done", priority: "attention" },
        { id: "t3", status: "in_progress", priority: "critical" },
      ],
      shiftId: "s1",
    });

    expect(model.queue).toBe(2);
    expect(model.ready).toBe(1);
    expect(model.paid).toBe(0);
    expect(model.revenue).toBe(37);
    expect(model.pendingTasks).toBe(2);
    expect(model.urgentTasks).toBe(2);
  });
});
