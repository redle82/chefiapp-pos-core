/**
 * MockDeliveryAdapter — Instrumento de verificação sistêmica
 *
 * NÃO é adapter de brincadeira. É ferramenta de validação:
 * - Registry funciona?
 * - EventBus propaga?
 * - TPV reage?
 * - Staff recebe task?
 * - Manager vê status?
 * - Falhas são observáveis?
 *
 * Se MockAdapter passar, qualquer parceiro real entra sem dor.
 */

import type {
  IntegrationAdapter,
  IntegrationCapability,
} from "../core/IntegrationContract";
import type { IntegrationEvent } from "../types/IntegrationEvent";
import type { IntegrationStatus } from "../types/IntegrationStatus";
import {
  createDegradedStatus,
  createDownStatus,
  createHealthyStatus,
} from "../types/IntegrationStatus";

// ─────────────────────────────────────────────────────────────
// MOCK ORDER TYPES
// ─────────────────────────────────────────────────────────────

export interface MockOrderItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface MockOrder {
  orderId: string;
  channel: "mock-delivery";
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: MockOrderItem[];
  total: number;
  createdAt: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
}

// ─────────────────────────────────────────────────────────────
// SAMPLE DATA (realistic para trial)
// ─────────────────────────────────────────────────────────────

const SAMPLE_ITEMS: MockOrderItem[] = [
  { sku: "burger-classic", name: "Classic Burger", qty: 1, unitPrice: 18.9 },
  { sku: "fries-large", name: "Batata Grande", qty: 1, unitPrice: 12.0 },
  { sku: "coke-zero", name: "Coca Zero 350ml", qty: 2, unitPrice: 6.0 },
  {
    sku: "milkshake-choc",
    name: "Milkshake Chocolate",
    qty: 1,
    unitPrice: 15.0,
  },
  { sku: "onion-rings", name: "Onion Rings", qty: 1, unitPrice: 14.0 },
];

const SAMPLE_CUSTOMERS = [
  {
    name: "João Silva",
    phone: "11999001234",
    address: "Rua Augusta 1500, Consolação",
  },
  {
    name: "Maria Santos",
    phone: "11988765432",
    address: "Av. Paulista 1000, Bela Vista",
  },
  {
    name: "Pedro Oliveira",
    phone: "11977654321",
    address: "Rua Oscar Freire 800, Jardins",
  },
  {
    name: "Ana Costa",
    phone: "11966543210",
    address: "Rua Haddock Lobo 400, Cerqueira César",
  },
];

// ─────────────────────────────────────────────────────────────
// ADAPTER IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

type MockAdapterState = "disconnected" | "connected" | "degraded" | "error";

export class MockDeliveryAdapter implements IntegrationAdapter {
  // Identity
  readonly id = "mock-delivery";
  readonly name = "Mock Delivery (Dev)";
  readonly type = "delivery" as const;
  readonly capabilities: IntegrationCapability[] = [
    "orders.receive",
    "orders.send",
    "delivery.track",
  ];

  // State
  private state: MockAdapterState = "disconnected";
  private orders: Map<string, MockOrder> = new Map();
  private eventCount = 0;
  private lastEventAt: number | null = null;
  private errorCount = 0;

  // Event listener (set by registry)
  private eventCallback: ((event: IntegrationEvent) => void) | null = null;

