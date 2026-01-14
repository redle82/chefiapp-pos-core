/**
 * GlovoAdapter — Integração com Glovo (HARDENED)
 * 
 * Este adapter:
 * 1. Escuta eventos via Supabase Realtime (integration_orders)
 * 2. Comanda sincronização via Edge Function (delivery-proxy)
 * 3. NÃO manipula segredos (Client Secret) no frontend
 * 
 * Architecture: "Air Gapped" Frontend
 */

import type { IntegrationAdapter, IntegrationCapability } from '../../core/IntegrationContract';
import type { IntegrationEvent, OrderCreatedEvent } from '../../types/IntegrationEvent';
import type { IntegrationStatus } from '../../types/IntegrationStatus';
import { createHealthyStatus, createDegradedStatus, createDownStatus } from '../../types/IntegrationStatus';
import type {
  GlovoOrder,
  GlovoConfig,
} from './GlovoTypes';
import { isValidGlovoOrder, isPendingOrder, isCancelledOrder } from './GlovoTypes';
import { supabase } from '../../core/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  readonly id = 'glovo';
  readonly name = 'Glovo';
  readonly description = 'Integração com Glovo - Delivery Platform';
  readonly type = 'delivery' as const;
  readonly capabilities: IntegrationCapability[] = [
    'orders.receive',
  ];

  // Config
  private config: GlovoConfig | null = null;
  private realtimeChannel: RealtimeChannel | null = null;

  // State
  private lastPollAt: number | null = null;
  private ordersReceived = 0;
  private ordersErrors = 0;
  private lastError: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private processedOrderIds = new Set<string>(); // Client-side de-dupe memory

  // Event callback (set by Registry)
  private eventCallback: ((event: IntegrationEvent) => void) | null = null;

  // ───────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────

  async initialize(config?: GlovoConfig): Promise<void> {
    this.config = config || null;

    if (!this.config?.restaurantId) {
      console.warn('[Glovo] Initialize called without restaurantId');
      return;
    }

    // Load processed IDs
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('glovo_processed_ids');
        if (saved) {
          this.processedOrderIds = new Set(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('[Glovo] Failed to load processed IDs', e);
      }
    }

    // 1. SETUP REALTIME LISTENER (The Primary Channel)
    // Escuta tabela `integration_orders` para novos pedidos deste restaurante/source
    const channelName = `glovo-integration-${this.config.restaurantId}`;
    this.realtimeChannel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_orders',
          filter: `source=eq.glovo`,
          // Note: RLS might filter by restaurant_id automatically if policy strictly enforces it via user.
          // Ideally filter by restaurant_id too if possible in realtime, or check payload.
        },
        (payload) => {
          this.handleRealtimeOrder(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`[Glovo] Realtime Status: ${status}`);
      });

    console.log(`[Glovo] 🚀 Initialized (Proxy Mode) for restaurant: ${config.restaurantId}`);

    // 2. POLLING VIA PROXY (Fallback / Force Sync)
    if (config?.enabled !== false) {
      this.startPolling();
    }
  }

  async dispose(): Promise<void> {
    console.log('[Glovo] 👋 Disposed');
    this.stopPolling();
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.config = null;
    this.eventCallback = null;

    if (typeof window !== 'undefined') {
      localStorage.setItem('glovo_processed_ids', JSON.stringify(Array.from(this.processedOrderIds)));
    }
    this.processedOrderIds.clear();
  }

  // ───────────────────────────────────────────────────────────
  // EVENT HANDLING (outgoing events from system)
  // ───────────────────────────────────────────────────────────

  async onEvent(event: IntegrationEvent): Promise<void> {
    // Implementar update status via Proxy se necessário
  }

  // ───────────────────────────────────────────────────────────
  // REALTIME HANDLER
  // ───────────────────────────────────────────────────────────

  private handleRealtimeOrder(row: any): void {
    // Validate Logic Match
    if (this.config?.restaurantId && row.restaurant_id && row.restaurant_id !== this.config.restaurantId) {
      return; // Ignora pedidos de outros restaurantes (safety check)
    }

    const externalId = row.external_id;

    // De-dupe Client Side (extra safety layer)
    if (this.processedOrderIds.has(externalId)) {
      return;
    }

    console.log(`[Glovo] 📨 Realtime Order Received: ${row.reference}`);
    this.ordersReceived++;
    this.processedOrderIds.add(externalId);

    // Convert DB Row -> Internal Event
    // O raw_payload deve conter o objeto Glovo original se disponível
    let originalOrder: GlovoOrder | null = null;
    if (row.raw_payload) {
      originalOrder = row.raw_payload as GlovoOrder;
    }

    // Se tiver raw_payload, usa transformItems original
    // Se não, usa colunas da tabela
    // Aqui usamos uma transformação híbrida simplificada

    const internalEvent: OrderCreatedEvent = {
      type: 'order.created',
      payload: {
        orderId: externalId,
        source: 'delivery',
        customerName: row.customer_name || 'Unknown',
        customerPhone: row.customer_phone,
        totalCents: row.total_cents || 0,
        items: row.items ? this.transformItemsFromDb(row.items) : [],
        createdAt: new Date(row.received_at || Date.now()).getTime(),
        metadata: {
          glovoId: externalId,
          address: row.delivery_address,
          instructions: row.instructions,
          currency: row.currency || 'EUR',
          deliveryType: row.delivery_type
        }
      }
    };

    this.emitToSystem(internalEvent);
  }

  // ───────────────────────────────────────────────────────────
  // POLLING (PROXY)
  // ───────────────────────────────────────────────────────────

  private startPolling(): void {
    if (this.pollingInterval) return;

    console.log('[Glovo] 🔄 Starting polling (Proxy)...');
    this.pollOrders(); // Immediate

    this.pollingInterval = setInterval(() => {
      this.pollOrders();
    }, POLLING_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async pollOrders(): Promise<void> {
    if (!this.config?.restaurantId) return;

    try {
      const { data, error } = await supabase.functions.invoke('delivery-proxy', {
        body: {
          action: 'sync',
          provider: 'glovo',
          restaurantId: this.config.restaurantId
        }
      });

      if (error) throw error;

      if (data && data.created > 0) {
        console.log(`[Glovo] Proxy Sync: Created ${data.created} orders`);
      }

      this.lastPollAt = Date.now();

    } catch (err) {
      this.ordersErrors++;
      this.lastError = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Glovo] ❌ Proxy Polling failed:', err);
    }
  }


  // ───────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ───────────────────────────────────────────────────────────

  async healthCheck(): Promise<IntegrationStatus> {
    // Simplified Health Check
    if (this.lastError && (Date.now() - (this.lastPollAt || 0) < 600000)) {
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
    return items.map(item => ({
      id: item.id || 'unknown',
      name: item.name || 'Unknown Item',
      quantity: item.quantity || 1,
      priceCents: Math.round((item.price || 0) * 100) // Ensure cents
    }));
  }

  private emitToSystem(event: IntegrationEvent): void {
    if (this.eventCallback) {
      try {
        this.eventCallback(event);
      } catch (err) {
        console.error('[Glovo] ❌ Error emitting event:', err);
      }
    }
  }

  setEventCallback(callback: (event: IntegrationEvent) => void): void {
    this.eventCallback = callback;
  }
}
