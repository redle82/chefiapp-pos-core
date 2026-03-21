/**
 * Pix Payment Provider
 *
 * Manual assisted v1: createIntent returns requires_action with Pix instructions.
 * markPaid(intentId, proof?) for manual confirmation (admin-only).
 * Provider-ready v2: placeholder for future automated provider integration.
 */

import type {
  PaymentIntent,
  PaymentIntentStatus,
  PaymentReceipt,
  PaymentError,
} from "../types";

export interface PixProviderConfig {
  /** Optional: SumUp token for SumUp-backed Pix (ES/BR). Manual v1 does not need it. */
  sumupAccessToken?: string;
}

export interface CreateIntentParams {
  restaurantId: string;
  orderId?: string | null;
  amount: number; // cents
  currency: string;
}

export interface MarkPaidParams {
  intentId: string;
  proof?: string;
  actorUserId?: string;
}

/** Manual assisted v1: returns intent with status=requires_action and Pix instructions */
export async function createIntent(
  _config: PixProviderConfig,
  params: CreateIntentParams
): Promise<{ intent: PaymentIntent } | { error: PaymentError }> {
  const intentId = `pix_${params.restaurantId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const amountBrl = (params.amount / 100).toFixed(2);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return {
    intent: {
      id: intentId,
      restaurant_id: params.restaurantId,
      order_id: params.orderId ?? null,
      amount: params.amount,
      currency: "BRL",
      provider: "pix",
      method: "pix",
      status: "requires_action",
      provider_ref: intentId,
      metadata: {},
      pix_instructions: {
        qr_code: `00020126580014br.gov.bcb.pix0136${intentId}5204000053039865802BR5925ChefIApp Manual Pix6009SAO PAULO62070503***6304`,
        copy_paste: `PIX manual: R$ ${amountBrl} — ID ${intentId}`,
        expires_at: expiresAt,
      },
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Mark Pix intent as paid (admin-only).
 * In v1, this is manual confirmation; no provider call.
 */
export async function markPaid(
  _config: PixProviderConfig,
  params: MarkPaidParams
): Promise<{ receipt: PaymentReceipt } | { error: PaymentError }> {
  if (!params.intentId?.trim()) {
    return {
      error: {
        code: "validation_error",
        message: "intent_id is required",
        retryable: false,
        provider: "pix",
      },
    };
  }

  return {
    receipt: {
      id: `pix_receipt_${params.intentId}_${Date.now()}`,
      intent_id: params.intentId,
      provider: "pix",
      provider_ref: params.intentId,
      amount: 0, // Will be filled by RPC from stored intent
      currency: "BRL",
      captured_at: new Date().toISOString(),
      raw: { proof: params.proof, actor_user_id: params.actorUserId },
    },
  };
}
