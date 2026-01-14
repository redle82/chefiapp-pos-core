/**
 * GlovoAdapter — Integração com Glovo
 * 
 * Este adapter:
 * 1. Recebe pedidos via webhook ou polling
 * 2. Transforma em eventos internos (order.created)
 * 3. Pode atualizar status (futuro)
 * 
 * API: https://open-api.glovoapp.com/
 */

import type { IntegrationAdapter, IntegrationCapability } from '../../core/IntegrationContract';
import type { IntegrationEvent, OrderCreatedEvent } from '../../types/IntegrationEvent';
import type { IntegrationStatus } from '../../types/IntegrationStatus';
import { createHealthyStatus, createDegradedStatus, createDownStatus } from '../../types/IntegrationStatus';
import type { 
  GlovoOrder,
  GlovoConfig,
  GlovoOrderStatus,
} from './GlovoTypes';
import { isValidGlovoOrder, isPendingOrder, isCancelledOrder } from './GlovoTypes';
import { GlovoOAuth } from './GlovoOAuth';

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const GLOVO_API_BASE = 'https://open-api.glovoapp.com';
const POLLING_INTERVAL_MS = 3000; // 3 segundos (reduzido para resposta mais rápida)
const MAX_PROCESSED_ORDERS = 1000; // Limitar memória - manter apenas últimos 1000

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
    // 'orders.status' - futuro
  ];

  // Config
  private config: GlovoConfig | null = null;
  private oauth: GlovoOAuth | null = null;

  // State
  private lastPollAt: number | null = null;
  private ordersReceived = 0;
  private ordersErrors = 0;
  private lastError: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private processedOrderIds = new Set<string>(); // Para evitar duplicatas

  // Event callback (set by Registry)
  private eventCallback: ((event: IntegrationEvent) => void) | null = null;

  // ───────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────

  async initialize(config?: GlovoConfig): Promise<void> {
    if (!config?.clientId) {
      throw new Error('[Glovo] clientId is required');
    }

    this.config = config;

    // TASK-3.1.3: GlovoOAuth ainda precisa de clientSecret, mas será obtido do backend
    // Por enquanto, usar um placeholder - o GlovoOAuth precisa ser atualizado para usar endpoint backend
    // TODO: Criar endpoint /api/oauth/client-credentials para Glovo
    this.oauth = new GlovoOAuth({
      clientId: config.clientId,
      clientSecret: '', // TASK-3.1.3: Será obtido do backend via endpoint
    });

    // Se temos tokens salvos, usar
    if (config.accessToken && config.refreshToken) {
      this.oauth.setTokens(
        config.accessToken,
        config.refreshToken,
        3600 // Assumir 1 hora (ajustar se necessário)
      );
    }

    // Obter token inicial
    try {
      await this.oauth.getAccessToken();
      console.log(`[Glovo] 🚀 Initialized for restaurant: ${config.restaurantId}`);
    } catch (error) {
      console.error('[Glovo] ❌ Failed to initialize OAuth', error);
      throw error;
    }

    // Iniciar polling se configurado
    if (config.enabled !== false) {
      this.startPolling();
    }
  }

  async dispose(): Promise<void> {
    console.log('[Glovo] 👋 Disposed');
    this.stopPolling();
    this.config = null;
    this.oauth = null;
    this.eventCallback = null;
    this.processedOrderIds.clear();
  }

  // ───────────────────────────────────────────────────────────
  // EVENT HANDLING (outgoing events from system)
  // ───────────────────────────────────────────────────────────

  async onEvent(event: IntegrationEvent): Promise<void> {
    // Futuro: order.completed → atualizar status no Glovo
    if (event.type === 'order.completed') {
      console.log(`[Glovo] 📤 Would update order ${event.payload.orderId} to completed`);
      // TODO: Implementar API call para Glovo
    }
  }

  // ───────────────────────────────────────────────────────────
  // WEBHOOK HANDLER (incoming orders)
  // ───────────────────────────────────────────────────────────

  /**
   * Processa webhook recebido do Glovo
   */
  handleWebhook(payload: unknown): { success: boolean; error?: string; orderId?: string } {
    this.ordersReceived++;

    try {
      // 1. Validar estrutura
      if (!isValidGlovoOrder(payload)) {
        this.ordersErrors++;
        this.lastError = 'Invalid payload structure';
        console.error('[Glovo] ❌ Invalid webhook payload');
        return { success: false, error: 'Invalid payload structure' };
      }

      const order = payload as GlovoOrder;

      // 2. Validar restaurantId (se configurado)
      if (this.config?.restaurantId && order.restaurant_id !== this.config.restaurantId) {
        console.warn(`[Glovo] ⚠️ Order for different restaurant: ${order.restaurant_id}`);
        return { success: false, error: 'Restaurant ID mismatch' };
      }

      // 3. Processar por status
      if (isPendingOrder(order)) {
        return this.processNewOrder(order);
      }

      if (isCancelledOrder(order)) {
        return this.processCancellation(order);
      }

      // Outros status - log only por agora
      console.log(`[Glovo] 📨 Order status: ${order.status} for order ${order.id}`);
      return { success: true, orderId: order.id };

    } catch (err) {
      this.ordersErrors++;
      this.lastError = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Glovo] ❌ Webhook processing failed:', err);
      return { success: false, error: this.lastError };
    }
  }

  // ───────────────────────────────────────────────────────────
  // POLLING (alternativa a webhook)
  // ───────────────────────────────────────────────────────────

  /**
   * Iniciar polling de pedidos
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      return; // Já está rodando
    }

    console.log('[Glovo] 🔄 Starting polling...');
    
    // Poll imediatamente
    this.pollOrders();

    // Poll a cada 10 segundos
    this.pollingInterval = setInterval(() => {
      this.pollOrders();
    }, POLLING_INTERVAL_MS);
  }

  /**
   * Parar polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[Glovo] ⏹️ Stopped polling');
    }
  }

  /**
   * Poll pedidos pendentes da API
   */
  private async pollOrders(): Promise<void> {
    if (!this.oauth || !this.config) {
      return;
    }

    try {
      const token = await this.oauth.getAccessToken();
      const response = await fetch(`${GLOVO_API_BASE}/v3/orders?status=PENDING`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, tentar refresh
          await this.oauth.getAccessToken();
          return; // Tentar novamente no próximo poll
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const orders: GlovoOrder[] = data.orders || [];

      // Processar apenas pedidos novos
      for (const order of orders) {
        if (!this.processedOrderIds.has(order.id) && isPendingOrder(order)) {
          this.processNewOrder(order);
          this.processedOrderIds.add(order.id);
        }
      }

      // Limpar processedOrderIds se exceder limite (prevenir vazamento de memória)
      if (this.processedOrderIds.size > MAX_PROCESSED_ORDERS) {
        const idsArray = Array.from(this.processedOrderIds);
        // Manter apenas os últimos MAX_PROCESSED_ORDERS
        const idsToKeep = idsArray.slice(-MAX_PROCESSED_ORDERS);
        this.processedOrderIds = new Set(idsToKeep);
        console.log(`[Glovo] Cleaned processedOrderIds: kept ${idsToKeep.length} most recent`);
      }

      this.lastPollAt = Date.now();

    } catch (err) {
      this.ordersErrors++;
      this.lastError = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Glovo] ❌ Polling failed:', err);
    }
  }

  // ───────────────────────────────────────────────────────────
  // ORDER PROCESSING
  // ───────────────────────────────────────────────────────────

  /**
   * Processa novo pedido
   */
  private processNewOrder(order: GlovoOrder): { success: boolean; orderId: string } {
    console.log(`[Glovo] 📥 New order: ${order.id}`);

    // Transform para evento interno (formato esperado pelo OrderIngestionPipeline)
    const internalEvent: OrderCreatedEvent = {
      type: 'order.created',
      payload: {
        orderId: order.id,
        source: 'delivery',
        items: this.transformItems(order.items),
        totalCents: Math.round(order.total * 100), // Converter para centavos
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        createdAt: new Date(order.created_at).getTime(),
        // Metadata adicional (se necessário)
        metadata: {
          glovoId: order.id,
          email: order.customer.email,
          address: this.formatAddress(order.delivery.address),
          estimatedMinutes: order.delivery.estimated_time,
          scheduledTime: order.delivery.scheduled_time,
          instructions: order.instructions,
          currency: order.currency,
        },
      },
    };

    // Emit para o sistema
    this.emitToSystem(internalEvent);

    return { success: true, orderId: order.id };
  }

  /**
   * Processa cancelamento
   */
  private processCancellation(order: GlovoOrder): { success: boolean; orderId: string } {
    console.log(`[Glovo] ❌ Order cancelled: ${order.id}`);

    this.emitToSystem({
      type: 'order.updated',
      payload: {
        orderId: order.id,
        status: 'cancelled',
      },
    });

    return { success: true, orderId: order.id };
  }

  // ───────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ───────────────────────────────────────────────────────────

  async healthCheck(): Promise<IntegrationStatus> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const metrics = {
      ordersReceived: this.ordersReceived,
      ordersErrors: this.ordersErrors,
      lastPollAt: this.lastPollAt,
      errorRate: this.ordersReceived > 0 
        ? (this.ordersErrors / this.ordersReceived * 100).toFixed(1) + '%' 
        : '0%',
      oauthValid: this.oauth?.isTokenValid() || false,
    };

    // Se OAuth inválido
    if (!this.oauth?.isTokenValid()) {
      return createDownStatus('OAuth token invalid or expired');
    }

    // Se muitos erros recentes
    if (this.ordersReceived > 10 && this.ordersErrors / this.ordersReceived > 0.3) {
      return createDegradedStatus('High error rate');
    }

    // Se não recebeu pedidos em muito tempo E já recebeu antes
    if (this.lastPollAt && this.lastPollAt < oneDayAgo && this.ordersReceived > 0) {
      return createDegradedStatus('No orders received in 24h');
    }

    // Se tem erro recente
    if (this.lastError) {
      return createHealthyStatus();
    }

    return createHealthyStatus();
  }

  // ───────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────

  /**
   * Transforma itens Glovo para formato interno (OrderCreatedEvent)
   */
  private transformItems(items: GlovoOrder['items']) {
    return items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      priceCents: Math.round(item.price * 100), // Converter para centavos
      // Nota: OrderCreatedEvent não tem campo notes diretamente,
      // mas pode ser adicionado via metadata se necessário
    }));
  }

  /**
   * Formata endereço para string
   */
  private formatAddress(address: GlovoOrder['delivery']['address']): string {
    const parts = [
      address.address,
      address.city,
      address.postal_code,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Emite evento para o sistema
   */
  private emitToSystem(event: IntegrationEvent): void {
    if (this.eventCallback) {
      try {
        this.eventCallback(event);
      } catch (err) {
        console.error('[Glovo] ❌ Error emitting event:', err);
      }
    } else {
      console.warn('[Glovo] ⚠️ No event callback registered');
    }
  }

  /**
   * Registrar callback de eventos
   */
  setEventCallback(callback: (event: IntegrationEvent) => void): void {
    this.eventCallback = callback;
  }
}
