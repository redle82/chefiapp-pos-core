// store/useOperationalStore.ts
import create from "zustand";
import {
  OperationalMetrics,
  OperationalMode,
} from "../types/operational.types";

interface OperationalStoreState extends OperationalMetrics {
  setMode: (mode: OperationalMode) => void;
  setKitchenLoad: (load: "green" | "yellow" | "red") => void;
  setMetrics: (metrics: Partial<OperationalMetrics>) => void;
}

const initialState: OperationalMetrics = {
  dailyRevenue: 1240,
  activeOrders: 38,
  avgTicket: 32,
  kitchenLoad: "yellow",
  shiftPerformance: 0.82,
  mode: "operator",
};

export const useOperationalStore = create<OperationalStoreState>((set) => ({
  ...initialState,
  setMode: (mode) => set({ mode }),
  setKitchenLoad: (kitchenLoad) => set({ kitchenLoad }),
  setMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
}));
