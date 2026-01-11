/**
 * GloriaFoodAdapter — Integração com GloriaFood (Oracle Food Delivery Cloud)
 * 
 * Este adapter:
 * 1. Recebe webhooks de pedidos do GloriaFood
 * 2. Transforma em eventos internos (order.created)
 * 3. NÃO faz push de status (one-way por agora)
 * 
 * Funciona com:
 * - GloriaFood direto
 * - Marketplaces que usam GloriaFood (Oracle)
 * - Clones com mesmo formato de webhook
 */

import type { IntegrationAdapter, IntegrationCapability } from '../../core/IntegrationContract';
import type { IntegrationEvent, OrderCreatedEvent } from '../../types/IntegrationEvent';
import type { IntegrationStatus } from '../../types/IntegrationStatus';
import { createHealthyStatus, createDegradedStatus, createDownStatus } from '../../types/IntegrationStatus';
import type { 
  GloriaFoodWebhookPayload, 
  GloriaFoodOrder,
  GloriaFoodOrderItem,
} from './GloriaFoodTypes';
import { isValidGloriaFoodPayload, isNewOrderEvent, isCancellationEvent } from './GloriaFoodTypes';

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

export interface GloriaFoodConfig {
  restaurantId: string;
  webhookSecret?: string;  // Para validação HMAC
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────
// ADAPTER IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

export class GloriaFoodAdapter implements IntegrationAdapter {
  // Identity
  readonly id = 'gloriafood';
  readonly name = 'GloriaFood';
  readonly description = 'Integração com GloriaFood/Oracle Food Delivery';
  readonly type = 'delivery' as const;
  readonly capabilities: IntegrationCapability[] = [
    'orders.receive',
    // 'orders.send' não implementado ainda (one-way)
  ];

  // Config
  private config: GloriaFoodConfig | null = null;

  // State
  private lastWebhookAt: number | null = null;
  private webhooksReceived = 0;
  private webhookErrors = 0;
  private ordersProcessed = 0;
  private lastError: string | null = null;

  // Event callback (set by Registry)
  private eventCallback: ((event: IntegrationEvent) => void) | null = null;

  // ───────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────

  async initialize(config?: GloriaFoodConfig): Promise<void> {
    if (!config?.restaurantId) {
      console.warn('[GloriaFood] ⚠️ No restaurantId configured. Adapter will accept all webhooks.');
    }
    
    this.config = config || { restaurantId: '*' };
    console.log(`[GloriaFood] 🚀 Initialized for restaurant: ${this.config.restaurantId}`);
  }

  async dispose(): Promise<void> {
    console.log('[GloriaFood] 👋 Disposed');
    this.config = null;
    this.eventCallback = null;
  }

  // ───────────────────────────────────────────────────────────
  // EVENT HANDLING (outgoing events from system)
  // ───────────────────────────────────────────────────────────

  async onEvent(event: IntegrationEvent): Promise<void> {
    // Por agora, GloriaFood é one-way (só recebe)
    // Futuro: order.completed → API call para atualizar status
    
    if (event.type === 'order.completed') {
      console.log(`[GloriaFood] 📤 Would update order ${event.payload.orderId} to completed`);
      // TODO: Implementar API call para GloriaFood
    }
  }

  // ───────────────────────────────────────────────────────────
  // WEBHOOK HANDLER (incoming orders)
  // ───────────────────────────────────────────────────────────

  /**
   * Processa webhook recebido do GloriaFood
   * 
   * @param payload - Payload raw do webhook
   * @returns true se processado com sucesso
   */
  handleWebhook(payload: unknown): { success: boolean; error?: string; orderId?: string } {
    this.webhooksReceived++;
    this.lastWebhookAt = Date.now();

    try {
      // 1. Validar estrutura
      if (!isValidGloriaFoodPayload(payload)) {
        this.webhookErrors++;
        this.lastError = 'Invalid payload structure';
        console.error('[GloriaFood] ❌ Invalid webhook payload');
        return { success: false, error: 'Invalid payload structure' };
      }

      const webhookData = payload as GloriaFoodWebhookPayload;
      const order = webhookData.data.order;

      // 2. Validar restaurantId (se configurado)
      if (this.config?.restaurantId !== '*' && order.restaurant_id !== this.config?.restaurantId) {
        console.warn(`[GloriaFood] ⚠️ Order for different restaurant: ${order.restaurant_id}`);
        return { success: false, error: 'Restaurant ID mismatch' };
      }

      // 3. Processar por tipo de evento
      if (isNewOrderEvent(webhookData)) {
        return this.processNewOrder(order);
      }

      if (isCancellationEvent(webhookData)) {
        return this.processCancellation(order);
      }

      // Outros eventos (accepted, ready, etc.) - log only por agora
      console.log(`[GloriaFood] 📨 Event: ${webhookData.event} for order ${order.id}`);
      return { success: true, orderId: order.id };

    } catch (err) {
      this.webhookErrors++;
      this.lastError = err instanceof Error ? err.message : 'Unknown error';
      console.error('[GloriaFood] ❌ Webhook processing failed:', err);
      return { success: false, error: this.lastError };
    }
  }

