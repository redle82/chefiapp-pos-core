/**
 * Core Orders API — Criação de pedidos via Core (Docker) exclusivamente.
 *
 * Contrato: CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md
 * Criação de pedidos e totais são soberania do Core. Backend único: Docker Core.
 */

import { BackendType, getBackendType } from "./backendAdapter";
import { getDockerCoreFetchClient } from "./dockerCoreFetchClient";

export type CreateOrderAtomicParams = {
  p_restaurant_id: string;
  p_items: Array<{ product_id: string | null; name: string; quantity: number; unit_price: number }>;
  p_payment_method?: string;
  p_sync_metadata?: Record<string, unknown>;
};

export type CreateOrderAtomicResult = {
  id: string;
  total_cents: number;
  status: string;
};

export type CoreOrdersApiResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

/**
 * Invoca create_order_atomic no Core (Docker). Backend único: Docker Core.
 */
export async function createOrderAtomic(
  params: CreateOrderAtomicParams
): Promise<CoreOrdersApiResult<CreateOrderAtomicResult>> {
  const normalized = {
    p_restaurant_id: params.p_restaurant_id,
    p_items: params.p_items,
    p_payment_method: params.p_payment_method ?? "cash",
    p_sync_metadata: params.p_sync_metadata ?? null,
  };

  if (getBackendType() !== BackendType.docker) {
    return {
      data: null,
      error: {
        message:
          "Backend must be Docker Core. Configure VITE_CORE_URL (or run dev with proxy).",
        code: "BACKEND_NOT_DOCKER",
      },
    };
  }

  const client = getDockerCoreFetchClient();
  const out = await client.rpc("create_order_atomic", normalized);
  const data = out.data as CreateOrderAtomicResult | null;
  if (out.error) {
    return {
      data: null,
      error: {
        message: out.error.message,
        code: out.error.code,
      },
    };
  }
  if (!data?.id) {
    return {
      data: null,
      error: { message: "Core RPC did not return order id" },
    };
  }
  return { data, error: null };
}
