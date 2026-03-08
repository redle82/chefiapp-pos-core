type SectorTask = {
  id: string;
  status: "pending" | "in_progress" | "done" | "completed";
  priority: "background" | "attention" | "urgent" | "critical";
};

type SectorOrder = {
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

function getOrderAmount(order: SectorOrder): number {
  return Number(order.totalAmount ?? order.total ?? 0);
}

export type OwnerSectorKind =
  | "operation"
  | "tasks"
  | "team"
  | "kitchen"
  | "cleaning";

export type OwnerSectorSummaryInput = {
  sector: OwnerSectorKind;
  shiftId: string | null;
  tasks: SectorTask[];
  orders: SectorOrder[];
};

export type OwnerSectorSummaryModel = {
  title: string;
  openTasks: number;
  urgentOpenTasks: number;
  orderQueue: number;
  readyOrders: number;
  revenue: number;
};

export function buildOwnerSectorSummaryModel(
  input: OwnerSectorSummaryInput,
): OwnerSectorSummaryModel {
  const relevantOrders = input.shiftId
    ? input.orders.filter((order) => order.shiftId === input.shiftId)
    : input.orders;

  const openTasks = input.tasks.filter(
    (task) => task.status !== "done" && task.status !== "completed",
  );

  return {
    title: `Setor ${input.sector}`,
    openTasks: openTasks.length,
    urgentOpenTasks: openTasks.filter(
      (task) => task.priority === "urgent" || task.priority === "critical",
    ).length,
    orderQueue: relevantOrders.filter(
      (order) => order.status === "pending" || order.status === "preparing",
    ).length,
    readyOrders: relevantOrders.filter((order) => order.status === "ready")
      .length,
    revenue: relevantOrders.reduce((sum, order) => sum + getOrderAmount(order), 0),
  };
}