  // ───────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    console.log(`[MockDelivery] 🚀 Initializing...`);
    this.state = "connected";
    this.emitHealthEvent("ok");
    console.log(`[MockDelivery] ✅ Connected`);
  }

  async dispose(): Promise<void> {
    console.log(`[MockDelivery] 👋 Disposing...`);
    this.state = "disconnected";
    this.orders.clear();
    this.eventCallback = null;
  }

  // ───────────────────────────────────────────────────────────
  // EVENT HANDLING
  // ───────────────────────────────────────────────────────────

  async onEvent(event: IntegrationEvent): Promise<void> {
    // MockAdapter pode reagir a eventos do sistema se necessário
    // Por exemplo: order.completed vindo do TPV
    if (event.type === "order.completed") {
      const order = this.orders.get(event.payload.orderId);
      if (order) {
        order.status = "delivered";
        console.log(
          `[MockDelivery] 📦 Order ${order.orderId} marked as delivered`,
        );
      }
    }
  }

  // ───────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ───────────────────────────────────────────────────────────

  async healthCheck(): Promise<IntegrationStatus> {
    const now = Date.now();

    if (this.state === "disconnected") {
      return createDownStatus("Adapter not initialized");
    }

    if (this.state === "error") {
      return createDownStatus("Simulated error state");
    }

    if (this.state === "degraded") {
      return createDegradedStatus("Simulated degraded state", {
        eventsProcessed: this.eventCount,
        lastEventAt: this.lastEventAt,
        errorCount: this.errorCount,
      });
    }

    return createHealthyStatus({
      eventsProcessed: this.eventCount,
      lastEventAt: this.lastEventAt,
      errorCount: this.errorCount,
      ordersInFlight: this.orders.size,
    });
  }

  // ───────────────────────────────────────────────────────────
  // MOCK ACTIONS (DEV TOOLS)
  // ───────────────────────────────────────────────────────────

  /**
   * Simula um novo pedido de delivery
   */
  simulateNewOrder(): MockOrder {
    const customer =
      SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: MockOrderItem[] = [];

    for (let i = 0; i < numItems; i++) {
      const item = {
        ...SAMPLE_ITEMS[Math.floor(Math.random() * SAMPLE_ITEMS.length)],
      };
      item.qty = Math.floor(Math.random() * 2) + 1;
      items.push(item);
    }

    const order: MockOrder = {
      orderId: `MOCK-${Date.now().toString(36).toUpperCase()}`,
      channel: "mock-delivery",
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: customer.address,
      items,
      total: items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
      createdAt: Date.now(),
      status: "pending",
    };

    this.orders.set(order.orderId, order);
    this.trackEvent();

    // Emit event to system
    this.emitToSystem({
      type: "order.created",
      timestamp: Date.now(),
      payload: {
        orderId: order.orderId,
        source: this.id,
        channel: "delivery",
        customerName: order.customerName,
        items: order.items.map((i) => ({
          sku: i.sku,
          name: i.name,
          quantity: i.qty,
          unitPrice: i.unitPrice,
        })),
        total: order.total,
        metadata: {
          phone: order.customerPhone,
          address: order.deliveryAddress,
        },
      },
    });

    console.log(
      `[MockDelivery] 📥 New order: ${order.orderId} - R$${order.total.toFixed(
        2,
      )}`,
    );
    return order;
  }

  /**
   * Simula cancelamento de pedido
   */
  simulateCancelOrder(orderId?: string): void {
    const id = orderId || Array.from(this.orders.keys())[0];
    const order = this.orders.get(id);

    if (!order) {
      console.warn(`[MockDelivery] ⚠️ No order to cancel`);
      return;
    }

    order.status = "cancelled";
    this.trackEvent();

    this.emitToSystem({
      type: "order.updated",
      timestamp: Date.now(),
      payload: {
        orderId: order.orderId,
        source: this.id,
        previousStatus: "pending",
        newStatus: "cancelled",
        reason: "Customer requested cancellation",
      },
    });

    console.log(`[MockDelivery] ❌ Order cancelled: ${order.orderId}`);
  }

  /**
   * Simula atraso na entrega
   */
  simulateDeliveryDelay(orderId?: string): void {
    const id = orderId || Array.from(this.orders.keys())[0];
    const order = this.orders.get(id);

    if (!order) {
      console.warn(`[MockDelivery] ⚠️ No order to delay`);
      return;
    }

    this.trackEvent();

    this.emitToSystem({
      type: "delivery.status",
      timestamp: Date.now(),
      payload: {
        orderId: order.orderId,
        source: this.id,
        status: "delayed",
        estimatedDelivery: Date.now() + 45 * 60 * 1000, // +45min
        currentLocation: { lat: -23.5505, lng: -46.6333 },
        driverName: "Carlos (Mock)",
        message: "Atraso devido ao trânsito intenso",
      },
    });

    console.log(`[MockDelivery] 🕐 Delivery delayed: ${order.orderId}`);
  }

  /**
   * Simula falha de integração (para testar observabilidade)
   */
  simulateFailure(): void {
    this.state = "error";
    this.errorCount++;
    this.trackEvent();
    this.emitHealthEvent("down");
    console.log(`[MockDelivery] 💥 Simulated failure!`);
  }

  /**
   * Simula degradação (lentidão)
   */
  simulateDegradation(): void {
    this.state = "degraded";
    this.trackEvent();
    this.emitHealthEvent("degraded");
    console.log(`[MockDelivery] ⚠️ Simulated degradation`);
  }

  /**
   * Recupera de falha/degradação
   */
  recover(): void {
    this.state = "connected";
    this.trackEvent();
    this.emitHealthEvent("ok");
    console.log(`[MockDelivery] ✅ Recovered`);
  }

  // ───────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ───────────────────────────────────────────────────────────

  private trackEvent(): void {
    this.eventCount++;
    this.lastEventAt = Date.now();
  }

  private emitToSystem(event: IntegrationEvent): void {
    if (this.eventCallback) {
      this.eventCallback(event);
    }
  }

  private emitHealthEvent(status: "ok" | "degraded" | "down"): void {
    // Health events podem ser logados ou enviados para monitoramento
    console.log(`[MockDelivery] 💓 Health: ${status}`);
  }

  /**
   * Registry calls this to wire up event emission
   */
  setEventCallback(callback: (event: IntegrationEvent) => void): void {
    this.eventCallback = callback;
  }

  // ───────────────────────────────────────────────────────────
  // GETTERS (for UI)
  // ───────────────────────────────────────────────────────────

  getState(): MockAdapterState {
    return this.state;
  }

  getOrders(): MockOrder[] {
    return Array.from(this.orders.values());
  }

  getStats() {
    return {
      eventCount: this.eventCount,
      lastEventAt: this.lastEventAt,
      errorCount: this.errorCount,
      ordersInFlight: this.orders.size,
      state: this.state,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────

export const mockDeliveryAdapter = new MockDeliveryAdapter();
