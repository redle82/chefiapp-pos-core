/**
 * Core Event: Pedido aceite (ação autorizada)
 * CORE_APPSTAFF_CONTRACT — AppStaff executa ações permitidas; Core valida.
 * Mock: regista localmente como "pending sync" quando offline.
 */

export interface OrderAcceptedPayload {
  orderId: string;
  staffId: string;
  shiftId: string | null;
  acceptedAt: number;
}

export type OrderAcceptedResult = { ok: true } | { ok: false; error: Error };

/**
 * Envia evento "pedido aceite" ao Core.
 * Arquitetura: Core valida e regista; AppStaff apenas executa acção permitida.
 */
export async function sendOrderAccepted(payload: OrderAcceptedPayload): Promise<OrderAcceptedResult> {
  try {
    // TODO: chamada real ao Core (RPC ou REST)
    console.log('[core-events] orderAccepted (mock):', payload.orderId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
