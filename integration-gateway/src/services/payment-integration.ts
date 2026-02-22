import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

interface MerchantResolution {
  restaurant_id: string;
  merchant_name: string;
}

interface PaymentLinkResult {
  success: boolean;
  message: string;
  order_id: string;
  new_status: string;
}

interface PendingPayment {
  order_id: string;
  payment_status: string;
  total_amount: number;
  pending_duration_minutes: number;
  last_event_id: string;
  created_at: string;
}

interface PaymentEventUpdate {
  success: boolean;
  message: string;
  order_id: string;
  restaurant_id: string;
  previous_status: string;
  new_status: string;
}

interface MerchantMapping {
  id: string;
  restaurant_id: string;
  provider: string;
  merchant_code: string;
  merchant_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * PaymentIntegrationService
 * Handles payment webhook integration with order management
 * Maps payment events from external providers to orders
 */
export class PaymentIntegrationService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );
  }

  /**
   * Resolve a restaurant from a payment provider merchant code
   * Used to identify which restaurant received a payment
   */
  async resolveMerchantCode(
    merchantCode: string,
    provider: string = "stripe",
  ): Promise<MerchantResolution | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        "resolve_restaurant_from_merchant_code",
        {
          p_merchant_code: merchantCode,
          p_provider: provider,
        },
      );

      if (error) {
        console.error(
          `[PaymentIntegration] Failed to resolve merchant:`,
          error,
        );
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error(
        `[PaymentIntegration] Error resolving merchant code:`,
        error,
      );
      return null;
    }
  }

  /**
   * Link a payment webhook event to an order
   * Updates order payment status and webhook event with order reference
   */
  async linkPaymentToOrder(
    orderId: string,
    webhookEventId: string,
    paymentStatus: string,
    paymentAmount: number = 0,
  ): Promise<PaymentLinkResult | null> {
    try {
      const { data, error } = await this.supabase.rpc("link_payment_to_order", {
        p_order_id: orderId,
        p_webhook_event_id: webhookEventId,
        p_payment_status: paymentStatus,
        p_payment_amount: paymentAmount > 0 ? paymentAmount : null,
      });

      if (error) {
        console.error(`[PaymentIntegration] Failed to link payment:`, error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error(
        `[PaymentIntegration] Error linking payment to order:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get pending order payments for a restaurant
   * Find orders awaiting payment confirmation
   */
  async getPendingPayments(
    restaurantId: string,
    maxAgeMinutes: number = 60,
  ): Promise<PendingPayment[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_pending_order_payments",
        {
          p_restaurant_id: restaurantId,
          p_max_age_minutes: maxAgeMinutes,
        },
      );

      if (error) {
        console.error(
          `[PaymentIntegration] Failed to get pending payments:`,
          error,
        );
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(
        `[PaymentIntegration] Error getting pending payments:`,
        error,
      );
      return [];
    }
  }

  /**
   * Update an order based on a payment webhook event
   * Main integration function that processes payment events
   */
  async updateOrderFromPaymentEvent(
    webhookEventId: string,
    paymentStatus: string,
    paymentAmount: number = 0,
  ): Promise<PaymentEventUpdate | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        "update_order_from_payment_event",
        {
          p_webhook_event_id: webhookEventId,
          p_payment_status: paymentStatus,
          p_payment_amount: paymentAmount > 0 ? paymentAmount : null,
        },
      );

      if (error) {
        console.error(`[PaymentIntegration] Failed to update order:`, error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error(
        `[PaymentIntegration] Error updating order from event:`,
        error,
      );
      return null;
    }
  }

  /**
   * Create or update a merchant code mapping
   * Associates a payment provider merchant code with a restaurant
   */
  async createMerchantMapping(
    restaurantId: string,
    provider: string,
    merchantCode: string,
    merchantName: string = "",
  ): Promise<MerchantMapping | null> {
    try {
      const { data, error } = await this.supabase
        .from("merchant_code_mapping")
        .upsert(
          {
            restaurant_id: restaurantId,
            provider,
            merchant_code: merchantCode,
            merchant_name: merchantName || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "provider, merchant_code",
          },
        )
        .select()
        .single();

      if (error) {
        console.error(
          `[PaymentIntegration] Failed to create merchant mapping:`,
          error,
        );
        return null;
      }

      return data;
    } catch (error) {
      console.error(
        `[PaymentIntegration] Error creating merchant mapping:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get merchant mappings for a restaurant
   * Returns all active merchant codes for a restaurant
   */
  async getMerchantMappings(restaurantId: string): Promise<MerchantMapping[]> {
    try {
      const { data, error } = await this.supabase
        .from("merchant_code_mapping")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true);

      if (error) {
        console.error(
          `[PaymentIntegration] Failed to get merchant mappings:`,
          error,
        );
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(
        `[PaymentIntegration] Error getting merchant mappings:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get payment status summary for a restaurant
   * Aggregates payment status across all orders
   */
  async getPaymentSummary(restaurantId: string) {
    try {
      const { data, error } = await this.supabase
        .from("gm_orders")
        .select("payment_status")
        .eq("restaurant_id", restaurantId)
        .in("payment_status", ["completed", "pending", "failed", "processing"]);

      if (error) {
        console.error(
          `[PaymentIntegration] Failed to get payment summary:`,
          error,
        );
        return null;
      }

      const summary = {
        total_orders: 0,
        by_status: {} as Record<string, number>,
      };

      for (const row of data || []) {
        summary.by_status[row.payment_status] =
          (summary.by_status[row.payment_status] || 0) + 1;
        summary.total_orders += 1;
      }

      return summary;
    } catch (error) {
      console.error(
        `[PaymentIntegration] Error getting payment summary:`,
        error,
      );
      return null;
    }
  }
}

// Export singleton instance
export default new PaymentIntegrationService();
