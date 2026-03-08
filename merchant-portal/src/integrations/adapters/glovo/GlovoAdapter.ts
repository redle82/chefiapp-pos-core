/**
 * GlovoAdapter — Integração com Glovo (HARDENED)
 *
 * Este adapter:
 * 1. Escuta eventos via Core Realtime (integration_orders)
 * 2. Comanda sincronização via Edge Function (delivery-proxy)
 * 3. NÃO manipula segredos (Client Secret) no frontend
 *
 * Architecture: "Air Gapped" Frontend
 */

import { currencyService } from "../../../core/currency/CurrencyService";
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
import type { GlovoConfig, GlovoOrder } from "./GlovoTypes";
import { isPendingOrder, isValidGlovoOrder } from "./GlovoTypes";

/** Canal Realtime do Core (noop ou PostgREST Realtime). */
type CoreRealtimeChannel = ReturnType<typeof db.channel>;

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const POLLING_INTERVAL_MS = 60000; // 60 segundos (menos agressivo via Proxy)
const MAX_PROCESSED_ORDERS = 1000;

// ─────────────────────────────────────────────────────────────
// ADAPTER IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

export class GlovoAdapter implements IntegrationAdapter {
  // Identity
  readonly id = "glovo";
  readonly name = "Glovo";
  readonly description = "Integração com Glovo - Delivery Platform";
  readonly type = "delivery" as const;
  readonly capabilities: IntegrationCapability[] = ["orders.receive"];

  // Config
  private config: GlovoConfig | null = null;
  private realtimeChannel: CoreRealtimeChannel | null = null;

  // State
  private lastPollAt: number | null = null;
  private ordersReceived = 0;
  private ordersErrors = 0;
  private lastError: string | null = null;
  // private pollingInterval: NodeJS.Timeout | null = null; // Replaced by pollTimeout
  private processedOrderIds = new Set<string>(); // Client-side de-dupe memory

  // Event callback (set by Registry)
  private eventCallback: ((event: IntegrationEvent) => void) | null = null;

  // ───────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────

