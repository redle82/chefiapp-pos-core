/**
 * SAF-T Adapter (Portugal)
 * 
 * SAF-T (Standard Audit File for Tax) é o formato de faturação eletrônica de Portugal.
 * Para MVP, implementamos geração de XML básico conforme especificação.
 * 
 * Referência: https://www.portaldasfinancas.gov.pt/
 */

import { FiscalObserver } from '../FiscalObserver';
import { FiscalResult, TaxDocument } from '../types';
import { CoreEvent } from '../../event-log/types';
import { LegalSeal } from '../../legal-boundary/types';
import { Logger } from '../../merchant-portal/src/core/logger/Logger';

export class SAFTAdapter implements FiscalObserver {
    private vatRate = 0.23; // 23% IVA (Portugal - taxa geral)

    async onSealed(seal: LegalSeal, event: CoreEvent): Promise<FiscalResult> {
        Logger.info('[SAF-T] Processing fiscal document', {
            sealId: seal.seal_id,
            eventId: event.event_id,
        });

        try {
            // 1. Criar documento fiscal
            const taxDoc = this.mapToTaxDocument(seal, event);

            // 2. Gerar XML SAF-T
            const xml = this.generateSAFTXML(taxDoc);

            // 3. Transmitir para governo (MVP: simulação)
            // Em produção, isso faria POST para API do governo português
            const protocol = await this.transmitToGovernment(xml, taxDoc);

            Logger.info('[SAF-T] Document transmitted', {
                protocol,
                orderId: taxDoc.raw_payload?.order_id,
            });

            return {
                status: 'REPORTED',
                gov_protocol: protocol,
                reported_at: new Date(),
            };
        } catch (error: any) {
            Logger.error('[SAF-T] Failed to process fiscal document', error, {
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
        const vatAmount = totalAmount * this.vatRate;
        const subtotal = totalAmount - vatAmount;

        // Mapear items do payload
        const items = (payload.items || []).map((item: any) => ({
            code: item.product_id || item.code || 'N/A',
            description: item.name || item.name_snapshot || item.description || 'Item',
            quantity: item.quantity || 1,
            unit_price: (item.price_snapshot || item.unit_price || item.price || 0) / 100,
            total: ((item.price_snapshot || item.unit_price || item.price || 0) * (item.quantity || 1)) / 100,
        }));

        return {
            doc_type: 'SAF-T',
            ref_event_id: event.event_id,
            ref_seal_id: seal.seal_id,
            total_amount: totalAmount,
            taxes: {
                vat: vatAmount,
            },
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

    private generateSAFTXML(taxDoc: TaxDocument): string {
        // MVP: XML básico conforme estrutura SAF-T
        // Em produção, usar biblioteca XML ou template engine
        const now = new Date().toISOString();
        const protocol = `SAFT-${Date.now()}`;

        return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile>
    <Header>
        <AuditFileVersion>1.04_01</AuditFileVersion>
        <CompanyID>${taxDoc.raw_payload?.restaurant_id || 'N/A'}</CompanyID>
        <TaxRegistrationNumber>N/A</TaxRegistrationNumber>
        <TaxAccountingBasis>N</TaxAccountingBasis>
        <CompanyName>Restaurante</CompanyName>
        <CompanyAddress>
            <AddressDetail>N/A</AddressDetail>
            <City>N/A</City>
            <PostalCode>N/A</PostalCode>
            <Country>PT</Country>
        </CompanyAddress>
        <FiscalYear>${new Date().getFullYear()}</FiscalYear>
        <StartDate>${now}</StartDate>
        <EndDate>${now}</EndDate>
        <CurrencyCode>EUR</CurrencyCode>
        <DateCreated>${now}</DateCreated>
        <TaxEntity>N/A</TaxEntity>
        <ProductCompanyTaxID>N/A</ProductCompanyTaxID>
        <SoftwareCertificateNumber>0</SoftwareCertificateNumber>
        <ProductID>ChefIApp</ProductID>
        <ProductVersion>1.0</ProductVersion>
    </Header>
    <MasterFiles>
        <TaxTable>
            <TaxTableEntry>
                <TaxType>IVA</TaxType>
                <TaxCountryRegion>PT</TaxCountryRegion>
                <TaxCode>NOR</TaxCode>
                <Description>IVA Normal</Description>
                <TaxPercentage>23.00</TaxPercentage>
            </TaxTableEntry>
        </TaxTable>
    </MasterFiles>
    <SourceDocuments>
        <SalesInvoices>
            <Invoice>
                <InvoiceNo>${taxDoc.ref_event_id}</InvoiceNo>
                <DocumentStatus>
                    <InvoiceStatus>N</InvoiceStatus>
                </DocumentStatus>
                <Hash>${taxDoc.ref_seal_id}</Hash>
                <HashControl>1</HashControl>
                <Period>${new Date().getMonth() + 1}</Period>
                <InvoiceDate>${now}</InvoiceDate>
                <InvoiceType>FT</InvoiceType>
                <SourceID>TPV</SourceID>
                <SystemEntryDate>${now}</SystemEntryDate>
                <CustomerID>CLIENTE</CustomerID>
                <Line>
                    <LineNumber>1</LineNumber>
                    <ProductCode>${taxDoc.items[0]?.code || 'N/A'}</ProductCode>
                    <ProductDescription>${taxDoc.items[0]?.description || 'Item'}</ProductDescription>
                    <Quantity>${taxDoc.items[0]?.quantity || 1}</Quantity>
                    <UnitPrice>${taxDoc.items[0]?.unit_price || 0}</UnitPrice>
                    <CreditAmount>${taxDoc.total_amount.toFixed(2)}</CreditAmount>
                    <Tax>
                        <TaxType>IVA</TaxType>
                        <TaxCountryRegion>PT</TaxCountryRegion>
                        <TaxCode>NOR</TaxCode>
                        <TaxPercentage>23.00</TaxPercentage>
                    </Tax>
                </Line>
                <DocumentTotals>
                    <TaxPayable>${(taxDoc.taxes.vat || 0).toFixed(2)}</TaxPayable>
                    <NetTotal>${(taxDoc.total_amount - (taxDoc.taxes.vat || 0)).toFixed(2)}</NetTotal>
                    <GrossTotal>${taxDoc.total_amount.toFixed(2)}</GrossTotal>
                </DocumentTotals>
            </Invoice>
        </SalesInvoices>
    </SourceDocuments>
</AuditFile>`;
    }

    private async transmitToGovernment(xml: string, taxDoc: TaxDocument): Promise<string> {
        // MVP: Simulação de transmissão
        // Em produção, fazer POST para API do governo português
        
        Logger.info('[SAF-T] Simulating transmission to government', {
            orderId: taxDoc.raw_payload?.order_id,
        });

        // Simular latência de rede
        await new Promise(resolve => setTimeout(resolve, 100));

        // Retornar protocolo simulado
        const protocol = `SAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        Logger.info('[SAF-T] Transmission successful', { protocol });
        
        return protocol;
    }
}
