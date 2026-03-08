import { buildKdsMobileSummaryModel } from "../../features/manager/kdsMobileSummaryModel";

describe("buildKdsMobileSummaryModel", () => {
  it("builds queue metrics for active shift", () => {
    const model = buildKdsMobileSummaryModel({
      orders: [
        { id: "o1", status: "pending", total: 10, shiftId: "s1" },
        { id: "o2", status: "preparing", total: 12, shiftId: "s1" },
        { id: "o3", status: "ready", total: 18, shiftId: "s1" },
        { id: "o4", status: "paid", total: 22, shiftId: "s1" },
        { id: "o5", status: "pending", total: 8, shiftId: "s2" },
      ],
      shiftId: "s1",
    });

    expect(model.pending).toBe(1);
    expect(model.preparing).toBe(1);
    expect(model.ready).toBe(1);
    expect(model.activeQueue).toBe(2);
    expect(model.completed).toBe(2);
    expect(model.completionRate).toBe(50);
  });

  it("returns zero completion rate when there are no orders", () => {
    const model = buildKdsMobileSummaryModel({
      orders: [],
      shiftId: null,
    });

    expect(model.pending).toBe(0);
    expect(model.preparing).toBe(0);
    expect(model.ready).toBe(0);
    expect(model.activeQueue).toBe(0);
    expect(model.completed).toBe(0);
    expect(model.completionRate).toBe(0);
  });
});
