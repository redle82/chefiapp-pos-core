/**
 * Core Reader: Pedidos (Mini KDS / Mini TPV)
 * CORE_APPSTAFF_CONTRACT — AppStaff lê estado do Core; não decide prioridade.
 * Mock: retorna dados locais ou API quando existir.
 */

export interface CoreOrderItem {
  id: string;
  name: string;
  quantity: number;
  status: string;
}

export interface CoreOrder {
  id: string;
  tableId?: string;
  items: CoreOrderItem[];
  status: string;
  createdAt: number;
}

export interface ReadOrdersResult {
  orders: CoreOrder[];
  error: Error | null;
}

/**
 * Lê pedidos do Core para consciência operacional (Mini KDS / Mini TPV).
 * Arquitetura: Core é fonte de verdade; este reader apenas expõe.
 */
export async function readOrders(restaurantId: string | null): Promise<ReadOrdersResult> {
  if (!restaurantId) {
    return { orders: [], error: null };
  }
  try {
    // TODO: chamada real ao Core (RPC ou REST)
    const orders: CoreOrder[] = [];
    return { orders, error: null };
  } catch (e) {
    return { orders: [], error: e instanceof Error ? e : new Error(String(e)) };
  }
}
