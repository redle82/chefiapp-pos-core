/**
 * Core Client - Cliente do Core Soberano (PURE DOCKER MODE)
 *
 * FASE 1:
 * - Este cliente NÃO fala mais diretamente com Supabase.
 * - Todas as funções abaixo são adapters em memória que:
 *   - mantêm o shape esperado pelo TPV v2;
 *   - registram [CORE TODO] no console;
 *   - evitam que a UI quebre enquanto o Core real não existe.
 *
 * FASE 2/3:
 * - Substituir as implementações por chamadas reais ao Core Docker
 *   (PostgREST/RPC/WebSocket) sem reintroduzir supabase-js.
 */

function coreTodo(feature: string, payload?: any): void {
  // Adapter único para marcar caminhos ainda não conectados ao Core real.
  // Mantém observabilidade sem depender de Supabase.
  // eslint-disable-next-line no-console
  console.warn(`[CORE TODO][TPV v2] ${feature} ainda não implementado.`, payload);
}

// =============================================================================
// RPC CALLS
// =============================================================================

export interface CreateOrderParams {
  restaurantId: string;
  tableId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Criar pedido via Core (RPC create_order_atomic)
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  coreTodo("createOrder", params);

  // FASE 1: não criamos pedidos reais; apenas simulamos um ID estável.
  return {
    success: true,
    orderId: "CORETODO-ORDER-ID",
  };
}

/**
 * Atualizar status do pedido
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  coreTodo("updateOrderStatus", { orderId, status });

  // FASE 1: assumimos sucesso para não quebrar o fluxo do TPV.
  return { success: true };
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Buscar pedidos ativos
 */
export async function getActiveOrders(restaurantId: string) {
  coreTodo("getActiveOrders", { restaurantId });

  // FASE 1: sem Core real, retornamos lista vazia.
  return [];
}

/**
 * Buscar mesas
 */
export async function getTables(restaurantId: string) {
  coreTodo("getTables", { restaurantId });

  // FASE 1: sem Core real, retornamos lista vazia.
  return [];
}

/**
 * Buscar produtos
 */
export async function getProducts(restaurantId: string) {
  coreTodo("getProducts", { restaurantId });

  // FASE 1: sem Core real, retornamos lista vazia.
  return [];
}

// =============================================================================
// REALTIME SUBSCRIPTIONS
// =============================================================================

export interface OrderEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  order: any;
}

/**
 * Escutar eventos de pedidos via Realtime
 */
export function subscribeToOrders(
  restaurantId: string,
  onEvent: (event: OrderEvent) => void
): () => void {
  coreTodo("subscribeToOrders", { restaurantId });

  // FASE 1: não abrimos conexão real; apenas retornamos cleanup no-op.
  return () => {
    // no-op
  };
}
