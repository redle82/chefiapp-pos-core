type KdsOrder = {
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
  totalAmount: number;
  shiftId?: string | null;
};

export type KdsMobileSummaryModelInput = {
  orders: KdsOrder[];
  shiftId: string | null;
};

export type KdsMobileSummaryModel = {
  pending: number;
  preparing: number;
  ready: number;
  activeQueue: number;
  completed: number;
  completionRate: number;
};

export function buildKdsMobileSummaryModel(
  input: KdsMobileSummaryModelInput,
): KdsMobileSummaryModel {
  const relevantOrders = input.shiftId
    ? input.orders.filter((order) => order.shiftId === input.shiftId)
    : input.orders;

  const pending = relevantOrders.filter(
    (order) => order.status === "pending",
  ).length;
  const preparing = relevantOrders.filter(
    (order) => order.status === "preparing",
  ).length;
  const ready = relevantOrders.filter(
    (order) => order.status === "ready",
  ).length;
  const completed = relevantOrders.filter(
    (order) =>
      order.status === "ready" ||
      order.status === "delivered" ||
      order.status === "paid",
  ).length;
  const activeQueue = pending + preparing;
  const total = relevantOrders.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    pending,
    preparing,
    ready,
    activeQueue,
    completed,
    completionRate,
  };
}
