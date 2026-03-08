type OperationOrder = {
  id: string;
  status:
    | "new"
    | "pending"
    | "preparing"
    | "ready"
    | "served"
    | "delivered"
    | "paid"
    | "partially_paid"
    | "cancelled"
    | "OPEN"
    | "LOCKED"
    | "CLOSED";
  totalAmount?: number;
  total?: number;
  shiftId?: string | null;
};

function getOrderAmount(order: OperationOrder): number {
  return Number(order.totalAmount ?? order.total ?? 0);
}

type OperationTask = {
  id: string;
  status: "pending" | "in_progress" | "done" | "completed";
  priority: "background" | "attention" | "urgent" | "critical";
};

export type OperationSummaryModelInput = {
  orders: OperationOrder[];
  tasks: OperationTask[];
  shiftId: string | null;
};

export type OperationSummaryModel = {
  queue: number;
  ready: number;
  paid: number;
  revenue: number;
  pendingTasks: number;
  urgentTasks: number;
};

export function buildOperationSummaryModel(
  input: OperationSummaryModelInput,
): OperationSummaryModel {
  const relevantOrders = input.shiftId
    ? input.orders.filter((order) => order.shiftId === input.shiftId)
    : input.orders;

  const pendingTasks = input.tasks.filter(
    (task) => task.status !== "done" && task.status !== "completed",
  );

  return {
    queue: relevantOrders.filter(
      (order) => order.status === "pending" || order.status === "preparing",
    ).length,
    ready: relevantOrders.filter((order) => order.status === "ready").length,
    paid: relevantOrders.filter((order) => order.status === "paid").length,
    revenue: relevantOrders.reduce((sum, order) => sum + getOrderAmount(order), 0),
    pendingTasks: pendingTasks.length,
    urgentTasks: pendingTasks.filter(
      (task) => task.priority === "urgent" || task.priority === "critical",
    ).length,
  };
}
