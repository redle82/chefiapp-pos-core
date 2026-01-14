/**
 * Mock Fiscal Adapter com Simulação de Falhas
 * 
 * Usado para testar retry e validação de External ID
 * 
 * Modos de falha:
 * - timeout: Simula timeout de rede
 * - 500: Simula erro 500 do servidor
 * - success_no_protocol: Simula SUCCESS mas sem gov_protocol (crítico)
 * - success: Retorna SUCCESS com gov_protocol
 */

import { CoreEvent } from "../../event-log/types";
import { LegalSeal } from "../../legal-boundary/types";
import { FiscalObserver } from "../FiscalObserver";
import { FiscalResult, TaxDocument } from "../types";

export type MockFailureMode = 'timeout' | '500' | 'success_no_protocol' | 'success';

export class MockFiscalAdapterWithFailures implements FiscalObserver {
  private failureMode: MockFailureMode;
  private attemptCount: Map<string, number> = new Map();

  constructor(failureMode: MockFailureMode = 'success') {
    this.failureMode = failureMode;
  }

  /**
   * Muda o modo de falha dinamicamente (útil para testes)
   */
  setFailureMode(mode: MockFailureMode): void {
    this.failureMode = mode;
  }

  async onSealed(seal: LegalSeal, event: CoreEvent): Promise<FiscalResult> {
    const orderId = (event.payload as any)?.order_id || 'unknown';
    const attempt = (this.attemptCount.get(orderId) || 0) + 1;
    this.attemptCount.set(orderId, attempt);

    console.log(`[MockFiscalAdapter] Processing order ${orderId}, attempt ${attempt}, mode: ${this.failureMode}`);

    // Simular latência de rede
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    switch (this.failureMode) {
      case 'timeout':
        // Simular timeout após 2s
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Network timeout: Request exceeded 2s');

      case '500':
        // Simular erro 500 do servidor
        return {
          status: 'REJECTED',
          error_details: 'Internal Server Error: Provider returned 500',
          reported_at: new Date(),
        };

      case 'success_no_protocol':
        // CRÍTICO: Simula SUCCESS mas sem gov_protocol (External ID missing)
        console.warn(`[MockFiscalAdapter] ⚠️  Simulating SUCCESS without gov_protocol for order ${orderId}`);
        return {
          status: 'REPORTED', // ou 'SUCCESS' dependendo do tipo
          // gov_protocol ausente propositalmente
          reported_at: new Date(),
        };

      case 'success':
      default:
        // Sucesso normal com gov_protocol
        const protocol = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
          status: 'REPORTED',
          gov_protocol: protocol,
          reported_at: new Date(),
          pdf_url: `https://mock-provider.com/invoices/${protocol}.pdf`,
        };
    }
  }

  private mapToTaxDocument(seal: LegalSeal, event: CoreEvent): TaxDocument {
    const payload: any = event.payload || {};
    const amount = payload.amount_cents || payload.total || 0;

    return {
      doc_type: "MOCK",
      ref_event_id: event.event_id,
      ref_seal_id: seal.seal_id,
      total_amount: amount,
      vatRate: 0.21, // 21% IVA (Espanha)
      taxes: {
        vat: amount * 0.21 / 1.21,
      },
      items: [],
      raw_payload: { message: "Mock XML Content" }
    };
  }
}
