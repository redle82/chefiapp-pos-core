// types/inventory.types.ts

export interface ProductStock {
  id: string;
  name: string;
  stockLevel: number;
  threshold: number;
  price: number;
  cost: number;
  autoBlockWhenZero: boolean;
}

export interface InventoryStoreState {
  products: ProductStock[];
}
