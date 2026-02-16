// tests/integration/orderLifecycle.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { processOrderLifecycle } from "../../store/processOrderLifecycle";
import { useInventoryStore } from "../../store/useInventoryStore";
import { useKitchenStore } from "../../store/useKitchenStore";
import { useOperationalStore } from "../../store/useOperationalStore";
import { useOrderStore } from "../../store/useOrderStore";

const mockProductA = {
  id: "1",
  name: "Salsa Alioli Negro",
  price: 1.5,
  cost: 0.5,
};
const mockProductB = { id: "3", name: "Wild Egg", price: 16, cost: 6 };

function resetStores() {
  useOrderStore.setState({
    currentOrder: null,
    orderItems: [],
    orderStatus: "pending",
    orderStartTime: null,
    tableId: undefined,
    serviceType: "dine_in",
  });
  useOperationalStore.setState({
    dailyRevenue: 0,
    activeOrders: 0,
    avgTicket: 0,
    kitchenLoad: "green",
    shiftPerformance: 0,
    mode: "operator",
  });
  useKitchenStore.setState({
    activeTickets: [],
    avgPrepTime: 14,
    bottleneckStation: undefined,
    kitchenStatus: "yellow",
  });
  useInventoryStore.setState({
    products: [
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
    ],
  });
}

describe("processOrderLifecycle integration", () => {
  beforeEach(() => {
    resetStores();
  });

  it("should run a full order lifecycle and update all stores correctly", () => {
    const lifecycle = processOrderLifecycle();
    lifecycle.startOrder("order-1", "dine_in");
    lifecycle.addItem(mockProductA);
    lifecycle.addItem(mockProductB);
    lifecycle.sendToKitchen();
    lifecycle.finalizeOrder();

    // OperationalStore.activeOrders volta para 0 após finalizar
    expect(useOperationalStore.getState().activeOrders).toBe(0);
    // OperationalStore.dailyRevenue > 0
    expect(useOperationalStore.getState().dailyRevenue).toBeGreaterThan(0);
    // OperationalStore.avgTicket calculado corretamente
    const expectedTotal = mockProductA.price + mockProductB.price;
    expect(useOperationalStore.getState().avgTicket).toBeCloseTo(
      expectedTotal,
      2,
    );
    // InventoryStore estoque reduzido
    const products = useInventoryStore.getState().products;
    expect(products.find((p) => p.id === "1")?.stockLevel).toBe(1); // 2 - 1
    expect(products.find((p) => p.id === "3")?.stockLevel).toBe(9); // 10 - 1
    // KitchenStore.activeTickets vazio após finalizar
    expect(useKitchenStore.getState().activeTickets.length).toBe(0);
    // OrderStore.currentOrder null após finalizar
    expect(useOrderStore.getState().currentOrder).toBeNull();
  });
});
