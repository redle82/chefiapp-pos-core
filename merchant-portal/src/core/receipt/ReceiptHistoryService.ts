/**
 * ReceiptHistoryService — Persiste recibos no gm_receipt_log.
 *
 * Usado para auditoria, reimpressao e historico de recibos.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";
import type { ReceiptData } from "../../pages/TPVMinimal/types/ReceiptData";

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
