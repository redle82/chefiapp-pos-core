/**
 * processOrderLifecycle — Orchestrador de ciclo de vida de pedido operacional.
 *
 * Fase 2: Integração real com Docker Core (PostgREST).
 *
 * Fluxo:
 *   startOrder()     → cria pedido no backend (status OPEN), armazena orderId real
 *   addItem()        → insere item no backend (gm_order_items) + reserva stock local
 *   sendToKitchen()  → updateOrderStatus → IN_PREP (KDS vê o pedido)
 *   finalizeOrder()  → updateOrderStatus → CLOSED + marca pagamento
 *   cancelOrder()    → updateOrderStatus → CANCELLED + liberta stock reservado
 *
 * Backend é fonte da verdade. Store local é espelho para KPIs e UX.
 *
 * Dependências:
 *   - CoreOrdersApi (createOrderAtomic, addOrderItem, updateOrderStatus)
 *   - useOperationalStore (KPIs, stock, currentOrder)
 */

import { createOrder } from "../../infra/writers/OrderWriter";
import { updateOrderStatus } from "../infra/CoreOrdersApi";
import { Logger } from "../logger/Logger";
import { useOperationalStore } from "./useOperationalStore";

// Counter para IDs temporários (antes do backend confirmar)
let orderCounter = 0;

function logFlow(step: string, data?: unknown) {
  console.log(`[OrderLifecycle] ${step}`, data ?? "");
}

export interface LifecycleProduct {
  id: string;
  name: string;
  priceCents: number;
  costCents: number;
  station?: string;
}

export interface LifecycleOrderItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface OrderLifecycleResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Cria um orchestrador que opera sobre o useOperationalStore
 * e sincroniza com o backend Docker Core.
 *
 * Uso:
 * ```ts
 * const lifecycle = createOrderLifecycle();
 * const { orderId } = await lifecycle.startOrder('00-rest-id', 'dine_in', '5');
 * await lifecycle.addItem(orderId, { id: 'p1', name: 'Café', priceCents: 250, costCents: 80 });
 * await lifecycle.sendToKitchen(orderId, '00-rest-id');
 * await lifecycle.finalizeOrder(orderId, '00-rest-id', 12500);
 * ```
 */
