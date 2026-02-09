/**
 * UberEatsAdapter — Integração com Uber Eats (HARDENED)
 *
 * Este adapter:
 * 1. Escuta eventos via Core Realtime (integration_webhook_events)
 * 2. Comanda sincronização via Core RPC (delivery-proxy)
 * 3. NÃO manipula segredos (Client Secret) no frontend
 *
 * Architecture: "Air Gapped" Frontend (mesma abordagem do GlovoAdapter)
 */

import { db } from "../../../core/db";
import {
  BackendType,
  getBackendType,
} from "../../../core/infra/backendAdapter";
import { getDockerCoreFetchClient } from "../../../core/infra/dockerCoreFetchClient";
import { isDevStableMode } from "../../../core/runtime/devStableMode";
import type {
  IntegrationAdapter,
  IntegrationCapability,
} from "../../core/IntegrationContract";
import type {
  IntegrationEvent,
  OrderCreatedEvent,
} from "../../types/IntegrationEvent";
import type { IntegrationStatus } from "../../types/IntegrationStatus";
import {
  createDegradedStatus,
  createHealthyStatus,
} from "../../types/IntegrationStatus";
import type { UberEatsOrder, UberEatsOrderItem } from "./UberEatsTypes";

type CoreRealtimeChannel = ReturnType<typeof db.channel>;

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const POLLING_INTERVAL_MS = 60_000;
const MAX_PROCESSED_ORDERS = 1000;

export interface UberEatsAdapterConfig {
  clientId?: string;
  restaurantId: string;
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────
// ADAPTER IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

export class UberEatsAdapter implements IntegrationAdapter {
  // Identity
  readonly id = "ubereats";
  readonly name = "Uber Eats";
  readonly description = "Integração com Uber Eats - Delivery Platform";
  readonly type = "delivery" as const;
  readonly capabilities: IntegrationCapability[] = [
    "orders.receive",
    "orders.status",
  ];

  // Config
  private config: UberEatsAdapterConfig | null = null;
  private realtimeChannel: CoreRealtimeChannel | null = null;

  // State
  private lastPollAt: number | null = null;
  private ordersReceived = 0;
  private ordersErrors = 0;
  private lastError: string | null = null;
  private processedOrderIds = new Set<string>();

  // Event callback
  private eventCallback: ((event: IntegrationEvent) => void) | null = null;

  // Backoff
  private currentPollInterval = POLLING_INTERVAL_MS;
  private readonly MAX_BACKOFF = 600_000;
  private pollTimeout: NodeJS.Timeout | null = null;

  // ───────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────

  async initialize(config?: UberEatsAdapterConfig): Promise<void> {
    this.config = config || null;

    if (!this.config?.restaurantId) {
      console.warn("[UberEats] Initialize called without restaurantId");
      return;
    }

    if (isDevStableMode()) return;

    // Load processed IDs
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ubereats_processed_ids");
        if (saved) this.processedOrderIds = new Set(JSON.parse(saved));
      } catch {
        /* ignored */
      }
    }

