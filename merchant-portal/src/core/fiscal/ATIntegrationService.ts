/**
 * P4-3: AT (Autoridade Tributária) Integration Service
 *
 * Serviço para integração com a Autoridade Tributária de Portugal
 */

import { Logger } from "../logger";
// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { supabase } from "../supabase";

export interface ATDocument {
  documentType: "invoice" | "receipt" | "credit_note";
  documentNumber: string;
  issueDate: string;
  customerNIF?: string;
  totalAmount: number;
  taxAmount: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
}

export interface ATValidationResult {
  isValid: boolean;
  nif?: string;
  name?: string;
  error?: string;
}

class ATIntegrationService {
  private apiBaseUrl = "https://www.nif.pt"; // Placeholder - usar API real da AT

  /**
   * Validate NIF (Número de Identificação Fiscal)
   *
   * Implements the official Portuguese mod-11 check-digit algorithm.
   * Weights: [9, 8, 7, 6, 5, 4, 3, 2] applied to the first 8 digits.
   * The 9th digit must equal (11 - (weighted_sum % 11)) % 10,
   * with remainder 0 or 1 mapping to check digit 0.
   *
   * Valid first digits: 1,2,3 (individual), 5 (legal person),
   * 6 (public entity), 7 (irregular entities, non-residents),
   * 8 (sole proprietor), 9 (irregular/provisional).
   */
  async validateNIF(nif: string): Promise<ATValidationResult> {
    try {
      // Remove spaces, dashes, dots
      const cleanNIF = nif.replace(/[\s\-\.]/g, "");

      // Must be exactly 9 digits
      if (!/^\d{9}$/.test(cleanNIF)) {
        return {
          isValid: false,
          nif: cleanNIF,
          error: "NIF deve ter 9 dígitos",
        };
      }

      // First digit must be valid entity type
      const firstDigit = cleanNIF[0];
      if (!["1", "2", "3", "5", "6", "7", "8", "9"].includes(firstDigit)) {
        return {
          isValid: false,
          nif: cleanNIF,
          error:
            "NIF inválido: primeiro dígito não corresponde a nenhum tipo de entidade",
        };
      }

      // Mod-11 check digit verification
      const weights = [9, 8, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(cleanNIF[i], 10) * weights[i];
      }
      const remainder = sum % 11;
      const expectedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
      const actualCheckDigit = parseInt(cleanNIF[8], 10);

      if (actualCheckDigit !== expectedCheckDigit) {
        return {
          isValid: false,
          nif: cleanNIF,
          error: "NIF inválido: dígito de controlo não confere",
        };
      }

      // Entity type description
      const entityTypes: Record<string, string> = {
        "1": "Pessoa Singular",
        "2": "Pessoa Singular",
        "3": "Pessoa Singular",
        "5": "Pessoa Coletiva",
        "6": "Organismo Público",
        "7": "Entidade Irregular / Não Residente",
        "8": "Empresário em Nome Individual",
        "9": "Entidade Irregular / Provisório",
      };

      return {
        isValid: true,
        nif: cleanNIF,
        name: entityTypes[firstDigit] || "Entidade desconhecida",
      };
    } catch (err) {
      Logger.error("Failed to validate NIF", err, { nif });
      return {
        isValid: false,
        nif,
        error: "Erro ao validar NIF",
      };
    }
  }

  /**
   * Pure check-digit validation — synchronous, no I/O.
   * Useful for form-level validation before calling validateNIF.
   */
  static isValidNIF(nif: string): boolean {
    const clean = nif.replace(/[\s\-\.]/g, "");
    if (!/^\d{9}$/.test(clean)) return false;
    if (!["1", "2", "3", "5", "6", "7", "8", "9"].includes(clean[0]))
      return false;
    const w = [9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0;
    for (let i = 0; i < 8; i++) s += parseInt(clean[i], 10) * w[i];
    const r = s % 11;
    return parseInt(clean[8], 10) === (r < 2 ? 0 : 11 - r);
  }

  /**
   * Submit document to AT
   *
   * Architecture:
   *  1. Validate document locally (NIF check, required fields)
   *  2. Build SAF-T XML payload
   *  3. POST to Docker Core RPC `at-submit-document`
   *  4. Core relays to AT via SOAP/REST (server-side, keys stay private)
   *  5. Store audit trail in at_submissions table
   *
   * The actual AT credentials and SOAP envelope live in Docker Core,
   * never in the browser. The merchant-portal only sends structured JSON.
   */
  async submitDocument(document: ATDocument): Promise<{
    success: boolean;
    atDocumentId?: string;
    error?: string;
  }> {
    try {
      // 1. Local validation
      if (document.customerNIF) {
        if (!ATIntegrationService.isValidNIF(document.customerNIF)) {
          return { success: false, error: "NIF do cliente inválido" };
        }
      }
      if (document.totalAmount <= 0) {
        return { success: false, error: "Montante total deve ser positivo" };
      }
      if (!document.items || document.items.length === 0) {
        return { success: false, error: "Documento sem itens" };
      }

      Logger.info("AT Document submission started", {
        documentType: document.documentType,
        documentNumber: document.documentNumber,
        totalAmount: document.totalAmount,
      });

      // 2. Persist locally for audit trail
      const { data, error } = await supabase
        .from("at_submissions")
        .insert({
          document_type: document.documentType,
          document_number: document.documentNumber,
          issue_date: document.issueDate,
          customer_nif: document.customerNIF,
          total_amount: document.totalAmount,
          tax_amount: document.taxAmount,
          items: document.items,
          submitted_at: new Date().toISOString(),
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      const localId = data?.id ?? `local-${Date.now()}`;

      // 3. Submit via Docker Core RPC (AT credentials stay server-side)
      //    The Core endpoint handles SAF-T XML construction and AT SOAP call.
      //    When the RPC endpoint is not yet deployed, we store the document
      //    as "pending" and the batch job picks it up.
      try {
        const { error: rpcError } = await supabase.rpc("at-submit-document", {
          payload: {
            document,
            local_id: localId,
          },
        });

        if (rpcError) {
          Logger.warn("AT RPC not available, document queued for batch", {
            localId,
            rpcError: rpcError.message,
          });
          // Document stays as "pending" — batch worker will retry
        } else {
          // Update status to submitted
          await supabase
            .from("at_submissions")
            .update({ status: "submitted" })
            .eq("id", localId);
        }
      } catch (rpcErr) {
        Logger.warn("AT RPC call failed, document queued", { localId });
        // Non-fatal: document is persisted and will be retried
      }

      return {
        success: true,
        atDocumentId: `AT-${localId}`,
      };
    } catch (err) {
      Logger.error("Failed to submit document to AT", err, { document });
      return {
        success: false,
        error: "Erro ao submeter documento à AT",
      };
    }
  }

  /**
   * Get submission status
   */
  async getSubmissionStatus(atDocumentId: string): Promise<{
    status: "pending" | "accepted" | "rejected";
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("at_submissions")
        .select("status, error")
        .eq("at_document_id", atDocumentId)
        .single();

      if (error) throw error;

      return {
        status: data.status || "pending",
        error: data.error,
      };
    } catch (err) {
      Logger.error("Failed to get submission status", err, { atDocumentId });
      return {
        status: "pending",
        error: "Erro ao obter status",
      };
    }
  }
}

export const atIntegrationService = new ATIntegrationService();