  async initialize(config?: GlovoConfig): Promise<void> {
    this.config = config || null;

    if (!this.config?.restaurantId) {
      console.warn("[Glovo] Initialize called without restaurantId");
      return;
    }

    // STEP 6: DEV_STABLE_MODE - no realtime, no polling
    if (isDevStableMode()) {
      return;
    }

    // Load processed IDs
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("glovo_processed_ids");
        if (saved) {
          this.processedOrderIds = new Set(JSON.parse(saved));
        }
      } catch (e) {
        console.warn("[Glovo] Failed to load processed IDs", e);
      }
    }

    // 1. SETUP REALTIME LISTENER (The Primary Channel) — skip when channel not available (e.g. tests/shim)
    if (typeof db.channel === "function") {
      const channelName = `glovo-integration-${this.config.restaurantId}`;
      this.realtimeChannel = db
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "integration_orders",
            filter: `source=eq.glovo`,
          },
          (payload: { new?: unknown }) => {
            this.handleRealtimeOrder(payload.new);
          },
        )
        .subscribe((status: string) => {
          console.log(`[Glovo] Realtime Status: ${status}`);
        });
    }

    console.log(
      `[Glovo] 🚀 Initialized (Proxy Mode) for restaurant: ${
        config?.restaurantId ?? this.config?.restaurantId
      }`,
    );

    // 2. POLLING VIA PROXY (Fallback / Force Sync)
    if (config?.enabled !== false) {
      this.startPolling();
    }
  }

  async dispose(): Promise<void> {
    console.log("[Glovo] 👋 Disposed");
    this.stopPolling();
    if (this.realtimeChannel && typeof db.removeChannel === "function") {
      await db.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.config = null;
    this.eventCallback = null;

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "glovo_processed_ids",
        JSON.stringify(Array.from(this.processedOrderIds)),
      );
    }
    this.processedOrderIds.clear();
  }

  // ───────────────────────────────────────────────────────────
  // EVENT HANDLING (outgoing events from system)
  // ───────────────────────────────────────────────────────────

  async onEvent(_event: IntegrationEvent): Promise<void> {
    // Implementar update status via Proxy se necessário
  }

  // ───────────────────────────────────────────────────────────
  // REALTIME HANDLER
  // ───────────────────────────────────────────────────────────

  private handleRealtimeOrder(row: any): void {
    // Validate Logic Match
    if (
      this.config?.restaurantId &&
      row.restaurant_id &&
      row.restaurant_id !== this.config.restaurantId
    ) {
      return; // Ignora pedidos de outros restaurantes (safety check)
    }

    const externalId = row.external_id;

    // De-dupe Client Side (extra safety layer)
    if (this.processedOrderIds.has(externalId)) {
      return;
    }

    console.log(`[Glovo] 📨 Realtime Order Received: ${row.reference}`);
    this.ordersReceived++;
    this.trackProcessedOrderId(externalId);

    // Se tiver raw_payload, usa transformItems original
    // Se não, usa colunas da tabela
    // Aqui usamos uma transformação híbrida simplificada

    const internalEvent: OrderCreatedEvent = {
      type: "order.created",
      payload: {
        orderId: externalId,
        source: "delivery",
        customerName: row.customer_name || "Unknown",
        customerPhone: row.customer_phone,
        totalCents: row.total_cents || 0,
        items: row.items ? this.transformItemsFromDb(row.items) : [],
        createdAt: new Date(row.received_at || Date.now()).getTime(),
        metadata: {
          glovoId: externalId,
          address: row.delivery_address,
          instructions: row.instructions,
          currency: row.currency || currencyService.getDefaultCurrency(),
          deliveryType: row.delivery_type,
        },
      },
    };

    this.emitToSystem(internalEvent);
  }

  // ───────────────────────────────────────────────────────────
  // POLLING (PROXY)
  // ───────────────────────────────────────────────────────────

  // Backoff State
  private currentPollInterval = POLLING_INTERVAL_MS;
  private readonly MAX_BACKOFF = 600000; // 10 minutes max backoff
  private pollTimeout: NodeJS.Timeout | null = null;

  // ───────────────────────────────────────────────────────────
  // POLLING (PROXY)
  // ───────────────────────────────────────────────────────────

  private startPolling(): void {
    if (this.pollTimeout) return;
    console.log("[Glovo] 🔄 Starting polling (Proxy) with Backoff...");
    this.scheduleNextPoll(0); // Immediate
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
      this.lastError =
        "Glovo sync requires Docker Core. Backend not configured or not Docker.";
      this.scheduleNextPoll(this.currentPollInterval);
      return;
    }

    try {
      const core = getDockerCoreFetchClient();
      const res = await core.rpc("delivery-proxy", {
        action: "sync",
        provider: "glovo",
        restaurantId: this.config.restaurantId,
      });

      if (res.error) throw res.error;

      const result = res.data as { created?: number } | null;
      if (result && result.created != null && result.created > 0) {
        console.log(`[Glovo] Proxy Sync: Created ${result.created} orders`);
      }

      this.lastPollAt = Date.now();

      // Success: Reset Backoff
      if (this.currentPollInterval > POLLING_INTERVAL_MS) {
        console.log("[Glovo] ✅ Polling recovered. Resetting interval.");
        this.currentPollInterval = POLLING_INTERVAL_MS;
      }
      this.scheduleNextPoll(this.currentPollInterval);
    } catch (err) {
      this.ordersErrors++;
      this.lastError = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[Glovo] ❌ Proxy Polling failed. Backing off to ${
          this.currentPollInterval * 2
        }ms`,
        err,
      );

      // Failure: Exponential Backoff
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
    // Simplified Health Check
    if (this.lastError && Date.now() - (this.lastPollAt || 0) < 600000) {
      return createDegradedStatus(`Last Sync Error: ${this.lastError}`);
    }
    return createHealthyStatus();
  }

  // ───────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────

  private transformItemsFromDb(items: any[]): any[] {
    // Format check
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      id: item.id || "unknown",
      name: item.name || "Unknown Item",
      quantity: item.quantity || 1,
      priceCents: Math.round((item.price || 0) * 100), // Ensure cents
    }));
  }

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
        console.error("[Glovo] ❌ Error emitting event:", err);
      }
    }
  }

  setEventCallback(callback: (event: IntegrationEvent) => void): void {
    this.eventCallback = callback;
  }

  /**
   * Processa um pedido Glovo recebido (webhook ou teste).
   * Valida, transforma e emite OrderCreatedEvent para o sistema.
   * Usado por Edge Function (webhook) e testes de integração.
   */
  processIncomingOrder(order: GlovoOrder): {
    success: boolean;
    orderId?: string;
  } {
    if (!isValidGlovoOrder(order) || !isPendingOrder(order)) {
      return { success: false };
    }
    if (
      this.config?.restaurantId &&
      order.restaurant_id &&
      order.restaurant_id !== this.config.restaurantId
    ) {
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
        customerName: order.customer?.name || "Unknown",
        customerPhone: order.customer?.phone,
        totalCents: Math.round((order.total || 0) * 100),
        items: (order.items || []).map((item) => ({
          id: item.id || "unknown",
          name: item.name || "Unknown Item",
          quantity: item.quantity || 1,
          priceCents: Math.round((item.price || 0) * 100),
        })),
        createdAt: new Date(order.created_at || Date.now()).getTime(),
        metadata: {
          glovoId: externalId,
          address: order.delivery?.address?.address,
          instructions: order.delivery?.address?.instructions,
          currency: order.currency || currencyService.getDefaultCurrency(),
        },
      },
    };

    this.emitToSystem(internalEvent);
    return { success: true, orderId: externalId };
  }
}