  /**
   * Processa novo pedido
   */
  private processNewOrder(order: GloriaFoodOrder): { success: boolean; orderId: string } {
    console.log(`[GloriaFood] 📥 New order: ${order.reference} (${order.id})`);

    // Transform para evento interno
    const internalEvent: OrderCreatedEvent = {
      type: 'order.created',
      timestamp: Date.now(),
      payload: {
        orderId: order.id,
        source: 'gloriafood',
        channel: order.delivery.type === 'delivery' ? 'delivery' : 
                 order.delivery.type === 'pickup' ? 'pickup' : 'dine_in',
        customerName: `${order.customer.first_name} ${order.customer.last_name}`.trim(),
        items: this.transformItems(order.items),
        total: order.payment.total / 100, // Centavos → Reais
        metadata: {
          gloriaFoodId: order.id,
          reference: order.reference,
          phone: order.customer.phone,
          email: order.customer.email,
          address: order.customer.address ? this.formatAddress(order.customer.address) : undefined,
          deliveryType: order.delivery.type,
          estimatedMinutes: order.delivery.estimated_time,
          paymentMethod: order.payment.method,
          paymentStatus: order.payment.status,
          instructions: order.instructions,
        },
      },
    };

    // Emit para o sistema
    this.emitToSystem(internalEvent);
    this.ordersProcessed++;

    return { success: true, orderId: order.id };
  }

  /**
   * Processa cancelamento
   */
  private processCancellation(order: GloriaFoodOrder): { success: boolean; orderId: string } {
    console.log(`[GloriaFood] ❌ Order cancelled: ${order.reference} (${order.id})`);

    this.emitToSystem({
      type: 'order.updated',
      timestamp: Date.now(),
      payload: {
        orderId: order.id,
        source: 'gloriafood',
        previousStatus: 'pending',
        newStatus: 'cancelled',
        reason: 'Cancelled via GloriaFood',
      },
    });

    return { success: true, orderId: order.id };
  }

  // ───────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ───────────────────────────────────────────────────────────

  async healthCheck(): Promise<IntegrationStatus> {
    // Verifica se recebeu webhook nas últimas 24h (se esperado)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const metrics = {
      webhooksReceived: this.webhooksReceived,
      webhookErrors: this.webhookErrors,
      ordersProcessed: this.ordersProcessed,
      lastWebhookAt: this.lastWebhookAt,
      errorRate: this.webhooksReceived > 0 
        ? (this.webhookErrors / this.webhooksReceived * 100).toFixed(1) + '%' 
        : '0%',
    };

    // Se muitos erros recentes
    if (this.webhooksReceived > 10 && this.webhookErrors / this.webhooksReceived > 0.3) {
      return createDegradedStatus('High error rate on webhooks', metrics);
    }

    // Se não recebeu webhook em muito tempo E já recebeu antes
    if (this.lastWebhookAt && this.lastWebhookAt < oneDayAgo && this.webhooksReceived > 0) {
      return createDegradedStatus('No webhooks received in 24h', metrics);
    }

    // Se tem erro recente
    if (this.lastError) {
      return createHealthyStatus({ ...metrics, lastError: this.lastError });
    }

    return createHealthyStatus(metrics);
  }

  // ───────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────

  private transformItems(items: GloriaFoodOrderItem[]): Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }> {
    return items.map(item => ({
      sku: item.id,
      name: item.name + (item.instructions ? ` (${item.instructions})` : ''),
      quantity: item.quantity,
      unitPrice: item.price / 100, // Centavos → Reais
    }));
  }

  private formatAddress(addr: { 
    street: string; 
    city: string; 
    instructions?: string 
  }): string {
    let formatted = `${addr.street}, ${addr.city}`;
    if (addr.instructions) {
      formatted += ` - ${addr.instructions}`;
    }
    return formatted;
  }

  private emitToSystem(event: IntegrationEvent): void {
    if (this.eventCallback) {
      this.eventCallback(event);
    }
  }

  /**
   * Registry calls this to wire up event emission
   */
  setEventCallback(callback: (event: IntegrationEvent) => void): void {
    this.eventCallback = callback;
  }

  // ───────────────────────────────────────────────────────────
  // GETTERS (for monitoring)
  // ───────────────────────────────────────────────────────────

  getStats() {
    return {
      webhooksReceived: this.webhooksReceived,
      webhookErrors: this.webhookErrors,
      ordersProcessed: this.ordersProcessed,
      lastWebhookAt: this.lastWebhookAt,
      lastError: this.lastError,
      configured: !!this.config,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────

/**
 * Cria instância do adapter com config
 */
export const createGloriaFoodAdapter = (config: GloriaFoodConfig): GloriaFoodAdapter => {
  const adapter = new GloriaFoodAdapter();
  adapter.initialize(config);
  return adapter;
};
