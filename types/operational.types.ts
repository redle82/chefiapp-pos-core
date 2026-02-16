// types/operational.types.ts

export type OperationalMode = "operator" | "manager" | "owner";

export interface OperationalMetrics {
  dailyRevenue: number;
  activeOrders: number;
  avgTicket: number;
  kitchenLoad: "green" | "yellow" | "red";
  shiftPerformance: number; // e.g. % of goal
  mode: OperationalMode;
}
