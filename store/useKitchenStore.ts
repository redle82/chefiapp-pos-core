// store/useKitchenStore.ts
import create from "zustand";
import { KitchenStoreState } from "../types/kitchen.types";

const initialState: KitchenStoreState = {
  activeTickets: [],
  avgPrepTime: 14,
  bottleneckStation: undefined,
  kitchenStatus: "yellow",
};

export const useKitchenStore = create<KitchenStoreState>(() => ({
  ...initialState,
}));
