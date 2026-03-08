import { ShiftState } from "@/context/AppStaffContext";

type HomeTask = {
  id: string;
  status: string;
};

type HomeOrder = {
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

function getOrderAmount(order: HomeOrder): number {
  return Number(order.totalAmount ?? order.total ?? 0);
}

export type AppStaffHomeRole =
  | "owner"
  | "manager"
  | "waiter"
  | "kitchen"
  | "cleaning"
  | "worker";

export type AppStaffHomeSummaryInput = {
  role: AppStaffHomeRole;
  shiftState: ShiftState;
  shiftId: string | null;
  businessName: string;
  tasks: HomeTask[];
  orders: HomeOrder[];
};

export type AppStaffHomeSummaryModel = {
  title: string;
  businessName: string;
  shiftLabel: string;
  openTasks: number;
  orderQueue: number;
  revenue: number;
};

export function buildAppStaffHomeSummaryModel(
  input: AppStaffHomeSummaryInput,
): AppStaffHomeSummaryModel {
  const relevantOrders = input.shiftId
    ? input.orders.filter((order) => order.shiftId === input.shiftId)
    : input.orders;

  const openTasks = input.tasks.filter((task) => {
    const status = String(task.status);
    return status !== "done" && status !== "completed";
  }).length;

  const orderQueue = relevantOrders.filter(
    (order) => order.status === "pending" || order.status === "preparing",
  ).length;

  const revenue = relevantOrders.reduce(
    (sum, order) => sum + getOrderAmount(order),
    0,
  );

  return {
    title: `Home ${input.role}`,
    businessName: input.businessName,
    shiftLabel:
      input.shiftState === "active" ? "Turno ativo" : "Sem turno ativo",
    openTasks,
    orderQueue,
    revenue,
  };
}
