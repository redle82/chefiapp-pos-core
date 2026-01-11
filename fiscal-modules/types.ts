export type FiscalStatus = "PENDING" | "REPORTED" | "REJECTED" | "QUEUED" | "OFFLINE_STORED";

export interface FiscalResult {
    status: FiscalStatus;
    gov_protocol?: string;
    error_details?: string;
    reported_at: Date;
}

export type TaxDocumentType = "SAT_CFE" | "NFC_E" | "NF_E" | "MOCK" | "TICKETBAI" | "SAF-T";

/**
 * Represents the structured data required by the Fiscal Authority.
 * This is DTO, totally separate from Core Event.
 */
export interface TaxDocument {
    doc_type: TaxDocumentType;
    ref_event_id: string; // Link to Core
    ref_seal_id: string;  // Link to Legal Chain

    // Minimal standard fields usually required
    total_amount: number;
    taxes: {
        icms?: number;
        pis?: number;
        cofins?: number;
        vat?: number; // IVA (Espanha/Portugal)
    };
    items: Array<{
        code: string;
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
    }>;

    raw_payload?: any; // The XML or JSON sent to Gov
}
