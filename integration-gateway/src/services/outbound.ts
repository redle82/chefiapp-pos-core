import { createClient } from "@supabase/supabase-js";
import axios, { AxiosError } from "axios";

const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:3001";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "test-key";

interface WebhookDelivery {
  delivery_id: string;
  event_id: string;
  webhook_url: string;
  raw_payload: Record<string, unknown>;
  processed_payload: Record<string, unknown>;
  attempt_number: number;
  max_attempts: number;
  provider: string;
  event_type: string;
}

interface DeliveryResult {
  delivery_id: string;
  success: boolean;
  status_code?: number;
  error?: string;
  retry_scheduled?: boolean;
  next_retry_at?: string;
}

/**
 * OutboundWebhookService
 * Handles sending webhooks to restaurant-configured endpoints
 * Implements delivery tracking and retry scheduling via database
 */
export class OutboundWebhookService {
  private supabase = createClient(supabaseUrl, supabaseKey);

  /**
   * Get all pending webhook deliveries
   * Returns webhooks that need to be sent or retried
   */
  async getPendingDeliveries(limit: number = 100): Promise<WebhookDelivery[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_pending_deliveries",
        {
          p_limit: limit,
        },
      );

      if (error) {
        console.error(
          "[OutboundWebhook] Error fetching pending deliveries:",
          error,
        );
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(
        "[OutboundWebhook] Exception fetching pending deliveries:",
        error,
      );
      return [];
    }
  }

  /**
   * Send a single webhook delivery
   * Implements exponential backoff retry logic via database
   */
  async sendDelivery(delivery: WebhookDelivery): Promise<DeliveryResult> {
    const {
      delivery_id,
      webhook_url,
      processed_payload,
      attempt_number,
      max_attempts,
    } = delivery;

    try {
      console.log(
        `[OutboundWebhook] Sending delivery ${delivery_id} to ${webhook_url} (attempt ${
          attempt_number + 1
        }/${max_attempts})`,
      );

      // Send the webhook with timeout
      const response = await axios.post(
        webhook_url,
        processed_payload || delivery.raw_payload,
        {
          timeout: 30000, // 30s timeout
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ChefIApp-Webhook-Gateway/1.0.0",
            "X-Webhook-Event-ID": delivery.event_id,
            "X-Webhook-Provider": delivery.provider,
            "X-Webhook-Event-Type": delivery.event_type,
            "X-Delivery-ID": delivery_id,
            "X-Attempt": String(attempt_number + 1),
          },
        },
      );

      console.log(
        `[OutboundWebhook] Delivery ${delivery_id} succeeded with status ${response.status}`,
      );

      // Mark as delivered
      const { data: markResult, error: markError } = await this.supabase.rpc(
        "mark_delivery_sent",
        {
          p_delivery_id: delivery_id,
          p_http_status_code: response.status,
          p_response_body: JSON.stringify(response.data),
        },
      );

      if (markError) {
        console.error(
          `[OutboundWebhook] Error marking delivery as sent: ${markError.message}`,
        );
      }

      return {
        delivery_id,
        success: true,
        status_code: response.status,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status || 0;
      const errorMessage = axiosError.message || "Unknown error";

      console.error(
        `[OutboundWebhook] Delivery ${delivery_id} failed (status ${statusCode}): ${errorMessage}`,
      );

      // Schedule retry using exponential backoff
      const { data: retryResult, error: retryError } = await this.supabase.rpc(
        "mark_delivery_retry",
        {
          p_delivery_id: delivery_id,
          p_http_status_code: statusCode,
          p_error_message: errorMessage,
        },
      );

      if (retryError) {
        console.error(
          `[OutboundWebhook] Error scheduling retry: ${retryError.message}`,
        );
        return {
          delivery_id,
          success: false,
          status_code: statusCode,
          error: errorMessage,
        };
      }

      if (retryResult && retryResult[0]) {
        const { will_retry, next_retry_at } = retryResult[0];
        console.log(
          `[OutboundWebhook] Delivery ${delivery_id} will retry at ${
            next_retry_at || "never (max retries exceeded)"
          }`,
        );
        return {
          delivery_id,
          success: false,
          status_code: statusCode,
          error: errorMessage,
          retry_scheduled: will_retry,
          next_retry_at,
        };
      }

      return {
        delivery_id,
        success: false,
        status_code: statusCode,
        error: errorMessage,
      };
    }
  }

  /**
   * Process all pending deliveries in batch
   * Returns summary of successes and failures
   */
  async processPendingDeliveries(
    limit: number = 100,
  ): Promise<{ successful: number; failed: number; total: number }> {
    const pending = await this.getPendingDeliveries(limit);

    if (pending.length === 0) {
      console.log("[OutboundWebhook] No pending deliveries to process");
      return { successful: 0, failed: 0, total: 0 };
    }

    console.log(
      `[OutboundWebhook] Processing ${pending.length} pending deliveries`,
    );

    const results = await Promise.all(
      pending.map((delivery) => this.sendDelivery(delivery)),
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `[OutboundWebhook] Batch complete: ${successful} successful, ${failed} failed (next retries scheduled)`,
    );

    return {
      successful,
      failed,
      total: pending.length,
    };
  }

  /**
   * Get delivery status for monitoring
   */
  async getDeliveryStatus(deliveryId: string) {
    try {
      const { data, error } = await this.supabase.rpc("get_delivery_status", {
        p_delivery_id: deliveryId,
      });

      if (error) {
        console.error(
          "[OutboundWebhook] Error fetching delivery status:",
          error,
        );
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error(
        "[OutboundWebhook] Exception fetching delivery status:",
        error,
      );
      return null;
    }
  }
}

export default OutboundWebhookService;
