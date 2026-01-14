/**
 * TicketBAI Adapter (Espanha)
 * 
 * TicketBAI é o sistema de faturação eletrônica da Espanha (País Basco).
 * Para MVP, implementamos geração de XML básico conforme especificação.
 * 
 * Referência: https://www.ticketbai.es/
 */

import { FiscalObserver } from '../FiscalObserver';
import { FiscalResult, TaxDocument } from '../types';
import { CoreEvent } from '../../event-log/types';
import { LegalSeal } from '../../legal-boundary/types';
import { Logger } from '../../merchant-portal/src/core/logger/Logger';

export class TicketBAIAdapter implements FiscalObserver {
    private vatRate = 0.21; // 21% IVA (Espanha - taxa geral)

    async onSealed(seal: LegalSeal, event: CoreEvent): Promise<FiscalResult> {
        Logger.info('[TicketBAI] Processing fiscal document', {
            sealId: seal.seal_id,
            eventId: event.event_id,
        });

        try {
            // 1. Criar documento fiscal
            const taxDoc = this.mapToTaxDocument(seal, event);

            // 2. Gerar XML TicketBAI
            const xml = this.generateTicketBAIXML(taxDoc);

            // 3. Transmitir para governo (MVP: simulação)
            // Em produção, isso faria POST para API do governo
            const protocol = await this.transmitToGovernment(xml, taxDoc);

            Logger.info('[TicketBAI] Document transmitted', {
                protocol,
                orderId: taxDoc.raw_payload?.order_id,
            });

            return {
                status: 'REPORTED',
                gov_protocol: protocol,
                reported_at: new Date(),
            };
        } catch (error: any) {
            Logger.error('[TicketBAI] Failed to process fiscal document', error, {
                sealId: seal.seal_id,
            });

            return {
                status: 'REJECTED',
                error_details: error.message,
                reported_at: new Date(),
            };
        }
    }

    private mapToTaxDocument(seal: LegalSeal, event: CoreEvent): TaxDocument {
        const payload: any = event.payload || {};
        const totalAmount = (payload.amount_cents || payload.total || 0) / 100;
        const vatAmount = totalAmount * this.vatRate / (1 + this.vatRate); // IVA incluído no total
        const subtotal = totalAmount - vatAmount;
        const vatAmountCents = Math.round(vatAmount * 100); // TASK-2.3.1: Valor absoluto em centavos

        // Mapear items do payload
        const items = (payload.items || []).map((item: any) => ({
            code: item.product_id || item.code || 'N/A',
            description: item.name || item.name_snapshot || item.description || 'Item',
            quantity: item.quantity || 1,
            unit_price: (item.price_snapshot || item.unit_price || item.price || 0) / 100,
            total: ((item.price_snapshot || item.unit_price || item.price || 0) * (item.quantity || 1)) / 100,
        }));

        return {
            doc_type: 'TICKETBAI',
            ref_event_id: event.event_id,
            ref_seal_id: seal.seal_id,
            total_amount: totalAmount,
            taxes: {
                vat: vatAmount,
            },
            // TASK-2.3.1: Separar vatRate de vatAmount
            vatRate: this.vatRate, // Taxa como percentual (0.21 = 21%)
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
            },
        };
    }

    private generateTicketBAIXML(taxDoc: TaxDocument): string {
        // MVP: XML básico conforme estrutura TicketBAI
        // Em produção, usar biblioteca XML ou template engine
        const now = new Date().toISOString();
        const protocol = `TBAI-${Date.now()}`;

        return `<?xml version="1.0" encoding="UTF-8"?>
<TicketBai>
    <Cabecera>
        <IDVersionTBAI>1.2</IDVersionTBAI>
    </Cabecera>
    <Sujetos>
        <Emisor>
            <NIF>${taxDoc.raw_payload?.restaurant_id || 'N/A'}</NIF>
            <ApellidosNombreRazonSocial>Restaurante</ApellidosNombreRazonSocial>
        </Emisor>
    </Sujetos>
    <Factura>
        <CabeceraFactura>
            <SerieFactura>TBAI</SerieFactura>
            <NumFactura>${taxDoc.ref_event_id}</NumFactura>
            <FechaExpedicionFactura>${now}</FechaExpedicionFactura>
        </CabeceraFactura>
        <DatosFactura>
            <ImporteTotalFactura>${taxDoc.total_amount.toFixed(2)}</ImporteTotalFactura>
            <BaseImponible>${(taxDoc.total_amount - (taxDoc.taxes.vat || 0)).toFixed(2)}</BaseImponible>
            <TipoImpositivo>21.00</TipoImpositivo>
            <CuotaImpuesto>${(taxDoc.taxes.vat || 0).toFixed(2)}</CuotaImpuesto>
        </DatosFactura>
    </Factura>
    <HuellaTBAI>
        <EncadenamientoFacturaAnterior>
            <SerieFacturaAnterior>TBAI</SerieFacturaAnterior>
            <NumFacturaAnterior>${taxDoc.ref_seal_id}</NumFacturaAnterior>
        </EncadenamientoFacturaAnterior>
    </HuellaTBAI>
</TicketBai>`;
    }

    private async transmitToGovernment(xml: string, taxDoc: TaxDocument): Promise<string> {
        // MVP: Simulação de transmissão
        // Em produção, fazer POST para API do governo espanhol
        
        Logger.info('[TicketBAI] Simulating transmission to government', {
            orderId: taxDoc.raw_payload?.order_id,
        });

        // Simular latência de rede
        await new Promise(resolve => setTimeout(resolve, 100));

        // Retornar protocolo simulado
        const protocol = `TBAI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        Logger.info('[TicketBAI] Transmission successful', { protocol });
        
        return protocol;
    }
}
