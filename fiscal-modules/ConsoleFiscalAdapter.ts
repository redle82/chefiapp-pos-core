import { CoreEvent } from "../event-log/types";
import { LegalSeal } from "../legal-boundary/types";
import { FiscalObserver } from "./FiscalObserver";
import { FiscalResult, TaxDocument } from "./types";

export class ConsoleFiscalAdapter implements FiscalObserver {

    async onSealed(seal: LegalSeal, event: CoreEvent): Promise<FiscalResult> {
        console.log(`[FISCAL] Observing Seal: ${seal.seal_id} for Event: ${event.event_id}`);

        // Anti-Corruption Layer: Map Core -> Tax Doc
        const taxDoc = this.mapToTaxDocument(seal, event);

        // Simulate Transmission
        console.log(`[FISCAL] Transmitting ${taxDoc.doc_type}...`);

        // Simulate Network Latency
        // await new Promise(r => setTimeout(r, 100));

        console.log(`[FISCAL] Success! Protocol: PROTO-MOCK-${Date.now()}`);

        return {
            status: "REPORTED",
            gov_protocol: `PROTO-MOCK-${Date.now()}`,
            reported_at: new Date()
        };
    }

    private mapToTaxDocument(seal: LegalSeal, event: CoreEvent): TaxDocument {
        // In a real implementation, this would parse event.payload fully.
        // For Mock, we extract generic data.

        const payload: any = event.payload || {};
        const amount = payload.amount || payload.total || 0;

        return {
            doc_type: "MOCK",
            ref_event_id: event.event_id,
            ref_seal_id: seal.seal_id,
            total_amount: amount,
            taxes: {
                icms: amount * 0.18,
                pis: amount * 0.0165,
                cofins: amount * 0.076
            },
            items: [], // Mock empty
            raw_payload: { message: "Mock XML Content" }
        };
    }
}
