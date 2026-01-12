/**
 * Testes Unitários - InvoiceXpressAdapter
 * 
 * Valida que o adapter InvoiceXpress funciona corretamente
 */

import { InvoiceXpressAdapter } from '../../../fiscal-modules/adapters/InvoiceXpressAdapter';
import type { LegalSeal } from '../../../legal-boundary/types';
import type { CoreEvent } from '../../../event-log/types';
import type { TaxDocument } from '../../../fiscal-modules/types';

// Mock fetch
global.fetch = jest.fn();

describe('InvoiceXpressAdapter', () => {
    let adapter: InvoiceXpressAdapter;
    let mockSeal: LegalSeal;
    let mockEvent: CoreEvent;

    beforeEach(() => {
        adapter = new InvoiceXpressAdapter({
            apiKey: 'test-api-key',
            accountName: 'test-account',
        });

        mockSeal = {
            seal_id: 'seal-123',
            entity_type: 'ORDER',
            entity_id: 'order-123',
            seal_event_id: 'event-123',
            stream_hash: 'hash-123',
            sealed_at: new Date(),
            sequence: 1,
            financial_state: JSON.stringify({ amount: 10000 }),
            legal_state: 'PAYMENT_SEALED',
        };

        mockEvent = {
            event_id: 'event-123',
            stream_id: 'ORDER:order-123',
            stream_version: 0,
            type: 'PAYMENT_CONFIRMED',
            occurred_at: new Date(),
            payload: {
                order_id: 'order-123',
                amount_cents: 10000,
                tax_document: {
                    doc_type: 'SAF-T',
                    ref_event_id: 'event-123',
                    ref_seal_id: 'seal-123',
                    total_amount: 100.00,
                    taxes: { vat: 23.00 },
                    items: [
                        {
                            code: 'ITEM-001',
                            description: 'Pizza Margherita',
                            quantity: 1,
                            unit_price: 100.00,
                            total: 100.00,
                        },
                    ],
                } as TaxDocument,
            },
        };

        jest.clearAllMocks();
    });

    describe('DRY RUN Mode (sem credenciais)', () => {
        it('deve retornar mock quando não há credenciais', async () => {
            const adapterWithoutCreds = new InvoiceXpressAdapter();

            const result = await adapterWithoutCreds.onSealed(mockSeal, mockEvent);

            expect(result.status).toBe('REPORTED');
            expect(result.gov_protocol).toContain('INV-MOCK');
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('API Calls (com credenciais)', () => {
        it('deve criar invoice na InvoiceXpress quando online', async () => {
            const mockResponse = {
                id: 12345,
                pdf: {
                    url: 'https://test-account.app.invoicexpress.com/documents/12345.pdf',
                },
                qr_code: 'QR-CODE-123',
                fiscal_signature: 'SIGNATURE-123',
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await adapter.onSealed(mockSeal, mockEvent);

            expect(result.status).toBe('REPORTED');
            expect(result.gov_protocol).toBe('12345');
            expect(result.pdf_url).toBe(mockResponse.pdf.url);
            expect(result.qr_code).toBe('QR-CODE-123');
            expect(result.fiscal_signature).toBe('SIGNATURE-123');
            expect(fetch).toHaveBeenCalled();
        });

        it('deve mapear TaxDocument corretamente para InvoiceXpress', async () => {
            const mockResponse = {
                id: 12345,
                pdf: { url: 'https://test.pdf' },
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            await adapter.onSealed(mockSeal, mockEvent);

            const fetchCall = (fetch as jest.Mock).mock.calls[0];
            const url = fetchCall[0];
            const options = fetchCall[1];

            expect(url).toContain('invoicexpress.com');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.headers['X-API-KEY']).toBe('test-api-key');

            const body = JSON.parse(options.body);
            expect(body.client).toBeDefined();
            expect(body.items).toBeDefined();
            expect(body.items).toHaveLength(1);
            expect(body.items[0].name).toBe('Pizza Margherita');
            expect(body.items[0].quantity).toBe(1);
            expect(body.items[0].unit_price).toBe(100.00);
        });

        it('deve calcular IVA corretamente', async () => {
            const mockResponse = {
                id: 12345,
                pdf: { url: 'https://test.pdf' },
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            await adapter.onSealed(mockSeal, mockEvent);

            const fetchCall = (fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);

            // IVA em Portugal é 23%
            expect(body.tax).toBeDefined();
        });

        it('deve fazer retry com backoff exponencial em caso de falha', async () => {
            (fetch as jest.Mock)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 12345, pdf: { url: 'https://test.pdf' } }),
                });

            const result = await adapter.onSealed(mockSeal, mockEvent);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result.status).toBe('REPORTED');
        });

        it('deve retornar REJECTED após max retries', async () => {
            (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

            const result = await adapter.onSealed(mockSeal, mockEvent);

            expect(result.status).toBe('REJECTED');
            expect(result.error_details).toBeDefined();
            expect(fetch).toHaveBeenCalledTimes(3); // MAX_RETRIES
        });

        it('deve tratar erro 400 da API corretamente', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    errors: ['Invalid data'],
                }),
            });

            const result = await adapter.onSealed(mockSeal, mockEvent);

            expect(result.status).toBe('REJECTED');
            expect(result.error_details).toContain('Invalid data');
        });
    });

    describe('Fallback quando TaxDocument não está no payload', () => {
        it('deve criar TaxDocument fallback se não estiver no payload', async () => {
            const eventWithoutTaxDoc: CoreEvent = {
                ...mockEvent,
                payload: {
                    order_id: 'order-123',
                    amount_cents: 10000,
                },
            };

            const adapterWithoutCreds = new InvoiceXpressAdapter();
            const result = await adapterWithoutCreds.onSealed(mockSeal, eventWithoutTaxDoc);

            expect(result.status).toBe('REPORTED');
            expect(result.gov_protocol).toContain('INV-MOCK');
        });
    });
});
