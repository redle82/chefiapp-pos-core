// types/kitchen.types.ts

export type KitchenStatus = "green" | "yellow" | "red";

export interface KitchenTicket {
  id: string;
  orderId: string;
  station: string;
  status: KitchenStatus;
  startedAt: string;
  avgPrepTime: number;
}

export interface KitchenStoreState {
  activeTickets: KitchenTicket[];
  avgPrepTime: number;
  bottleneckStation?: string;
  kitchenStatus: KitchenStatus;
}
