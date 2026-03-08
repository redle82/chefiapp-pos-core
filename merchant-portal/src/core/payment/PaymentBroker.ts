/**
 * PaymentBroker - Intermediário de Pagamentos
 *
 * Abstrai a comunicação com o Core (RPC stripe-payment).
 * ANTI-SUPABASE §4: Payment ONLY via Docker Core. No supabase.functions.invoke.
 */

import { CONFIG } from "../../config";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";
import { Logger } from "../logger";

const gatewayPath = (legacy: string, edge: string) =>
  CONFIG.isEdgeGateway ? edge : legacy;

const CORE_REQUIRED_MSG =
  "Payment requires Docker Core. Supabase domain fallback is forbidden.";

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
}

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  restaurantId: string;
  operatorId?: string;
  cashRegisterId?: string;
}

export interface PixCheckoutResult {
  provider: string;
  payment_method: string;
  country: string;
  checkout_id: string;
  checkout_reference: string;
  status: string;
  amount: number;
  currency: string;
  raw?: any;
}

export interface PixCheckoutStatusResult {
  provider: string;
  checkout_id: string;
  status: string;
  amount: number;
  currency: string;
  raw?: any;
}

export class PaymentBroker {
  /**
   * Cria um PaymentIntent no Stripe via Core RPC.
   * If not Docker: throw.
   */
  static async createPaymentIntent(
    params: CreatePaymentParams,
  ): Promise<PaymentIntentResult> {
    Logger.debug("[PaymentBroker] Requesting PaymentIntent:", { params });

    if (getBackendType() !== BackendType.docker) {
      throw new Error(CORE_REQUIRED_MSG);
    }

    const core = getDockerCoreFetchClient();
    const res = await core.rpc("stripe-payment", {
      action: "create-payment-intent",
      amount: params.amount,
      currency: params.currency,
      restaurant_id: params.restaurantId,
      order_id: params.orderId,
      operator_id: params.operatorId,
      cash_register_id: params.cashRegisterId,
    });

    if (res.error) {
      Logger.error("[PaymentBroker] Core RPC Error:", res.error);
      throw new Error(`Erro ao criar pagamento: ${res.error.message}`);
    }

    const data = res.data as {
      id?: string;
      clientSecret?: string;
      error?: string;
    } | null;
    if (data?.error) {
      Logger.error("[PaymentBroker] Stripe Error:", data.error);
      throw new Error(data.error);
    }

    if (!data?.id || !data?.clientSecret) {
      throw new Error("Core não retornou id ou clientSecret");
    }

    return {
      id: data.id,
      clientSecret: data.clientSecret,
    };
  }

  /**
   * Creates a Pix checkout via integration-gateway (SumUp)
   * Returns checkout details including ID for polling
   */
  static async createPixCheckout(params: {
    orderId: string;
    amount: number;
    restaurantId: string;
    merchantCode?: string;
    description?: string;
  }): Promise<PixCheckoutResult> {
    Logger.debug("[PaymentBroker] Creating Pix checkout:", { params });

    const gatewayUrl = import.meta.env.VITE_API_BASE || "http://localhost:4320";
    const internalToken =
      import.meta.env.VITE_INTERNAL_API_TOKEN || "chefiapp-internal-token-dev";

    const path = gatewayPath(
      "api/v1/payment/pix/checkout",
      "payment-pix-checkout",
    );
    const response = await fetch(`${gatewayUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internalToken}`,
      },
      body: JSON.stringify({
        order_id: params.orderId,
        amount: params.amount,
        merchant_code: params.merchantCode,
        description: params.description || `Order ${params.orderId.slice(-6)}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `HTTP ${response.status}: Failed to create Pix checkout`,
      );
    }

    const data = await response.json();
    return data as PixCheckoutResult;
  }

  /**
   * Poll Pix checkout status
   */
  static async getPixCheckoutStatus(
    checkoutId: string,
  ): Promise<PixCheckoutStatusResult> {
    const gatewayUrl = import.meta.env.VITE_API_BASE || "http://localhost:4320";
    const internalToken =
      import.meta.env.VITE_INTERNAL_API_TOKEN || "chefiapp-internal-token-dev";

    const base = gatewayPath(
      "api/v1/payment/sumup/checkout",
      "sumup-get-checkout",
    );
    const response = await fetch(`${gatewayUrl}/${base}/${checkoutId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `HTTP ${response.status}: Failed to get checkout status`,
      );
    }

    const data = await response.json();
    return data as PixCheckoutStatusResult;
  }

  /**
   * Creates a SumUp card checkout (Europe - EUR)
   * Returns checkout details including URL for redirect
   */
  static async createSumUpCheckout(params: {
    orderId: string;
    restaurantId: string;
    amount: number;
    currency: string;
    description?: string;
    returnUrl?: string;
  }): Promise<{
    success: boolean;
    checkout: {
      id: string;
      url: string;
      status: string;
      amount: number;
      currency: string;
      expiresAt: string;
      reference: string;
    };
    paymentId?: string;
  }> {
    Logger.debug("[PaymentBroker] Creating SumUp checkout:", { params });

    const gatewayUrl = import.meta.env.VITE_API_BASE || "http://localhost:4320";
    const internalToken =
      import.meta.env.VITE_INTERNAL_API_TOKEN || "chefiapp-internal-token-dev";

    const path = gatewayPath("api/v1/sumup/checkout", "sumup-create-checkout");
    const response = await fetch(`${gatewayUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internalToken}`,
      },
      body: JSON.stringify({
        orderId: params.orderId,
        restaurantId: params.restaurantId,
        amount: params.amount,
        currency: params.currency,
        description: params.description || `Order ${params.orderId.slice(-6)}`,
        returnUrl: params.returnUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `HTTP ${response.status}: Failed to create SumUp checkout`,
      );
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get SumUp checkout status
   */
  static async getSumUpCheckoutStatus(checkoutId: string): Promise<{
    success: boolean;
    checkout: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      reference: string;
      transactions?: any[];
      validUntil?: string;
    };
  }> {
    const gatewayUrl = import.meta.env.VITE_API_BASE || "http://localhost:4320";
    const internalToken =
      import.meta.env.VITE_INTERNAL_API_TOKEN || "chefiapp-internal-token-dev";

    const base = gatewayPath("api/v1/sumup/checkout", "sumup-get-checkout");
    const response = await fetch(`${gatewayUrl}/${base}/${checkoutId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `HTTP ${response.status}: Failed to get SumUp checkout status`,
      );
    }

    const data = await response.json();
    return data;
  }
}
