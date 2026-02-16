/**
 * Order Ingestion Pipeline — Docker Core Gateway
 *
 * Responsável por receber eventos de pedidos externos (UberEats, Glovo, Deliveroo, etc.)
 * e injetá-los no sistema operacional do ChefIApp via Docker Core PostgREST.
 *
 * Flow:
 * 1. Adapter recebe Webhook → Emite IntegrationEvent (order.created)
 * 2. Pipeline Recebe Evento
 * 3. Pipeline Normaliza Dados
 * 4. Pipeline Insere em integration_webhook_events (auditoria)
 * 5. Pipeline Chama create_order_atomic (pedido real no Core)
 * 6. KDS notificado via Realtime implícito
 *
 * AIRLOCK PROTOCOL: External orders arrive as real gm_orders with source='delivery'.
 */

import { BackendType, getBackendType } from "../../core/infra/backendAdapter";
import { getDockerCoreFetchClient } from "../../core/infra/dockerCoreFetchClient";
import type { OrderCreatedEvent } from "../types/IntegrationEvent";

export class OrderIngestionPipeline {
  /**
   * Ingests an external delivery order into the Core.
   * 1. Logs webhook event for audit
   * 2. Calls create_order_atomic to create real order
   */
  async processExternalOrder(
    event: OrderCreatedEvent,
    restaurantId: string,
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    if (!event?.payload) {
      console.warn("[Ingestion] Ignoring event without payload");
      return { success: false, error: "Event without payload" };
    }
    console.log(
      `[Ingestion] Processing: ${event.payload.orderId} from ${event.payload.source}`,
    );

    if (getBackendType() !== BackendType.docker) {
      return {
        success: false,
        error: "Ingestion requires Docker Core backend",
      };
    }

    const core = getDockerCoreFetchClient();

    try {
      // 1. Idempotency check — look for existing order with same external_id
      const { data: existing } = await core
        .from("gm_orders")
        .select("id")
        .eq(
          "source",
          event.payload.source === "delivery"
            ? "DELIVERY"
            : event.payload.source,
        )
        .eq("metadata->>external_id", event.payload.orderId)
        .maybeSingle();

      if (existing) {
        console.log(
          `[Ingestion] Order ${event.payload.orderId} already exists as ${existing.id}`,
        );
        return { success: true, orderId: existing.id };
      }

      // 2. Log webhook event for audit trail
      await core.from("integration_webhook_events").insert({
        provider: event.payload.metadata?.ubereatsId
          ? "ubereats"
          : event.payload.metadata?.glovoId
          ? "glovo"
          : event.payload.metadata?.deliverooId
          ? "deliveroo"
          : "unknown",
        event_type: "order.created",
        payload: event.payload,
        processed: false,
      });

      // 3. Prepare items for create_order_atomic format
      const items = (event.payload.items || []).map((item) => ({
        product_id: null, // External items may not match internal products
        name: item.name || "External Item",
        unit_price: item.priceCents || 0,
        quantity: item.quantity || 1,
        created_by_role: "DELIVERY",
      }));

      // 4. Create real order via Core RPC
      const { data: orderResult, error: orderError } = await core.rpc(
        "create_order_atomic",
        {
          p_restaurant_id: restaurantId,
          p_items: items,
          p_payment_method: "delivery_platform",
          p_sync_metadata: {
            external_id: event.payload.orderId,
            origin: "DELIVERY",
            source: event.payload.metadata?.ubereatsId
              ? "ubereats"
              : event.payload.metadata?.glovoId
              ? "glovo"
              : event.payload.metadata?.deliverooId
              ? "deliveroo"
              : "external",
            customer_name: event.payload.customerName,
            customer_phone: event.payload.customerPhone,
            delivery_address: event.payload.metadata?.address || "",
          },
        },
      );

      if (orderError) {
        throw new Error(
          `Core order creation failed: ${
            orderError.message || JSON.stringify(orderError)
          }`,
        );
      }

      const orderId = orderResult?.id || "unknown";
      console.log(`[Ingestion] ✅ Order created: ${orderId}`);

      // 5. Mark webhook event as processed
      await core
        .from("integration_webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("payload->>orderId", event.payload.orderId);

      return { success: true, orderId };
    } catch (error: any) {
      console.error("[Ingestion] ❌ Failed:", error);

      // Mark webhook event as failed
      try {
        await core
          .from("integration_webhook_events")
          .update({ processing_error: error.message })
          .eq("payload->>orderId", event.payload.orderId);
      } catch {
        /* best-effort */
      }

      return { success: false, error: error.message };
    }
  }
}

export const orderIngestion = new OrderIngestionPipeline();
