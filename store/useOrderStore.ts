// store/useOrderStore.ts
import create from "zustand";
import { Order, OrderItem, OrderStatus } from "../types/order.types";

interface OrderStoreState {
  currentOrder: Order | null;
  orderItems: OrderItem[];
  orderStatus: OrderStatus;
  orderStartTime: string | null;
  tableId?: string;
  serviceType: "dine_in" | "take_away" | "delivery";
  setOrder: (order: Order) => void;
  sendToKitchen: () => void;
  finalizeOrder: () => void;
}

export const useOrderStore = create<OrderStoreState>((set) => ({
  currentOrder: null,
  orderItems: [],
  orderStatus: "pending",
  orderStartTime: null,
  tableId: undefined,
  serviceType: "dine_in",
  setOrder: (order) =>
    set({
      currentOrder: order,
      orderItems: order.items,
      orderStatus: order.status,
      orderStartTime: order.orderStartTime,
      tableId: order.tableId,
      serviceType: order.serviceType,
    }),
  sendToKitchen: () => set((state) => ({ orderStatus: "sent" })),
  finalizeOrder: () =>
    set((state) => ({
      orderStatus: "closed",
      currentOrder: null,
      orderItems: [],
      orderStartTime: null,
      tableId: undefined,
    })),
}));
