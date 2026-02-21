/**
 * CoreFiscalEventStore - Implementação do FiscalEventStore usando Core (PostgREST fetch).
 *
 * Para uso no frontend (merchant-portal). Backend único: Docker Core.
 */

import type {
  FiscalResult,
  TaxDocument,
} from "../../../../fiscal-modules/types";
import { Logger } from "../logger";
import { supabase } from "../supabase";

export class CoreFiscalEventStore {
  /**
   * Records an interaction with the Fiscal Authority.
   */
  async recordInteraction(
    doc: TaxDocument,
    result: FiscalResult,
    orderId: string,
    restaurantId: string,
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("fiscal_event_store")
        .insert({
          ref_seal_id: doc.ref_seal_id,
          ref_event_id: doc.ref_event_id,
          order_id: orderId,
          restaurant_id: restaurantId,
          doc_type: doc.doc_type,
          gov_protocol: result.gov_protocol || null,
          payload_sent: doc.raw_payload || {},
          response_received: result,
          fiscal_status:
            result.status === "REPORTED"
              ? "REPORTED"
              : result.status === "REJECTED"
              ? "REJECTED"
              : "PENDING",
          retry_count: 0,
        })
        .select("fiscal_event_id")
        .single();

      if (error) {
        if (error.code === "23505") {
          Logger.warn(
            "[CoreFiscalEventStore] Duplicate fiscal document, fetching existing",
            { orderId, docType: doc.doc_type },
          );

          const { data: existing } = await supabase
            .from("fiscal_event_store")
            .select("fiscal_event_id")
            .eq("order_id", orderId)
            .eq("doc_type", doc.doc_type)
            .single();

          if (existing) {
            return existing.fiscal_event_id;
          }
        }

        throw error;
      }

      if (!data) {
        throw new Error("Failed to insert fiscal event");
      }

      Logger.info("[CoreFiscalEventStore] Fiscal event recorded", {
        fiscalEventId: data.fiscal_event_id,
        orderId,
      });

      return data.fiscal_event_id;
    } catch (err: any) {
      Logger.error(
        "[CoreFiscalEventStore] Failed to record interaction",
        err,
        { orderId, docType: doc.doc_type },
      );
      throw err;
    }
  }

  /**
   * Busca documento fiscal por order_id
   */
  async getByOrderId(orderId: string, docType?: string) {
    try {
      let query = supabase
        .from("fiscal_event_store")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (docType) {
        query = query.eq("doc_type", docType);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    } catch (err: any) {
      Logger.error(
        "[CoreFiscalEventStore] Failed to get fiscal document",
        err,
        { orderId },
      );
      return null;
    }
  }
}
