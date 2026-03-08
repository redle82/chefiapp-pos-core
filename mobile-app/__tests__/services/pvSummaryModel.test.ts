import { buildPvSummaryModel } from "../../features/manager/pvSummaryModel";

describe("buildPvSummaryModel", () => {
  it("summarizes orders for the active shift", () => {
    const model = buildPvSummaryModel({
      orders: [
        { id: "o1", status: "pending", total: 10, shiftId: "s1" },
        { id: "o2", status: "ready", total: 20, shiftId: "s1" },
        { id: "o3", status: "paid", total: 30, shiftId: "s1" },
        { id: "o4", status: "preparing", total: 50, shiftId: "s2" },
      ],
      shiftId: "s1",
    });

    expect(model.totalOrders).toBe(3);
    expect(model.pending).toBe(1);
    expect(model.preparing).toBe(0);
    expect(model.ready).toBe(1);
    expect(model.paid).toBe(1);
    expect(model.totalRevenue).toBe(60);
  });

  it("uses all orders when shiftId is null", () => {
    const model = buildPvSummaryModel({
      orders: [
        { id: "o1", status: "pending", total: 10, shiftId: "s1" },
        { id: "o2", status: "preparing", total: 20, shiftId: "s2" },
      ],
      shiftId: null,
    });

    expect(model.totalOrders).toBe(2);
    expect(model.pending).toBe(1);
    expect(model.preparing).toBe(1);
    expect(model.totalRevenue).toBe(30);
  });
});
