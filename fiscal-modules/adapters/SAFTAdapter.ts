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
        const now = new Date();
        const nowISO = now.toISOString();
        const dateStr = now.toISOString().split('T')[0];
        const protocol = `SAFT-${Date.now()}`;

        // Gerar todas as linhas de itens
        const linesXML = taxDoc.items.map((item, index) => `
                <Line>
                    <LineNumber>${index + 1}</LineNumber>
                    <ProductCode>${this.escapeXML(item.code || 'N/A')}</ProductCode>
                    <ProductDescription>${this.escapeXML(item.description || 'Item')}</ProductDescription>
                    <Quantity>${item.quantity || 1}</Quantity>
                    <UnitPrice>${item.unit_price.toFixed(2)}</UnitPrice>
                    <CreditAmount>${item.total.toFixed(2)}</CreditAmount>
                    <Tax>
                        <TaxType>IVA</TaxType>
                        <TaxCountryRegion>PT</TaxCountryRegion>
                        <TaxCode>NOR</TaxCode>
                        <TaxPercentage>23.00</TaxPercentage>
                    </Tax>
                </Line>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">
    <Header>
        <AuditFileVersion>1.04_01</AuditFileVersion>
        <CompanyID>${this.escapeXML(taxDoc.raw_payload?.restaurant_id?.toString().substring(0, 20) || 'RESTAURANTE')}</CompanyID>
        <TaxRegistrationNumber>${this.escapeXML(taxDoc.raw_payload?.tax_registration_number || '999999999')}</TaxRegistrationNumber>
        <TaxAccountingBasis>N</TaxAccountingBasis>
        <CompanyName>${this.escapeXML(taxDoc.raw_payload?.restaurant_name || 'Restaurante')}</CompanyName>
        <CompanyAddress>
            <AddressDetail>${this.escapeXML(taxDoc.raw_payload?.address || 'N/A')}</AddressDetail>
            <City>${this.escapeXML(taxDoc.raw_payload?.city || 'N/A')}</City>
            <PostalCode>${this.escapeXML(taxDoc.raw_payload?.postal_code || '0000-000')}</PostalCode>
            <Country>PT</Country>
        </CompanyAddress>
        <FiscalYear>${now.getFullYear()}</FiscalYear>
        <StartDate>${dateStr}</StartDate>
        <EndDate>${dateStr}</EndDate>
        <CurrencyCode>EUR</CurrencyCode>
        <DateCreated>${nowISO}</DateCreated>
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
                <InvoiceNo>${this.escapeXML(taxDoc.ref_event_id?.substring(0, 60) || 'INV-' + Date.now())}</InvoiceNo>
                <DocumentStatus>
                    <InvoiceStatus>N</InvoiceStatus>
                </DocumentStatus>
                <Hash>${this.escapeXML(taxDoc.ref_seal_id?.substring(0, 172) || 'HASH')}</Hash>
                <HashControl>1</HashControl>
                <Period>${String(now.getMonth() + 1).padStart(2, '0')}</Period>
                <InvoiceDate>${dateStr}</InvoiceDate>
                <InvoiceType>FT</InvoiceType>
                <SourceID>TPV</SourceID>
                <SystemEntryDate>${nowISO}</SystemEntryDate>
                <CustomerID>CLIENTE</CustomerID>
                ${linesXML}
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

    private escapeXML(str: string): string {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
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
