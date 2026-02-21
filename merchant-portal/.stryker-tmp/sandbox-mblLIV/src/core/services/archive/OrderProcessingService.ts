/**
 * ARCHIVED — DORMANT. Event Sourcing Kernel path is NOT used in production.
 * All order writes go through OrderEngine -> PostgREST RPCs (create_order_atomic, process_order_payment).
 * See: core-engine/ARCHITECTURE_DECISION.md
 * Kept in archive for reference; do not import in production code.
 */
import { getErrorMessage } from "../../errors/ErrorMessages";
import { DbWriteGate } from "../../governance/DbWriteGate";
import { supabase } from "../../supabase";

/** CORE_FAILURE_MODEL: caller can pass executeSafe to get failureClass on throw */
export type ExecuteSafeFn = (req: any) => Promise<{
  ok: boolean;
  result?: any;
  reason?: string;
  error?: any;
  failureClass?: string;
}>;

/**
 * SOVEREIGN KERNEL: Order Processing Service (ARCHIVED)
 * Handles the "Peristalsis" - converting external requests into internal orders.
 */
export const OrderProcessingService = {
  async acceptRequest(
    requestId: string,
    restaurantId: string,
    kernel: any,
    executeSafe?: ExecuteSafeFn,
  ): Promise<string> {
    console.log("[OrderProcessing] Accepting Request:", requestId);

    if (!kernel && !executeSafe) {
      throw new Error(
        "Sovereignty Violation: Kernel or executeSafe required for Order Processing.",
      );
    }

    const { data: request, error: fetchError } = await (supabase as any)
      .from("gm_order_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) throw new Error("Solicitação não encontrada.");
    if (request.status !== "PENDING")
      throw new Error("Solicitação já processada.");

    const orderId = crypto.randomUUID();
    const items = (request.items as any[]) || [];

    const sovereignItems = items.map((item) => ({
      productId: item.product_id,
      name: item.name || "Item Web",
      quantity: item.quantity,
      priceCents: item.price_cents || 0,
      notes: item.notes,
      projectId: item.project_id,
    }));

    const payload = {
      entity: "ORDER",
      entityId: orderId,
      event: "CREATE",
      restaurantId,
      payload: {
        entityId: orderId,
        restaurantId,
        tableId: null,
        items: sovereignItems,
        paymentMethod: "online_pending",
        totalCents: request.total_cents,
        syncMetadata: {
          origin: "WEB_PUBLIC",
          request_id: requestId,
          customer_name: request.customer_contact?.name || "Cliente Web",
        },
      },
    };

    if (executeSafe) {
      const res = await executeSafe(payload);
      if (!res.ok) {
        const err = new Error(
          getErrorMessage(res.error) || "Erro ao criar pedido soberano.",
        ) as Error & { failureClass?: string };
        err.failureClass = res.failureClass;
        throw err;
      }
    } else {
      await kernel.execute(payload);
    }

    const { error: updateError } = await DbWriteGate.update(
      "OrderProcessingService",
      "gm_order_requests",
      {
        status: "ACCEPTED",
        sovereign_order_id: orderId,
        updated_at: new Date().toISOString(),
      },
      { id: requestId },
      { tenantId: restaurantId },
    );

    if (updateError) throw updateError;

    console.log(
      "[OrderProcessing] Request Converted to Sovereign Order:",
      orderId,
    );
    return orderId;
  },

  async rejectRequest(requestId: string): Promise<void> {
    console.log("[OrderProcessing] Rejecting Request:", requestId);

    const { error } = await DbWriteGate.update(
      "OrderProcessingService",
      "gm_order_requests",
      {
        status: "REJECTED",
        updated_at: new Date().toISOString(),
      },
      { id: requestId },
      { tenantId: "unknown" },
    );

    if (error) throw error;
  },
};