    // Realtime listener on integration_webhook_events
    if (typeof db.channel === "function") {
      const channelName = `ubereats-integration-${this.config.restaurantId}`;
      this.realtimeChannel = db
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "integration_webhook_events",
            filter: "provider=eq.ubereats",
          },
          (payload: { new?: unknown }) => {
            this.handleRealtimeWebhook(payload.new);
          },
        )
        .subscribe((status: string) => {
          console.log(`[UberEats] Realtime Status: ${status}`);
        });
    }

    console.log(
      `[UberEats] 🚀 Initialized (Proxy Mode) for restaurant: ${this.config.restaurantId}`,
    );

    if (config?.enabled !== false) {
      this.startPolling();
    }
  }

  async dispose(): Promise<void> {
    console.log("[UberEats] 👋 Disposed");
    this.stopPolling();
    if (this.realtimeChannel && typeof db.removeChannel === "function") {
      await db.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.config = null;
    this.eventCallback = null;

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ubereats_processed_ids",
        JSON.stringify(Array.from(this.processedOrderIds)),
      );
    }
    this.processedOrderIds.clear();
  }

  async onEvent(_event: IntegrationEvent): Promise<void> {
    // Status updates via proxy (future)
  }

  // ───────────────────────────────────────────────────────────
  // REALTIME HANDLER
  // ───────────────────────────────────────────────────────────

  private handleRealtimeWebhook(row: any): void {
    if (!row?.payload) return;

    const order = row.payload as UberEatsOrder;
    this.processIncomingOrder(order);
  }

  // ───────────────────────────────────────────────────────────
  // POLLING (PROXY)
  // ───────────────────────────────────────────────────────────

  private startPolling(): void {
    if (this.pollTimeout) return;
    console.log("[UberEats] 🔄 Starting polling (Proxy) with Backoff...");
    this.scheduleNextPoll(0);
  }

  private stopPolling(): void {
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
  }

  private scheduleNextPoll(delayMs: number): void {
    this.stopPolling();
    this.pollTimeout = setTimeout(() => {
      this.pollOrders();
    }, delayMs);
  }

  private async pollOrders(): Promise<void> {
    if (!this.config?.restaurantId) return;
    if (getBackendType() !== BackendType.docker) {
      this.lastError = "UberEats sync requires Docker Core.";
      this.scheduleNextPoll(this.currentPollInterval);
      return;
    }

    try {
      const core = getDockerCoreFetchClient();
      const res = await core.rpc("delivery-proxy", {
        action: "sync",
        provider: "ubereats",
        restaurantId: this.config.restaurantId,
      });

      if (res.error) throw res.error;

      const result = res.data as { created?: number } | null;
      if (result?.created && result.created > 0) {
        console.log(`[UberEats] Proxy Sync: Created ${result.created} orders`);
      }

      this.lastPollAt = Date.now();

      if (this.currentPollInterval > POLLING_INTERVAL_MS) {
        console.log("[UberEats] ✅ Polling recovered. Resetting interval.");
        this.currentPollInterval = POLLING_INTERVAL_MS;
      }
      this.scheduleNextPoll(this.currentPollInterval);
    } catch (err) {
      this.ordersErrors++;
      this.lastError = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[UberEats] ❌ Proxy Polling failed. Backing off to ${
          this.currentPollInterval * 2
        }ms`,
        err,
      );
      this.currentPollInterval = Math.min(
        this.currentPollInterval * 2,
        this.MAX_BACKOFF,
      );
      this.scheduleNextPoll(this.currentPollInterval);
    }
  }

  // ───────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ───────────────────────────────────────────────────────────

  async healthCheck(): Promise<IntegrationStatus> {
    if (this.lastError && Date.now() - (this.lastPollAt || 0) < 600_000) {
      return createDegradedStatus(`Last Sync Error: ${this.lastError}`);
    }
    return createHealthyStatus();
  }

  // ───────────────────────────────────────────────────────────
  // PUBLIC API — processIncomingOrder
  // ───────────────────────────────────────────────────────────

  /**
   * Processa um pedido UberEats recebido (webhook ou polling).
   * Valida, transforma e emite OrderCreatedEvent para o sistema.
   */
  processIncomingOrder(order: UberEatsOrder): {
    success: boolean;
    orderId?: string;
  } {
    if (!order?.id || !order.items || order.items.length === 0) {
      return { success: false };
    }
    if (order.status === "CANCELLED") {
      return { success: false };
    }

    const externalId = order.id;
    if (this.processedOrderIds.has(externalId)) {
      return { success: true, orderId: externalId };
    }

    this.ordersReceived++;
    this.trackProcessedOrderId(externalId);

    const internalEvent: OrderCreatedEvent = {
      type: "order.created",
      payload: {
        orderId: externalId,
        source: "delivery",
        customerName:
          `${order.customer?.first_name ?? ""} ${
            order.customer?.last_name ?? ""
          }`.trim() || "Cliente UberEats",
        customerPhone: order.customer?.phone,
        totalCents: Math.round((order.total || 0) * 100),
        items: (order.items || []).map((item: UberEatsOrderItem) => ({
          id: item.id || "unknown",
          name: item.name || "Unknown Item",
          quantity: item.quantity || 1,
          priceCents: Math.round((item.price || 0) * 100),
        })),
        createdAt: new Date(order.created_at || Date.now()).getTime(),
        metadata: {
          ubereatsId: externalId,
          address: order.delivery?.address,
          city: order.delivery?.city,
          currency: order.currency || "EUR",
        },
      },
    };

    this.emitToSystem(internalEvent);
    return { success: true, orderId: externalId };
  }

  /**
   * Transformar pedido Uber Eats para formato interno (compatibilidade)
   */
  transformOrder(uberOrder: UberEatsOrder): {
    external_id: string;
    source: string;
    restaurant_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address: string;
    items: any[];
    total_cents: number;
    currency: string;
    status: string;
  } {
    return {
      external_id: uberOrder.id,
      source: "ubereats",
      restaurant_id: this.config?.restaurantId || "",
      customer_name:
        `${uberOrder.customer.first_name} ${uberOrder.customer.last_name}`.trim(),
      customer_phone: uberOrder.customer.phone,
      customer_email: uberOrder.customer.email,
      delivery_address: uberOrder.delivery.address,
      items: uberOrder.items.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
      })),
      total_cents: Math.round(uberOrder.total * 100),
      currency: uberOrder.currency,
      status: uberOrder.status,
    };
  }

  // ───────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────

  private trackProcessedOrderId(externalId: string): void {
    if (this.processedOrderIds.size >= MAX_PROCESSED_ORDERS) {
      this.processedOrderIds.clear();
    }
    this.processedOrderIds.add(externalId);
  }

  private emitToSystem(event: IntegrationEvent): void {
    if (this.eventCallback) {
      try {
        this.eventCallback(event);
      } catch (err) {
        console.error("[UberEats] ❌ Error emitting event:", err);
      }
    }
  }

  setEventCallback(callback: (event: IntegrationEvent) => void): void {
    this.eventCallback = callback;
  }
}
