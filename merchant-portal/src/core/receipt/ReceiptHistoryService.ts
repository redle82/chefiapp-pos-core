/**
 * ReceiptHistoryService — Persiste recibos no gm_receipt_log.
 *
 * Usado para auditoria, reimpressao e historico de recibos.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";
import type { ReceiptData } from "../../pages/TPVMinimal/types/ReceiptData";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ReceiptLogRow {
  id: string;
  restaurant_id: string;
  order_id: string;
  receipt_data: ReceiptData;
  fiscal_document_number: string | null;
  operator_id: string | null;
  printed_at: string | null;
  created_at: string;
}

export interface ListReceiptsFilters {
  /** ISO date string (YYYY-MM-DD). Inclusive start. */
  dateFrom?: string;
  /** ISO date string (YYYY-MM-DD). Inclusive end. */
  dateTo?: string;
  /** Filter by payment method (cash, card, pix). */
  paymentMethod?: string;
  /** Search by order ID (prefix match). */
  orderIdSearch?: string;
  /** Max rows to return (default 100). */
  limit?: number;
  /** Offset for pagination. */
  offset?: number;
}

export interface ListReceiptsResult {
  rows: ReceiptLogRow[];
  /** Total count matching the filters (for pagination). */
  totalCount: number;
}

/**
 * Grava um recibo no historico (fire-and-forget, nao bloqueia o fluxo de pagamento).
 *
 * @returns ID do recibo gravado, ou null se falhar.
 */
export async function saveReceipt(
  restaurantId: string,
  receipt: ReceiptData,
  operatorId?: string,
): Promise<string | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_receipt_log")
      .insert({
        restaurant_id: restaurantId,
        order_id: receipt.orderId,
        receipt_data: receipt,
        fiscal_document_number: receipt.fiscal?.documentNumber ?? null,
        operator_id: operatorId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      Logger.warn("[ReceiptHistory] Failed to save receipt", {
        order_id: receipt.orderId,
        error: error.message,
      });
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    Logger.warn("[ReceiptHistory] saveReceipt error", {
      order_id: receipt.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Busca o recibo pelo ID do pedido (para reimpressao).
 */
export async function getReceiptByOrderId(
  orderId: string,
): Promise<ReceiptData | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_receipt_log")
      .select("receipt_data")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data.receipt_data as ReceiptData;
  } catch {
    return null;
  }
}

/**
 * Lista recibos do historico com filtros e paginacao.
 */
export async function listReceipts(
  restaurantId: string,
  filters?: ListReceiptsFilters,
): Promise<ListReceiptsResult> {
  try {
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;

    let query = dockerCoreClient
      .from("gm_receipt_log")
      .select("*", { count: "exact" })
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.dateFrom) {
      query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
    }
    if (filters?.orderIdSearch) {
      query = query.ilike("order_id", `${filters.orderIdSearch}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      Logger.warn("[ReceiptHistory] listReceipts error", {
        error: error.message,
      });
      return { rows: [], totalCount: 0 };
    }

    let rows = (data ?? []) as ReceiptLogRow[];

    // Client-side filter for payment method (stored inside receipt_data JSONB)
    if (filters?.paymentMethod) {
      rows = rows.filter(
        (r) => r.receipt_data?.paymentMethod === filters.paymentMethod,
      );
    }

    return { rows, totalCount: count ?? rows.length };
  } catch (err) {
    Logger.warn("[ReceiptHistory] listReceipts error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { rows: [], totalCount: 0 };
  }
}

/**
 * Marca um recibo como impresso (actualiza printed_at).
 */
export async function markReceiptPrinted(receiptId: string): Promise<void> {
  try {
    await dockerCoreClient
      .from("gm_receipt_log")
      .update({ printed_at: new Date().toISOString() })
      .eq("id", receiptId);
  } catch (err) {
    Logger.warn("[ReceiptHistory] markPrinted error", {
      receipt_id: receiptId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
