import { buildOwnerSectorSummaryModel } from "../../features/manager/ownerSectorSummaryModel";

describe("buildOwnerSectorSummaryModel", () => {
  it("computes per-sector counters", () => {
    const model = buildOwnerSectorSummaryModel({
      sector: "kitchen",
      shiftId: "s1",
      tasks: [
        { id: "t1", status: "pending", priority: "attention" },
        { id: "t2", status: "in_progress", priority: "urgent" },
        { id: "t3", status: "done", priority: "critical" },
      ],
      orders: [
        { id: "o1", status: "pending", total: 10, shiftId: "s1" },
        { id: "o2", status: "ready", total: 15, shiftId: "s1" },
        { id: "o3", status: "paid", total: 20, shiftId: "s2" },
      ],
    });

    expect(model.title).toBe("Setor kitchen");
    expect(model.openTasks).toBe(2);
    expect(model.urgentOpenTasks).toBe(1);
    expect(model.orderQueue).toBe(1);
    expect(model.readyOrders).toBe(1);
    expect(model.revenue).toBe(25);
  });
});