export function createOrderLifecycle() {
  function getStore() {
    return useOperationalStore.getState();
  }

  // ─── Pending items: accumulated locally until sendToKitchen ────────
  const pendingItems: Map<string, LifecycleProduct[]> = new Map();

  // ─── 1. Iniciar pedido ─────────────────────────────────────────────
  /**
   * Cria um pedido local (DRAFT). O pedido é criado no backend quando
   * sendToKitchen() é chamado (com todos os items acumulados).
   *
   * Para fluxos directos (takeaway), pode-se chamar
   * confirmAndPay() que cria + fecha atomicamente.
   */
  function startOrder(mode: string, tableNumber?: string | null): string {
    orderCounter += 1;
    const localId = `LOCAL-${Date.now()}-${orderCounter}`;

    const store = getStore();
    store.setCurrentOrder({
      orderId: localId,
      status: "DRAFT",
      startedAt: new Date().toISOString(),
      sentToKitchenAt: null,
      readyAt: null,
      paidAt: null,
      mode,
      tableNumber: tableNumber ?? null,
    });

    store.setKpis({
      activeOrdersCount: store.kpis.activeOrdersCount + 1,
    });

    pendingItems.set(localId, []);
    logFlow("startOrder", { localId, mode, tableNumber });
    return localId;
  }

  // ─── 2. Adicionar item ────────────────────────────────────────────
  /**
   * Acumula item localmente e reserva stock.
   * Items são enviados ao backend em lote quando sendToKitchen() é chamado.
   */
  function addItem(product: LifecycleProduct) {
    const store = getStore();
    const localId = store.currentOrder.orderId;

    // Acumular item para envio posterior
    if (localId) {
      const items = pendingItems.get(localId) ?? [];
      items.push(product);
      pendingItems.set(localId, items);
    }

    // Reservar estoque (não reduzir total; apenas incrementar reservado)
    const existing = store.stock[product.id];
    const prevReserved = existing?.stockReserved ?? 0;
    const prevTotal = existing?.stockTotal ?? existing?.currentQty ?? 999;
    const newReserved = prevReserved + 1;
    const newAvailable = prevTotal - newReserved;

    store.updateStock(product.id, {
      stockTotal: prevTotal,
      stockReserved: newReserved,
      currentQty: newAvailable,
      isUnavailable: newAvailable <= 0,
    });

    // Recalcular avgTicket parcial
    const prevTotalRevenue =
      store.kpis.averageTicketCents * store.kpis.activeOrdersCount;
    const newAvg =
      store.kpis.activeOrdersCount > 0
        ? Math.round(
            (prevTotalRevenue + product.priceCents) /
              store.kpis.activeOrdersCount,
          )
        : product.priceCents;
    store.setKpis({ averageTicketCents: newAvg });

    logFlow("addItem", {
      product: product.name,
      priceCents: product.priceCents,
      reserved: newReserved,
      available: newAvailable,
    });
  }

  // ─── 3. Enviar para cozinha ───────────────────────────────────────
  /**
   * Cria o pedido no backend (createOrderAtomic) com todos os items acumulados
   * e marca como OPEN. O KDS verá o pedido imediatamente.
   *
   * Retorna o orderId real do backend.
   */
  async function sendToKitchen(
    restaurantId: string,
  ): Promise<OrderLifecycleResult> {
    const store = getStore();
    const localId = store.currentOrder.orderId;
    if (!localId) {
      return { success: false, error: "Nenhum pedido ativo" };
    }

    const items = pendingItems.get(localId) ?? [];
    if (items.length === 0) {
      return { success: false, error: "Pedido sem items" };
    }

    try {
      // Criar pedido atomicamente no backend (com items)
      const result = await createOrder(
        restaurantId,
        items.map((item) => ({
          product_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.priceCents,
        })),
        "TPV",
        "pending",
      );

      const realOrderId = result.id;

      // Atualizar store com orderId real
      store.setCurrentOrder({
        orderId: realOrderId,
        status: "SENT",
        sentToKitchenAt: new Date().toISOString(),
      });

      // Limpar items pendentes
      pendingItems.delete(localId);

      // Atualizar métricas de cozinha
      const avgPrepTimeSeconds = store.kitchen.avgPrepTimeSeconds ?? 0;
      const yellowThreshold = 10 * 60;
      const redThreshold = 20 * 60;

      let kitchenStatus: "GREEN" | "YELLOW" | "RED" = "GREEN";
      if (avgPrepTimeSeconds >= redThreshold) kitchenStatus = "RED";
      else if (avgPrepTimeSeconds >= yellowThreshold) kitchenStatus = "YELLOW";

      store.setKpis({ kitchenStatus });

      if (kitchenStatus !== "GREEN") {
        store.setKitchenMetrics({
          delayedOrdersCount: store.kitchen.delayedOrdersCount + 1,
        });
      }

      logFlow("sendToKitchen", {
        localId,
        realOrderId,
        kitchenStatus,
        itemCount: items.length,
      });
      Logger.info("[ORDER_SENT_TO_KITCHEN]", {
        orderId: realOrderId,
        restaurantId,
        itemCount: items.length,
        totalCents: result.total_cents,
      });

      return { success: true, orderId: realOrderId };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar para cozinha";
      Logger.error("[ORDER_SEND_FAILED]", { localId, error: message });
      return { success: false, error: message };
    }
  }

  // ─── 4. Finalizar pedido (pagamento) ──────────────────────────────
  /**
   * Marca o pedido como CLOSED no backend e regista pagamento.
   * Só pode ser chamado após sendToKitchen() (tem orderId real).
   */
  async function finalizeOrder(
    restaurantId: string,
    totalPaidCents: number,
  ): Promise<OrderLifecycleResult> {
    const store = getStore();
    const orderId = store.currentOrder.orderId;

    if (!orderId || orderId.startsWith("LOCAL-")) {
      return { success: false, error: "Pedido não foi enviado para cozinha" };
    }

    try {
      // Atualizar status no backend
      await updateOrderStatus({
        order_id: orderId,
        restaurant_id: restaurantId,
        new_status: "CLOSED",
        origin: "TPV",
      });

      // Somar total ao dailyRevenue
      store.setKpis({
        dailyRevenueCents: store.kpis.dailyRevenueCents + totalPaidCents,
        activeOrdersCount: Math.max(0, store.kpis.activeOrdersCount - 1),
      });

      // Recalcular avgTicket
      const completedOrders =
        store.kpis.activeOrdersCount > 0 ? store.kpis.activeOrdersCount : 1;
      store.setKpis({
        averageTicketCents: Math.round(
          store.kpis.dailyRevenueCents / completedOrders,
        ),
      });

      // Confirmar stock (reservado → deduzido do total)
      for (const [productId, signals] of Object.entries(store.stock)) {
        if (signals.stockReserved && signals.stockReserved > 0) {
          store.updateStock(productId, {
            stockTotal: (signals.stockTotal ?? 999) - signals.stockReserved,
            stockReserved: 0,
            currentQty: (signals.stockTotal ?? 999) - signals.stockReserved,
          });
        }
      }

      // Reduzir delayed orders count
      if (store.kitchen.delayedOrdersCount > 0) {
        store.setKitchenMetrics({
          delayedOrdersCount: store.kitchen.delayedOrdersCount - 1,
        });
      }

      // Marcar pedido como pago e resetar
      store.setCurrentOrder({
        status: "PAID",
        paidAt: new Date().toISOString(),
      });
      store.resetCurrentOrder();

      logFlow("finalizeOrder", { orderId, totalPaidCents });
      Logger.info("[ORDER_FINALIZED]", {
        orderId,
        restaurantId,
        totalPaidCents,
      });

      return { success: true, orderId };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao finalizar pedido";
      Logger.error("[ORDER_FINALIZE_FAILED]", { orderId, error: message });
      return { success: false, error: message };
    }
  }

  // ─── 5. Confirmar e pagar directamente (takeaway) ────────────────
  /**
   * Atalho para takeaway: cria pedido no backend e fecha imediatamente
   * (OPEN → CLOSED num só passo). Elimina necessidade de sendToKitchen separado.
   */
  async function confirmAndPay(
    restaurantId: string,
    paymentMethod: string = "cash",
  ): Promise<OrderLifecycleResult> {
    const store = getStore();
    const localId = store.currentOrder.orderId;
    if (!localId) {
      return { success: false, error: "Nenhum pedido ativo" };
    }

    const items = pendingItems.get(localId) ?? [];
    if (items.length === 0) {
      return { success: false, error: "Pedido sem items" };
    }

    try {
      // Criar pedido atomicamente no backend
      const result = await createOrder(
        restaurantId,
        items.map((item) => ({
          product_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.priceCents,
        })),
        "TPV",
        paymentMethod,
      );

      const realOrderId = result.id;
      const totalCents = result.total_cents;

      // Fechar imediatamente
      await updateOrderStatus({
        order_id: realOrderId,
        restaurant_id: restaurantId,
        new_status: "CLOSED",
        origin: "TPV",
      });

      // Limpar items pendentes
      pendingItems.delete(localId);

      // Actualizar KPIs
      store.setKpis({
        dailyRevenueCents: store.kpis.dailyRevenueCents + totalCents,
        activeOrdersCount: Math.max(0, store.kpis.activeOrdersCount - 1),
      });

      const completedOrders =
        store.kpis.activeOrdersCount > 0 ? store.kpis.activeOrdersCount : 1;
      store.setKpis({
        averageTicketCents: Math.round(
          store.kpis.dailyRevenueCents / completedOrders,
        ),
      });

      // Confirmar stock definitivamente
      for (const [productId, signals] of Object.entries(store.stock)) {
        if (signals.stockReserved && signals.stockReserved > 0) {
          store.updateStock(productId, {
            stockTotal: (signals.stockTotal ?? 999) - signals.stockReserved,
            stockReserved: 0,
            currentQty: (signals.stockTotal ?? 999) - signals.stockReserved,
          });
        }
      }

      // Marcar como pago e resetar
      store.setCurrentOrder({
        orderId: realOrderId,
        status: "PAID",
        paidAt: new Date().toISOString(),
      });
      store.resetCurrentOrder();

      logFlow("confirmAndPay", { realOrderId, totalCents, paymentMethod });
      Logger.info("[ORDER_CONFIRMED_AND_PAID]", {
        orderId: realOrderId,
        restaurantId,
        totalCents,
      });

      return { success: true, orderId: realOrderId };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao confirmar pedido";
      Logger.error("[ORDER_CONFIRM_PAY_FAILED]", { localId, error: message });
      return { success: false, error: message };
    }
  }

  // ─── 6. Cancelar pedido ───────────────────────────────────────────
  /**
   * Cancela o pedido. Se ainda local (DRAFT), limpa o state.
   * Se já no backend, atualiza status para CANCELLED.
   */
  async function cancelOrder(
    restaurantId?: string,
  ): Promise<OrderLifecycleResult> {
    const store = getStore();
    const orderId = store.currentOrder.orderId;

    // Se pedido já no backend, cancelar lá também
    if (orderId && !orderId.startsWith("LOCAL-") && restaurantId) {
      try {
        await updateOrderStatus({
          order_id: orderId,
          restaurant_id: restaurantId,
          new_status: "CANCELLED",
          origin: "TPV",
        });
      } catch (err) {
        Logger.warn("[ORDER_CANCEL_BACKEND_FAILED]", {
          orderId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Libertar stock reservado (sem alterar total)
    for (const [productId, signals] of Object.entries(store.stock)) {
      if (signals.stockReserved && signals.stockReserved > 0) {
        store.updateStock(productId, {
          stockReserved: 0,
          currentQty: signals.stockTotal ?? 999,
          isUnavailable: false,
        });
      }
    }

    // Limpar items pendentes
    if (orderId) pendingItems.delete(orderId);

    store.setKpis({
      activeOrdersCount: Math.max(0, store.kpis.activeOrdersCount - 1),
    });

    store.setCurrentOrder({ status: "CANCELLED" });
    store.resetCurrentOrder();

    logFlow("cancelOrder", { orderId });
    return { success: true, orderId: orderId ?? undefined };
  }

  // ─── 7. Segurar pedido (hold) ────────────────────────────────────
  function holdOrder() {
    const store = getStore();
    store.setCurrentOrder({ status: "DRAFT" });
    logFlow("holdOrder", { orderId: store.currentOrder.orderId });
  }

  return {
    startOrder,
    addItem,
    sendToKitchen,
    finalizeOrder,
    confirmAndPay,
    cancelOrder,
    holdOrder,
  };
}
