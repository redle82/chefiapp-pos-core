/**
 * ORDER WRITER — Adaptador de Escrita do Core
 *
 * FASE 6: Ação Única (Mudança de Estado)
 * FASE 8: Criação de Pedido via Web
 * FASE 1: Fluxo de Pedido Operacional — criação e update de status canónicos aqui.
 *
 * REGRAS:
 * - Apenas uma ação por vez
 * - Usa RPC update_order_status (mais seguro que UPDATE direto)
 * - Usa RPC create_order_atomic para criar pedidos
 * - Valida estado antes de atualizar
 * - Retorna erro claro se falhar
 *
 * Mutações pós-criação em itens (add/remove/update item) estão em CoreOrdersApi e são @legacy
 * (FLUXO_DE_PEDIDO_OPERACIONAL); Fase 1 não usa após confirmação.
 */

import type {
  CreateOrderResult,
  CreateOrderSyncMetadata,
  OrderItemInput,
  OrderOrigin,
} from "../../core/contracts";

import { CONFIG } from "../../config";
import { Logger } from "../../core/logger";
import { addSample as latencyAddSample } from "../../core/observability/latencyStore";
import { eventTaskGenerator } from "../../core/tasks/EventTaskGenerator";

const DOCKER_CORE_URL = CONFIG.CORE_URL;
const DOCKER_CORE_ANON_KEY = CONFIG.CORE_ANON_KEY;

// Re-export para compatibilidade
export type {
  CreateOrderResult,
  CreateOrderSyncMetadata,
  OrderItemInput,
} from "../../core/contracts";

/**
 * Atualiza status do pedido via RPC.
 *
 * @param orderId ID do pedido
 * @param newStatus Novo status (OPEN, IN_PREP, READY, etc.)
 * @param restaurantId ID do restaurante (para validação)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: "OPEN" | "IN_PREP" | "READY" | "CLOSED" | "CANCELLED",
  restaurantId: string
): Promise<void> {
  const url = `${DOCKER_CORE_URL}/rpc/update_order_status`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_order_id: orderId,
      p_restaurant_id: restaurantId,
      p_new_status: newStatus,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to update order status: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  // Verificar que o RPC retornou sucesso
  if (!data || !data.success) {
    throw new Error(
      `Order status update failed: ${data?.message || "Unknown error"}`
    );
  }
}

/**
 * Cria pedido via RPC create_order_atomic.
 *
 * FASE 8: Criação de Pedido via Web
 * FASE 9: QR Mesa (suporte a table_id e table_number)
 *
 * @param restaurantId ID do restaurante
 * @param items Itens do pedido
 * @param origin Origem do pedido ('WEB', 'WEB_PUBLIC', 'QR_MESA', 'CAIXA', etc.)
 * @param paymentMethod Método de pagamento (default: 'cash')
 * @param syncMetadata Metadados adicionais (table_id, table_number, etc.)
 */
export async function createOrder(
  restaurantId: string,
  items: OrderItemInput[],
  origin: OrderOrigin | string = "WEB",
  paymentMethod: string = "cash",
  syncMetadata?: CreateOrderSyncMetadata
): Promise<CreateOrderResult> {
  if (!items || items.length === 0) {
    throw new Error("Pedido deve conter pelo menos um item");
  }

  // Guardrail FK (Opção 2 do plano):
  // Antes de chamar create_order_atomic, garantir que todos os product_id existem
  // em gm_products para este restaurante e estão available. Se algum não existir ou estiver desativado, falhar com erro amigável.
  // CONFIG_RUNTIME_CONTRACT: validação exige existência, restaurant_id e available=true; Config governa escrita (docs/contracts/CONFIG_RUNTIME_CONTRACT.md).
  const uniqueProductIds = Array.from(
    new Set(items.map((item) => item.product_id).filter(Boolean))
  );

  if (uniqueProductIds.length === 0) {
    throw new Error(
      "Pedido inválido: itens sem product_id associado. Atualize o cardápio e tente novamente."
    );
  }

  const encodedIds = encodeURIComponent(`(${uniqueProductIds.join(",")})`);
  const validationUrl = `${DOCKER_CORE_URL}/rest/v1/gm_products?id=in.${encodedIds}&restaurant_id=eq.${restaurantId}&available=eq.true&select=id`;

  const validationResponse = await fetch(validationUrl, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!validationResponse.ok) {
    const errorText = await validationResponse.text();
    throw new Error(
      `Não foi possível validar os produtos do pedido: ${validationResponse.status} ${validationResponse.statusText} - ${errorText}`
    );
  }

  const validationData = (await validationResponse.json()) as { id: string }[];
  const foundIds = new Set(validationData.map((p) => p.id));

  const missingIds = uniqueProductIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new Error(
      "Um ou mais produtos deste pedido já não estão disponíveis no Core. Atualize o cardápio ou remova os itens afetados antes de tentar novamente."
    );
  }

  // DOCKER CORE: Usar /rest/v1/ (PostgREST)
  const url = `${DOCKER_CORE_URL}/rpc/create_order_atomic`;

  const syncMetadataWithOrigin = {
    origin: origin,
    ...(syncMetadata || {}),
  };

  const t0 = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_restaurant_id: restaurantId,
      p_items: items,
      p_payment_method: paymentMethod,
      p_sync_metadata: syncMetadataWithOrigin,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    latencyAddSample(restaurantId, "create_order_atomic", Date.now() - t0);
    throw new Error(
      `Failed to create order: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  latencyAddSample(restaurantId, "create_order_atomic", Date.now() - t0);

  // Verificar que o RPC retornou dados válidos
  if (!data || !data.id) {
    throw new Error(
      `Order creation failed: ${data?.message || "Unknown error"}`
    );
  }

  // Cada pedido que aparece é uma tarefa (CONTRATO_DE_ATIVIDADE_OPERACIONAL)
  eventTaskGenerator
    .generateFromEvent(restaurantId, "order_created", {
      orderId: data.id,
      orderNumber: data.number ?? data.short_id ?? data.id,
      tableNumber: syncMetadata?.table_number ?? null,
    })
    .catch((err) => {
      Logger.warn("[OrderWriter] Tarefa por pedido não criada", {
        restaurant_id: restaurantId,
        orderId: data.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });

  return {
    id: data.id,
    total_cents: data.total_cents,
    status: data.status,
  };
}

/**
 * Marca um item individual como pronto.
 *
 * FASE 1: Fechamento Operacional
 *
 * Quando todos os itens estão prontos, o pedido automaticamente fica READY.
 *
 * @param itemId ID do item
 * @param restaurantId ID do restaurante (para validação)
 */
export async function markItemReady(
  itemId: string,
  restaurantId: string
): Promise<{
  success: boolean;
  all_items_ready: boolean;
  order_status_updated: boolean;
}> {
  const url = `${DOCKER_CORE_URL}/rpc/mark_item_ready`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_item_id: itemId,
      p_restaurant_id: restaurantId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to mark item ready: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  if (!data || !data.success) {
    throw new Error(
      `Item ready update failed: ${data?.message || "Unknown error"}`
    );
  }

  return {
    success: data.success,
    all_items_ready: data.all_items_ready,
    order_status_updated: data.order_status_updated,
  };
}
