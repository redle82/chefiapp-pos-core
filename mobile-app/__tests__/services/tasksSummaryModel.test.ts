import { buildTasksSummaryModel } from "../../features/manager/tasksSummaryModel";

describe("buildTasksSummaryModel", () => {
  it("builds task counters and urgency values", () => {
    const model = buildTasksSummaryModel({
      tasks: [
        { id: "t1", status: "pending", priority: "attention" },
        { id: "t2", status: "in_progress", priority: "urgent" },
        { id: "t3", status: "done", priority: "critical" },
        { id: "t4", status: "completed", priority: "background" },
      ],
    });

    expect(model.total).toBe(4);
    expect(model.pending).toBe(1);
    expect(model.inProgress).toBe(1);
    expect(model.completed).toBe(2);
    expect(model.urgentOpen).toBe(1);
    expect(model.criticalOpen).toBe(0);
    expect(model.open).toBe(2);
  });
});
