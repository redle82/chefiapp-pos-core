// store/processOrderLifecycle.ts
import { OrderItem } from "../types/order.types";
import { useInventoryStore } from "./useInventoryStore";
import { useKitchenStore } from "./useKitchenStore";
import { useOperationalStore } from "./useOperationalStore";
import { useOrderStore } from "./useOrderStore";

// Debug log helper
function logFlow(step: string, data?: any) {
  // eslint-disable-next-line no-console
  console.log(`[OrderFlow] ${step}`, data || "");
}

export function processOrderLifecycle() {
  const orderStore = useOrderStore.getState();
  const operationalStore = useOperationalStore.getState();
  const kitchenStore = useKitchenStore.getState();
  const inventoryStore = useInventoryStore.getState();

  // 1. Iniciar pedido
  function startOrder(
    orderId: string,
    serviceType: "dine_in" | "take_away" | "delivery",
  ) {
    orderStore.setOrder({
      id: orderId,
      tableId: undefined,
      serviceType,
      status: "pending",
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderStartTime: new Date().toISOString(),
      total: 0,
    });
    useOperationalStore.setState((s) => ({ activeOrders: s.activeOrders + 1 }));
    logFlow("startOrder", { orderId, serviceType });
  }

  // 2. Adicionar item
  function addItem(product: {
    id: string;
    name: string;
    price: number;
    cost: number;
  }) {
    const item: OrderItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      quantity: 1,
      price: product.price,
    };
    orderStore.setOrder({
      ...orderStore.currentOrder!,
      items: [...orderStore.orderItems, item],
      updatedAt: new Date().toISOString(),
      total: (orderStore.currentOrder?.total || 0) + product.price,
    });
    // Reserva estoque temporário
    useInventoryStore.setState((s) => ({
      products: s.products.map((p) =>
        p.id === product.id && p.stockLevel > 0
          ? { ...p, stockLevel: p.stockLevel - 1 }
          : p,
      ),
    }));
    // Atualiza avgTicket parcial
    const newAvg =
      (operationalStore.avgTicket * operationalStore.activeOrders +
        product.price) /
      (operationalStore.activeOrders || 1);
    useOperationalStore.setState({ avgTicket: newAvg });
    logFlow("addItem", { product });
  }

  // 3. Enviar para cozinha
  function sendToKitchen() {
    if (!orderStore.currentOrder) return;
    // Cria ticket na cozinha
    useKitchenStore.setState((s) => ({
      activeTickets: [
        ...s.activeTickets,
        {
          id: `ticket-${orderStore.currentOrder!.id}`,
          orderId: orderStore.currentOrder!.id,
          station: "main",
          status: "yellow",
          startedAt: new Date().toISOString(),
          avgPrepTime: kitchenStore.avgPrepTime,
        },
      ],
    }));
    // Atualiza kitchenLoad
    const newLoad =
      kitchenStore.avgPrepTime > 20
        ? "red"
        : kitchenStore.avgPrepTime > 12
        ? "yellow"
        : "green";
    useOperationalStore.setState({ kitchenLoad: newLoad });
    // Simula impressão
    logFlow("sendToKitchen", {
      orderId: orderStore.currentOrder.id,
      print: "Simulated",
    });
  }

  // 4. Finalizar pedido
  function finalizeOrder() {
    if (!orderStore.currentOrder) return;
    // Soma total ao dailyRevenue
    useOperationalStore.setState((s) => ({
      dailyRevenue: s.dailyRevenue + (orderStore.currentOrder?.total || 0),
    }));
    // Recalcula avgTicket
    const totalOrders = operationalStore.activeOrders;
    const newAvg =
      totalOrders > 1
        ? (operationalStore.avgTicket * totalOrders +
            (orderStore.currentOrder?.total || 0)) /
          totalOrders
        : orderStore.currentOrder?.total || 0;
    useOperationalStore.setState({ avgTicket: newAvg });
    // Confirma baixa estoque (já feito na reserva)
    // Remove ticket da cozinha
    useKitchenStore.setState((s) => ({
      activeTickets: s.activeTickets.filter(
        (t) => t.orderId !== orderStore.currentOrder!.id,
      ),
    }));
    // Decrementa activeOrders
    useOperationalStore.setState((s) => ({
      activeOrders: Math.max(0, s.activeOrders - 1),
    }));
    // Limpa order
    orderStore.finalizeOrder();
    logFlow("finalizeOrder", { orderId: orderStore.currentOrder?.id });
  }

  return {
    startOrder,
    addItem,
    sendToKitchen,
    finalizeOrder,
  };
}
