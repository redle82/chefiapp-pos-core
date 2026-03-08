import type { Task } from "../../context/AppStaffContext";
import {
  buildManagerOperationalHomeModel,
  type CoreHealthStatus,
} from "../../features/manager/managerOperationalHomeModel";

const makeTask = (
  id: string,
  priority: Task["priority"],
  status: Task["status"],
): Task => ({
  id,
  title: `task-${id}`,
  priority,
  status,
  assignedRoles: ["manager"],
  category: "ops",
  createdAt: Date.now(),
});

describe("buildManagerOperationalHomeModel", () => {
  it("marks shift healthy when no bottlenecks are present", () => {
    const model = buildManagerOperationalHomeModel({
      tasks: [makeTask("1", "attention", "done")],
      shiftState: "active",
      activeStaffCount: 3,
      coreStatus: "UP",
      specDriftsCount: 0,
    });

    expect(model.isHealthy).toBe(true);
    expect(model.shiftLabel).toBe("TURNO ATIVO");
    expect(model.bottlenecks).toEqual([]);
  });

  it("creates bottlenecks for critical alerts, urgent pending tasks, no staff and unstable core", () => {
    const coreStatus: CoreHealthStatus = "DOWN";

    const model = buildManagerOperationalHomeModel({
      tasks: [
        makeTask("1", "critical", "pending"),
        makeTask("2", "urgent", "in_progress"),
      ],
      shiftState: "active",
      activeStaffCount: 0,
      coreStatus,
      specDriftsCount: 2,
    });

    expect(model.isHealthy).toBe(false);
    expect(model.bottlenecks).toContain("2 alertas críticos");
    expect(model.bottlenecks).toContain("Tarefas urgentes pendentes");
    expect(model.bottlenecks).toContain("Sem equipe ativa");
    expect(model.bottlenecks).toContain("Sistema instável");
    expect(model.pendingTasksCount).toBe(2);
    expect(model.urgentPendingTasksCount).toBe(2);
  });
});
