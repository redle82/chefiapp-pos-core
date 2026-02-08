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
   */
  async validateNIF(nif: string): Promise<ATValidationResult> {
    try {
      // Remove spaces and dashes
      const cleanNIF = nif.replace(/[\s-]/g, "");

      // Basic validation (9 digits)
      if (!/^\d{9}$/.test(cleanNIF)) {
        return {
          isValid: false,
          nif: cleanNIF,
          error: "NIF deve ter 9 dígitos",
        };
      }

      // TODO: Integrate with real AT API
      // For now, return placeholder validation
      // In production, this would call the AT API to validate the NIF

      return {
        isValid: true,
        nif: cleanNIF,
        name: "Validado (placeholder)", // Would come from AT API
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
   * Submit document to AT
   */
  async submitDocument(document: ATDocument): Promise<{
    success: boolean;
    atDocumentId?: string;
    error?: string;
  }> {
    try {
      // TODO: Integrate with real AT API
      // This would submit the document to the AT system

      // For now, log the document
      Logger.info("AT Document submitted (placeholder)", {
        documentType: document.documentType,
        documentNumber: document.documentNumber,
        totalAmount: document.totalAmount,
      });

      // Store in database as evidence
      const { error } = await supabase.from("at_submissions").insert({
        document_type: document.documentType,
        document_number: document.documentNumber,
        issue_date: document.issueDate,
        customer_nif: document.customerNIF,
        total_amount: document.totalAmount,
        tax_amount: document.taxAmount,
        items: document.items,
        submitted_at: new Date().toISOString(),
        status: "submitted", // Would be updated by webhook from AT
      });

      if (error) throw error;

      return {
        success: true,
        atDocumentId: `AT-${Date.now()}`,
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
