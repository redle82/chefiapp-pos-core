type TaskLike = {
  id: string;
  status: "pending" | "in_progress" | "done" | "completed";
  priority: "background" | "attention" | "urgent" | "critical";
};

export type TasksSummaryModelInput = {
  tasks: TaskLike[];
};

export type TasksSummaryModel = {
  total: number;
  open: number;
  pending: number;
  inProgress: number;
  completed: number;
  urgentOpen: number;
  criticalOpen: number;
};

export function buildTasksSummaryModel(
  input: TasksSummaryModelInput,
): TasksSummaryModel {
  const openTasks = input.tasks.filter(
    (task) => task.status !== "done" && task.status !== "completed",
  );

  return {
    total: input.tasks.length,
    open: openTasks.length,
    pending: input.tasks.filter((task) => task.status === "pending").length,
    inProgress: input.tasks.filter((task) => task.status === "in_progress")
      .length,
    completed: input.tasks.filter(
      (task) => task.status === "done" || task.status === "completed",
    ).length,
    urgentOpen: openTasks.filter((task) => task.priority === "urgent").length,
    criticalOpen: openTasks.filter((task) => task.priority === "critical")
      .length,
  };
}
