/**
 * SAF-T Adapter (Portugal)
 *
 * SAF-T (Standard Audit File for Tax) é o formato de faturação eletrônica de Portugal.
 * Para MVP, implementamos geração de XML básico conforme especificação.
 *
 * Referência: https://www.portaldasfinancas.gov.pt/
 */

import type { CoreEvent } from "../../event-log/types";
import type { LegalSeal } from "../../legal-boundary/types";
import { Logger } from "../../merchant-portal/src/core/logger/Logger";
import type { FiscalObserver } from "../FiscalObserver";
import {
  buildAtcud,
  buildInvoiceNumber,
  computeHashChain,
} from "../pt/saft/saftUtils";
import { generateSaftXml } from "../pt/saft/saftXml";
import type { FiscalResult, TaxDocument } from "../types";

export class SAFTAdapter implements FiscalObserver {
  private vatRate = 0.23; // 23% IVA (Portugal - taxa geral)

  async onSealed(seal: LegalSeal, event: CoreEvent): Promise<FiscalResult> {
    Logger.info("[SAF-T] Processing fiscal document", {
      sealId: seal.seal_id,
      eventId: event.event_id,
    });

    try {
      // 1. Criar documento fiscal
      const taxDoc = this.mapToTaxDocument(seal, event);

      // 2. Gerar XML SAF-T
      const xml = generateSaftXml(taxDoc);

      // 3. Transmitir para governo (MVP: simulação)
      // Em produção, isso faria POST para API do governo português
      const protocol = await this.transmitToGovernment(xml, taxDoc);

      Logger.info("[SAF-T] Document transmitted", {
        protocol,
        orderId: taxDoc.raw_payload?.order_id,
      });

      return {
        status: "REPORTED",
        gov_protocol: protocol,
        reported_at: new Date(),
      };
    } catch (error: any) {
      Logger.error("[SAF-T] Failed to process fiscal document", error, {
        sealId: seal.seal_id,
      });

      return {
        status: "REJECTED",
        error_details: error.message,
        reported_at: new Date(),
      };
    }
  }

  private mapToTaxDocument(seal: LegalSeal, event: CoreEvent): TaxDocument {
    const payload: any = event.payload || {};
    const totalAmount = (payload.amount_cents || payload.total || 0) / 100;
    const vatAmount = (totalAmount * this.vatRate) / (1 + this.vatRate); // IVA incluído no total
    const subtotal = totalAmount - vatAmount;
    const vatAmountCents = Math.round(vatAmount * 100); // TASK-2.3.1: Valor absoluto em centavos

    const invoiceSeries = payload.invoice_series || payload.series || "FT-2026";
    const invoiceSequence = Number(
      payload.invoice_sequence ?? payload.sequence_id ?? 1,
    );
    const invoiceNumber = buildInvoiceNumber(invoiceSeries, invoiceSequence);
    const atcud = buildAtcud(invoiceSeries, invoiceSequence);
    const issuedAt = payload.issued_at || new Date().toISOString();
    const prevHash = payload.hash_chain_prev || "GENESIS";
    const hashChain = computeHashChain(
      prevHash,
      `${invoiceNumber}|${totalAmount.toFixed(2)}|${issuedAt}|${seal.seal_id}`,
    );

    // Mapear items do payload
    const items = (payload.items || []).map((item: any) => ({
      code: item.product_id || item.code || "N/A",
      description:
        item.name || item.name_snapshot || item.description || "Item",
      quantity: item.quantity || 1,
      unit_price:
        (item.price_snapshot || item.unit_price || item.price || 0) / 100,
      total:
        ((item.price_snapshot || item.unit_price || item.price || 0) *
          (item.quantity || 1)) /
        100,
    }));

    return {
      doc_type: "SAF-T",
      ref_event_id: event.event_id,
      ref_seal_id: seal.seal_id,
      total_amount: totalAmount,
      taxes: {
        vat: vatAmount,
      },
      // TASK-2.3.1: Separar vatRate de vatAmount
      vatRate: this.vatRate, // Taxa como percentual (0.23 = 23%)
      vatAmount: vatAmountCents, // Valor absoluto em centavos
      items: items,
      raw_payload: {
        order_id: payload.order_id,
        restaurant_id: payload.restaurant_id,
        total_amount: totalAmount,
        vat_amount: vatAmount,
        subtotal: subtotal,
        items: items,
        generated_at: new Date().toISOString(),
        issued_at: issuedAt,
        invoice_series: invoiceSeries,
        invoice_sequence: invoiceSequence,
        invoice_number: invoiceNumber,
        atcud,
        hash_chain_prev: prevHash,
        hash_chain: hashChain,
        seal_hash: seal.hash,
        restaurant_name: payload.restaurant_name,
        tax_registration_number: payload.tax_registration_number,
        address: payload.address,
        city: payload.city,
        postal_code: payload.postal_code,
      },
    };
  }

  private async transmitToGovernment(
    xml: string,
    taxDoc: TaxDocument,
  ): Promise<string> {
    // MVP: Simulação de transmissão
    // Em produção, fazer POST para API do governo português

    Logger.info("[SAF-T] Simulating transmission to government", {
      orderId: taxDoc.raw_payload?.order_id,
    });

    // Simular latência de rede
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Retornar protocolo simulado
    const protocol = `SAFT-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    Logger.info("[SAF-T] Transmission successful", { protocol });

    return protocol;
  }
}
