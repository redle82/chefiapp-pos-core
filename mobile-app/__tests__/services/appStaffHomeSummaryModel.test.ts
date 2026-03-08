import { buildAppStaffHomeSummaryModel } from "../../features/manager/appStaffHomeSummaryModel";

describe("buildAppStaffHomeSummaryModel", () => {
  it("computes home summary for active owner role", () => {
    const model = buildAppStaffHomeSummaryModel({
      role: "owner",
      shiftState: "active",
      shiftId: "s1",
      businessName: "Chefia Centro",
      tasks: [
        { id: "t1", status: "pending" },
        { id: "t2", status: "completed" },
      ],
      orders: [
        { id: "o1", status: "pending", total: 10, shiftId: "s1" },
        { id: "o2", status: "ready", total: 12, shiftId: "s1" },
        { id: "o3", status: "paid", total: 20, shiftId: "s2" },
      ],
    });

    expect(model.title).toBe("Home owner");
    expect(model.shiftLabel).toBe("Turno ativo");
    expect(model.openTasks).toBe(1);
    expect(model.orderQueue).toBe(1);
    expect(model.revenue).toBe(22);
  });

  it("uses all orders when shiftId is missing", () => {
    const model = buildAppStaffHomeSummaryModel({
      role: "waiter",
      shiftState: "offline",
      shiftId: null,
      businessName: "Chefia Sul",
      tasks: [],
      orders: [
        { id: "o1", status: "pending", total: 8, shiftId: "s1" },
        { id: "o2", status: "paid", total: 14, shiftId: "s2" },
      ],
    });

    expect(model.title).toBe("Home waiter");
    expect(model.shiftLabel).toBe("Sem turno ativo");
    expect(model.orderQueue).toBe(1);
    expect(model.revenue).toBe(22);
  });
});
