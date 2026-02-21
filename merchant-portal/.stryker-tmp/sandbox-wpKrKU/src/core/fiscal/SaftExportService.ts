/**
 * SAF-T Export Service — Exportação de ficheiro SAF-T XML por período.
 * Fonte: gm_orders no intervalo [from, to]; geração via fiscal-modules.
 */

import { getTableClient } from "../infra/coreRpc";
import type { TaxDocument } from "../../../../fiscal-modules/types";
import {
  generateSaftXmlExport,
  type SaftExportCompany,
} from "../../../../fiscal-modules/pt/saft/saftXml";
import { buildAtcud, buildInvoiceNumber } from "./saftExportUtils";

export interface SaftExportParams {
  restaurantId: string;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

/**
 * Fetches orders in date range and builds TaxDocument[] for PT (SAF-T).
 */
async function ordersToTaxDocuments(
  orders: any[],
  restaurant: { name?: string; address?: string; city?: string; postal_code?: string; tax_registration_number?: string },
): Promise<TaxDocument[]> {
  const series = `FT-${orders[0]?.created_at?.slice(0, 7).replace("-", "") || new Date().toISOString().slice(0, 7).replace("-", "")}`;
  const docs: TaxDocument[] = [];

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const totalCents = order.total_cents ?? 0;
    const totalAmount = totalCents / 100;
    const vatRate = 0.23;
    const vatAmount = (totalAmount * vatRate) / (1 + vatRate);
    const seq = i + 1;
    const invoiceNumber = buildInvoiceNumber(series, seq);
    const atcud = buildAtcud(series, seq);
    const issuedAt = order.created_at || new Date().toISOString();

    const orderItems = order.items || order.gm_order_items || [];
    const items = orderItems.map((item: any) => ({
      code: item.product_id || "N/A",
      description: item.name_snapshot || item.product_name || "Item",
      quantity: item.quantity || 1,
      unit_price: (item.price_snapshot || item.unit_price || 0) / 100,
      total:
        ((item.price_snapshot || item.unit_price || 0) * (item.quantity || 1)) /
        100,
    }));

    docs.push({
      doc_type: "SAF-T",
      ref_event_id: order.id,
      ref_seal_id: `SEAL-${order.id}`,
      total_amount: totalAmount,
      taxes: { vat: vatAmount },
      vatRate,
      vatAmount: Math.round(vatAmount * 100),
      items,
      raw_payload: {
        order_id: order.id,
        restaurant_id: order.restaurant_id,
        restaurant_name: restaurant.name || "Restaurante",
        address: restaurant.address || "N/A",
        city: restaurant.city || "N/A",
        postal_code: restaurant.postal_code || "0000-000",
        tax_registration_number: restaurant.tax_registration_number || "999999999",
        issued_at: issuedAt,
        invoice_number: invoiceNumber,
        atcud,
        hash_chain: `HASH-${order.id}`,
      },
    });
  }

  return docs;
}

/**
 * Exports SAF-T XML for the given restaurant and date range.
 * Returns XML string; caller can trigger download.
 */
export async function exportSaftXml(
  params: SaftExportParams,
): Promise<{ xml: string; error?: string }> {
  try {
    const client = await getTableClient();

    const fromDate = `${params.from}T00:00:00.000Z`;
    const toDate = `${params.to}T23:59:59.999Z`;

    const { data: orders, error: ordersError } = await client
      .from("gm_orders")
      .select("id, restaurant_id, total_cents, created_at, items:gm_order_items(*)")
      .eq("restaurant_id", params.restaurantId)
      .gte("created_at", fromDate)
      .lte("created_at", toDate)
      .order("created_at", { ascending: true });

    if (ordersError) {
      return { xml: "", error: ordersError.message };
    }

    const orderList = Array.isArray(orders) ? orders : [];
    if (orderList.length === 0) {
      return {
        xml: "",
        error: "Nenhum pedido encontrado no período selecionado.",
      };
    }

    const { data: restaurantRow, error: restError } = await client
      .from("gm_restaurants")
      .select("id, name, address, city, postal_code")
      .eq("id", params.restaurantId)
      .single();

    if (restError || !restaurantRow) {
      return { xml: "", error: restError?.message || "Restaurante não encontrado." };
    }

    const restaurant = {
      name: restaurantRow.name,
      address: restaurantRow.address,
      city: restaurantRow.city,
      postal_code: restaurantRow.postal_code,
      tax_registration_number: (restaurantRow as any).tax_registration_number,
    };

    const documents = await ordersToTaxDocuments(orderList, restaurant);
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

    return { xml };
  } catch (err: any) {
    return {
      xml: "",
      error: err?.message || "Erro ao gerar SAF-T.",
    };
  }
}
