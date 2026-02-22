import { createClient } from "@supabase/supabase-js";
import { Request, Response } from "express";

const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:3001";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

interface ProcessWebhookParams {
  provider: string;
  event_type: string;
  event_id: string;
  payload: Record<string, unknown>;
  signature: string;
  restaurant_id?: string;
}

/**
 * WebhookEventHandler
 * Processes incoming webhooks and triggers outbound deliveries
 */
export class WebhookEventHandler {
  private supabase = createClient(supabaseUrl, supabaseKey);

  /**
   * Process incoming webhook event
   * Steps:
   * 1. Store webhook in database (idempotent)
   * 2. Mark as processed
   * 3. Trigger outbound delivery to restaurants
   */
  async processWebhookEvent(params: ProcessWebhookParams): Promise<{
    success: boolean;
    eventId: string;
    deliveriesScheduled?: number;
  }> {
    const {
      provider,
      event_type,
      event_id,
      payload,
      signature,
      restaurant_id,
    } = params;

    console.log(
      `[WebhookHandler] Processing ${provider} webhook: ${event_type} (${event_id})`,
    );

    try {
      // 1. Record the incoming webhook event (idempotent via UNIQUE constraint on event_id)
      const { data: processResult, error: processError } =
        await this.supabase.rpc("process_webhook_event", {
          p_provider: provider,
          p_event_type: event_type,
          p_event_id: event_id,
          p_payload: payload,
          p_signature: signature,
        });

      if (processError) {
        console.error(
          `[WebhookHandler] Error recording webhook: ${processError.message}`,
        );
        return { success: false, eventId: event_id };
      }

      if (!processResult || !processResult[0]?.success) {
        console.error(`[WebhookHandler] Webhook recording failed`);
        return { success: false, eventId: event_id };
      }

      console.log(`[WebhookHandler] Webhook recorded: ${event_id}`);

      // 2. Get the recorded event's database ID for tracking
      const { data: eventData, error: getError } = await this.supabase
        .from("webhook_events")
        .select("id")
        .eq("event_id", event_id)
        .single();

      if (getError || !eventData) {
        console.error(
          `[WebhookHandler] Error retrieving stored event: ${
            getError?.message || "Not found"
          }`,
        );
        return { success: false, eventId: event_id };
      }

      const dbEventId = eventData.id;

      // 3. Mark webhook event as processed
      const { error: markError } = await this.supabase.rpc(
        "mark_webhook_processed",
        {
          p_webhook_event_id: dbEventId,
          p_processed_payload: this.extractPayloadDetails(
            provider,
            event_type,
            payload,
          ),
        },
      );

      if (markError) {
        console.error(
          `[WebhookHandler] Error marking webhook as processed: ${markError.message}`,
        );
        return { success: false, eventId: event_id };
      }

      console.log(`[WebhookHandler] Webhook marked as processed: ${event_id}`);

      // 4. If this is a payment event, trigger outbound webhooks to restaurants
      if (provider === "sumup" && this.isPaymentEvent(event_type)) {
        // Extract restaurant ID from payload (SumUp provides merchant_code, we need to map it)
        const targetRestaurantId =
          restaurant_id ||
          (await this.extractRestaurantIdFromPayload(provider, payload));

        if (targetRestaurantId) {
          const { data: deliveryResult, error: deliveryError } =
            await this.supabase.rpc("trigger_outbound_webhooks_after_payment", {
              p_event_id: dbEventId,
              p_restaurant_id: targetRestaurantId,
            });

          if (deliveryError) {
            console.error(
              `[WebhookHandler] Error scheduling outbound webhooks: ${deliveryError.message}`,
            );
            return { success: true, eventId: event_id, deliveriesScheduled: 0 };
          }

          if (deliveryResult && deliveryResult[0]) {
            const { deliveries_scheduled } = deliveryResult[0];
            console.log(
              `[WebhookHandler] Scheduled ${deliveries_scheduled} outbound webhook deliveries`,
            );
            return {
              success: true,
              eventId: event_id,
              deliveriesScheduled: deliveries_scheduled,
            };
          }
        }
      }

      return { success: true, eventId: event_id, deliveriesScheduled: 0 };
    } catch (error) {
      console.error(
        `[WebhookHandler] Exception processing webhook: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return { success: false, eventId: event_id };
    }
  }

  /**
   * Determine if event type indicates payment processing
   */
  private isPaymentEvent(eventType: string): boolean {
    return [
      "transaction.created",
      "transaction.completed",
      "payment.completed",
      "charge.succeeded",
    ].includes(eventType);
  }

  /**
   * Extract payment-related details from webhook payload
   */
  private extractPayloadDetails(
    provider: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const details: Record<string, unknown> = {
      provider,
      event_type: eventType,
    };

    if (provider === "sumup") {
      details.merchant_code = (
        payload as Record<string, unknown>
      ).merchant_code;
      details.transaction_code = (
        payload as Record<string, unknown>
      ).transaction_code;
      details.amount = (payload as Record<string, unknown>).amount;
      details.currency = (payload as Record<string, unknown>).currency;
      details.status = (payload as Record<string, unknown>).status;
    } else if (provider === "stripe") {
      const chargeData = (payload as Record<string, unknown>).data as Record<
        string,
        unknown
      >;
      details.charge_id = (chargeData.object as Record<string, unknown>)?.id;
      details.amount = (chargeData.object as Record<string, unknown>)?.amount;
      details.currency = (
        chargeData.object as Record<string, unknown>
      )?.currency;
      details.status = (chargeData.object as Record<string, unknown>)?.status;
    }

    return details;
  }

  /**
   * Extract restaurant ID from webhook payload
   * SumUp: merchant_code → need to map to restaurant_id
   * Stripe: Connect account → need to map to restaurant_id
   */
  private async extractRestaurantIdFromPayload(
    provider: string,
    payload: Record<string, unknown>,
  ): Promise<string | null> {
    try {
      if (provider === "sumup") {
        // TODO: Implement mapping from SumUp merchant_code to restaurant_id
        // For now, log and return null
        const merchantCode = (payload as Record<string, unknown>).merchant_code;
        console.log(
          `[WebhookHandler] TODO: Map SumUp merchant_code ${merchantCode} to restaurant_id`,
        );
        return null;
      }

      if (provider === "stripe") {
        // TODO: Implement mapping from Stripe connect account to restaurant_id
        const chargeData = (payload as Record<string, unknown>).data as Record<
          string,
          unknown
        >;
        const chargeObj = chargeData.object as Record<string, unknown>;
        console.log(
          `[WebhookHandler] TODO: Map Stripe charge ${chargeObj?.id} to restaurant_id`,
        );
        return null;
      }

      return null;
    } catch (error) {
      console.error(
        `[WebhookHandler] Error extracting restaurant ID: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return null;
    }
  }

  /**
   * Express middleware to handle webhook body parsing and validation
   */
  async handleIncomingWebhook(req: Request, res: Response): Promise<void> {
    try {
      const {
        provider,
        event_type,
        event_id,
        payload,
        signature,
        restaurant_id,
      } = req.body;

      // Validate required fields
      if (!provider || !event_type || !event_id || !payload) {
        res.status(400).json({
          error:
            "Missing required fields: provider, event_type, event_id, payload",
        });
        return;
      }

      const result = await this.processWebhookEvent({
        provider,
        event_type,
        event_id,
        payload,
        signature,
        restaurant_id,
      });

      if (result.success) {
        res.status(202).json({
          success: true,
          event_id: result.eventId,
          deliveries_scheduled: result.deliveriesScheduled || 0,
          message: "Webhook received and scheduled for processing",
        });
      } else {
        res.status(400).json({
          success: false,
          event_id: result.eventId,
          error: "Failed to process webhook",
        });
      }
    } catch (error) {
      console.error(
        `[WebhookHandler] Middleware error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}

export default WebhookEventHandler;
