/**
 * Core Orders API — Criação de pedidos via Core (Docker). NO SUPABASE como autoridade.
 *
 * Contrato: CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md
 * Criação de pedidos e totais são soberania do Core. UI chama esta API apenas.
 * Quando Docker Core está ativo: PostgREST RPC exclusivamente.
 * Quando Supabase (transicional): fallback técnico; não usar como autoridade para totais.
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
 * Invoca create_order_atomic no Core (Docker) ou no Supabase (transicional).
 * Em modo Docker: única autoridade; totais calculados pelo Core.
 * Em modo Supabase: technical debt; não usar como autoridade para totais.
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

  if (getBackendType() === BackendType.docker) {
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

  // Transicional: Supabase (technical debt — FINANCIAL_CORE_VIOLATION_AUDIT)
  try {
    const { supabase } = await import("../supabase");
    const raw = await (supabase as any).rpc("create_order_atomic", normalized) as {
      data: CreateOrderAtomicResult | null;
      error: { message?: string; code?: string } | null;
    };
    if (raw.error) {
      return {
        data: null,
        error: {
          message: raw.error.message ?? "Unknown error",
          code: raw.error.code,
        },
      };
    }
    return { data: raw.data, error: null };
  } catch (e: any) {
    return {
      data: null,
      error: { message: e?.message ?? String(e) },
    };
  }
}
