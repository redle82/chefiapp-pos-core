/**
 * Core Print API — FASE 6 (CORE_PRINT_CONTRACT)
 *
 * UI pede impressão ao Core; Core valida e enfileira. UI mostra estado (enviado, em fila, falha).
 * Ref: docs/architecture/CORE_PRINT_CONTRACT.md, docs/strategy/IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md
 */

import { invokeRpc } from "../infra/coreRpc";

export type PrintJobType = "kitchen_ticket" | "receipt" | "z_report";

export type RequestPrintParams = {
  restaurantId: string;
  type: PrintJobType;
  orderId?: string | null;
  payload?: Record<string, unknown>;
};

export type RequestPrintResult = {
  job_id: string;
  status: "pending" | "sent" | "failed";
};

export type PrintJobStatusResult = {
  job_id: string;
  status: "pending" | "sent" | "failed" | "not_found";
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Pede impressão ao Core. Core valida e enfileira; retorna job_id e status.
 * Para kitchen_ticket sem driver real, o Core devolve status 'sent' para a UI acionar browser print.
 */
export async function requestPrint(
  params: RequestPrintParams
): Promise<{ data: RequestPrintResult | null; error: { message: string } | null }> {
  const { data, error } = await invokeRpc<RequestPrintResult>("request_print", {
    p_restaurant_id: params.restaurantId,
    p_type: params.type,
    p_order_id: params.orderId ?? null,
    p_payload: params.payload ?? {},
  });
  return { data: data ?? null, error };
}

/**
 * Consulta estado do job de impressão no Core.
 */
export async function getPrintJobStatus(
  jobId: string
): Promise<{ data: PrintJobStatusResult | null; error: { message: string } | null }> {
  const { data, error } = await invokeRpc<PrintJobStatusResult>(
    "get_print_job_status",
    { p_job_id: jobId }
  );
  return { data: data ?? null, error };
}
