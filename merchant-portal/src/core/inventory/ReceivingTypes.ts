export type { PurchaseOrder } from './PurchaseTypes';

// ------------------------------------------------------------------
// 📦 RECEIVING RITUAL SCHEMAS
// ------------------------------------------------------------------
// "Nada entra no corpo sem ser reconhecido pelo sistema."
// ------------------------------------------------------------------

export interface IngestionSession {
    id: string;
    startedAt: number;
    witnessId: string; // "Who is opening the box?"

    // The Source
    provider?: string;
    invoiceImage?: string; // URL
    invoiceData?: InvoiceData; // OCR result (Mocked)

    // The Link
    purchaseOrderId?: string; // Optional (can receive without PO, but flag it)

    // The Reality Check
    items: ReceivedItem[];

    status: 'scanning' | 'reconciling' | 'committed';
}

export interface InvoiceData {
    rawText: string;
    detectedDate: string;
    detectedTotalCents: number;
    detectedItems: {
        rawName: string;
        qty: number;
        unitPriceCents: number;
    }[];
}

export interface ReceivedItem {
    itemId: string; // The Internal Truth

    // What arrived
    quantityReceived: number;
    unit: string;

    // Financial Truth
    unitPriceCents: number;
    totalPriceCents: number;

    // Quality Check (The "Photo")
    qualityStatus: 'ok' | 'damaged' | 'wrong_item' | 'near_expiry';
    expiryDate?: string; // ISO

    // 🧠 The Divergence (System vs Reality)
    divergence?: {
        type: 'price_change' | 'quantity_mismatch' | 'unsolicited_item';
        severity: 'low' | 'medium' | 'high';
        deltaValue: number; // e.g. +€5.00
    };
}

export interface TruthUpdate {
    itemId: string;
    newStockLevel: number;
    newAverageCostCents: number; // Moving average
    lastRestockedAt: number;
}
