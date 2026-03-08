/**
 * SAF-T Export Service — Exportação de ficheiro SAF-T XML por período.
 *
 * Fonte de verdade: gm_fiscal_documents (documentos fiscais com hash_signature,
 * fiscal_number, items_snapshot e tax_details reais — NUNCA placeholders).
 *
 * Antigo: lia gm_orders com HASH-${order.id}/SEAL-${order.id} — ILEGAL.
 * Refatoração cirúrgica: só documenta o que já tem selo fiscal no Core.
 */

import {
  generateSaftXmlExport,
  type SaftExportCompany,
} from "../../../../fiscal-modules/pt/saft/saftXml";
import type { TaxDocument } from "../../../../fiscal-modules/types";
import { getTableClient } from "../infra/coreRpc";
import { buildAtcud, buildInvoiceNumber } from "./saftExportUtils";

export interface SaftExportParams {
  restaurantId: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

/**
 * Converts gm_fiscal_documents rows into TaxDocument[] for the SAF-T XML generator.
 * All data comes from the fiscal document snapshot — no recalculation needed.
 */
function fiscalDocsToTaxDocuments(
  fiscalDocs: any[],
  restaurant: {
    name?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    tax_registration_number?: string;
  },
): TaxDocument[] {
  return fiscalDocs.map((doc) => {
    const grossCents = doc.gross_amount_cents ?? 0;
    const taxCents = doc.tax_amount_cents ?? 0;
    const totalAmount = grossCents / 100;

    // Tax details from snapshot (already computed at document creation time)
    const taxDetails: Array<{
      rate: number;
      base_cents: number;
      amount_cents: number;
      name: string;
    }> = Array.isArray(doc.tax_details) ? doc.tax_details : [];

    const primaryVat = taxDetails.find(
      (t: any) => t.name === "IVA" || t.rate > 0,
    );
    const vatRate = primaryVat?.rate ?? 0.23;
    const vatAmountCents = primaryVat?.amount_cents ?? taxCents;

    // Items from snapshot (already frozen at document creation time)
    const itemsSnapshot: Array<{
      code: string;
      description: string;
      quantity: number;
      unit_price_cents: number;
      total_cents: number;
    }> = Array.isArray(doc.items_snapshot) ? doc.items_snapshot : [];

    const items = itemsSnapshot.map((item: any) => ({
      code: item.code || item.product_id || "N/A",
      description: item.description || item.name_snapshot || "Item",
      quantity: item.quantity || 1,
      unit_price: (item.unit_price_cents ?? item.unit_price ?? 0) / 100,
      total: (item.total_cents ?? item.total ?? 0) / 100,
    }));

    // Build invoice number from real fiscal_series + fiscal_number
    const series = doc.fiscal_series || "A";
    const fiscalNumber = doc.fiscal_number ?? 0;
    const invoiceNumber = buildInvoiceNumber(`FT-${series}`, fiscalNumber);
    const atcud = buildAtcud(`FT-${series}`, fiscalNumber);
    const issuedAt = doc.created_at || new Date().toISOString();

    return {
      doc_type: "SAF-T",
      ref_event_id: doc.source_event_id || doc.order_id || doc.id,
      ref_seal_id: doc.seal_id || doc.id,
      total_amount: totalAmount,
      taxes: { vat: vatAmountCents / 100 },
      vatRate,
      vatAmount: vatAmountCents,
      items,
      raw_payload: {
        fiscal_document_id: doc.id,
        order_id: doc.order_id,
        restaurant_id: doc.restaurant_id,
        restaurant_name: restaurant.name || "Restaurante",
        address: restaurant.address || "N/A",
        city: restaurant.city || "N/A",
        postal_code: restaurant.postal_code || "0000-000",
        tax_registration_number:
          restaurant.tax_registration_number || "999999999",
        issued_at: issuedAt,
        invoice_number: invoiceNumber,
        fiscal_number: fiscalNumber,
        fiscal_series: series,
        atcud,
        hash_signature: doc.hash_signature, // Real SHA-256 from Core — NEVER a placeholder
        qr_code_data: doc.qr_code_data,
        gov_protocol: doc.gov_protocol,
        status: doc.status,
      },
    };
  });
}

/**
 * Exports SAF-T XML for the given restaurant and date range.
 * Returns XML string; caller can trigger download.
 *
 * Queries gm_fiscal_documents (the fiscal source of truth) — NOT gm_orders.
 * Only ACCEPTED or SUBMITTED documents are included; DRAFT/ERROR are excluded.
 */
export async function exportSaftXml(
  params: SaftExportParams,
): Promise<{ xml: string; documentCount: number; error?: string }> {
  try {
    const client = await getTableClient();

    const fromDate = `${params.from}T00:00:00.000Z`;
    const toDate = `${params.to}T23:59:59.999Z`;

    // Query fiscal documents — the legal source of truth
    const { data: fiscalDocs, error: docsError } = await client
      .from("gm_fiscal_documents")
      .select(
        "id, restaurant_id, order_id, doc_type, fiscal_series, fiscal_number, " +
          "gross_amount_cents, net_amount_cents, tax_amount_cents, currency, " +
          "tax_details, items_snapshot, jurisdiction, status, " +
          "seal_id, source_event_id, hash_signature, qr_code_data, gov_protocol, " +
          "created_at",
      )
      .eq("restaurant_id", params.restaurantId)
      .eq("jurisdiction", "PT")
      .in("status", ["ACCEPTED", "SUBMITTED", "PENDING"])
      .in("doc_type", ["INVOICE", "SIMPLIFIED_INVOICE", "CREDIT_NOTE"])
      .gte("created_at", fromDate)
      .lte("created_at", toDate)
      .order("fiscal_number", { ascending: true });

    if (docsError) {
      return { xml: "", documentCount: 0, error: docsError.message };
    }

    const docList = Array.isArray(fiscalDocs) ? fiscalDocs : [];
    if (docList.length === 0) {
      return {
        xml: "",
        documentCount: 0,
        error: "Nenhum documento fiscal encontrado no período selecionado.",
      };
    }

    // Restaurant info for company header
    const { data: restaurantRow, error: restError } = await client
      .from("gm_restaurants")
      .select("id, name, address, city, postal_code")
      .eq("id", params.restaurantId)
      .single();

    if (restError || !restaurantRow) {
      return {
        xml: "",
        documentCount: 0,
        error: restError?.message || "Restaurante não encontrado.",
      };
    }

    const restaurant = {
      name: restaurantRow.name,
      address: restaurantRow.address,
      city: restaurantRow.city,
      postal_code: restaurantRow.postal_code,
      tax_registration_number: (restaurantRow as any).tax_registration_number,
    };

    const documents = fiscalDocsToTaxDocuments(docList, restaurant);
    const company: SaftExportCompany = {
      companyId: params.restaurantId.slice(0, 20),
      taxRegistrationNumber: restaurant.tax_registration_number || "999999999",
      companyName: restaurant.name || "Restaurante",
      address: restaurant.address || "N/A",
      city: restaurant.city || "N/A",
      postalCode: restaurant.postal_code || "0000-000",
    };

    const xml = generateSaftXmlExport(documents, company, {
      startDate: params.from,
      endDate: params.to,
    });

    return { xml, documentCount: docList.length };
  } catch (err: any) {
    return {
      xml: "",
      documentCount: 0,
      error: err?.message || "Erro ao gerar SAF-T.",
    };
  }
}
