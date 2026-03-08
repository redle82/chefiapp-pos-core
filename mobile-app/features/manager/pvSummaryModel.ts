type PvOrder = {
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

function getOrderAmount(order: PvOrder): number {
  return Number(order.totalAmount ?? order.total ?? 0);
}

export type PvSummaryModelInput = {
  orders: PvOrder[];
  shiftId: string | null;
};

export type PvSummaryModel = {
  totalOrders: number;
  pending: number;
  preparing: number;
  ready: number;
  paid: number;
  totalRevenue: number;
};

export function buildPvSummaryModel(
  input: PvSummaryModelInput,
): PvSummaryModel {
  const relevantOrders = input.shiftId
    ? input.orders.filter((order) => order.shiftId === input.shiftId)
    : input.orders;

  return {
    totalOrders: relevantOrders.length,
    pending: relevantOrders.filter((order) => order.status === "pending")
      .length,
    preparing: relevantOrders.filter((order) => order.status === "preparing")
      .length,
    ready: relevantOrders.filter((order) => order.status === "ready").length,
    paid: relevantOrders.filter((order) => order.status === "paid").length,
    totalRevenue: relevantOrders.reduce(
      (sum, order) => sum + getOrderAmount(order),
      0,
    ),
  };
}
