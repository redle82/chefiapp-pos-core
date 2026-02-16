// store/useInventoryStore.ts
import create from "zustand";
import { InventoryStoreState } from "../types/inventory.types";

const initialProducts = [
  {
    id: "1",
    name: "Salsa Alioli Negro",
    stockLevel: 2,
    threshold: 5,
    price: 1.5,
    cost: 0.5,
    autoBlockWhenZero: true,
  },
  {
    id: "2",
    name: "Playa Burger",
    stockLevel: 0,
    threshold: 3,
    price: 15,
    cost: 7,
    autoBlockWhenZero: true,
  },
  {
    id: "3",
    name: "Wild Egg",
    stockLevel: 10,
    threshold: 5,
    price: 16,
    cost: 6,
    autoBlockWhenZero: true,
  },
];

export const useInventoryStore = create<InventoryStoreState>(() => ({
  products: initialProducts,
}));
