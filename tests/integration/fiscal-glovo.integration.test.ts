/**
 * Testes de Integração - Fiscal + Glovo
 * 
 * Valida que integrações fiscais e Glovo funcionam juntas
 */

import { FiscalService } from '../../../merchant-portal/src/core/fiscal/FiscalService';
import { InvoiceXpressAdapter } from '../../../fiscal-modules/adapters/InvoiceXpressAdapter';
import { GlovoAdapter } from '../../../merchant-portal/src/integrations/adapters/glovo/GlovoAdapter';
import type { CoreEvent } from '../../../event-log/types';
import type { LegalSeal } from '../../../legal-boundary/types';

// Mock Supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: { country_code: 'PT' },
                        error: null,
                    })),
                })),
            })),
            insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
    },
}));

// Mock fetch
global.fetch = jest.fn();

describe('Fiscal + Glovo Integration', () => {
    let fiscalService: FiscalService;
    let glovoAdapter: GlovoAdapter;

    beforeEach(() => {
        fiscalService = new FiscalService();
        glovoAdapter = new GlovoAdapter();
        jest.clearAllMocks();
    });

    describe('Fluxo Completo: Glovo Order → Payment → Fiscal', () => {
        it('deve processar pedido Glovo, pagamento e gerar fiscal', async () => {
            // 1. Receber pedido Glovo
            const glovoOrder = {
                id: 'glovo-order-123',
                status: 'PENDING',
                restaurant_id: 'rest-123',
                customer: { id: 'customer-123', name: 'João', phone: '+351' },
                delivery: { address: { address: 'Rua X', city: 'Lisboa' } },
                items: [
                    { id: 'item-1', name: 'Pizza', quantity: 1, price: 12.50, total: 12.50 },
                ],
                total: 12.50,
                currency: 'EUR',
                created_at: new Date().toISOString(),
            };

            await glovoAdapter.initialize({
                restaurantId: 'rest-123',
                clientId: 'client-id',
                clientSecret: 'client-secret',
                enabled: true,
            });

            const webhookResult = glovoAdapter.handleWebhook(glovoOrder);
            expect(webhookResult.success).toBe(true);

            // 2. Processar pagamento (simulado)
            const paymentEvent: CoreEvent = {
                event_id: 'event-123',
                stream_id: 'ORDER:glovo-order-123',
                stream_version: 0,
                type: 'PAYMENT_CONFIRMED',
                occurred_at: new Date(),
                payload: {
                    order_id: 'glovo-order-123',
                    amount_cents: 1250,
                },
            };

            const seal: LegalSeal = {
                seal_id: 'seal-123',
                event_id: 'event-123',
                sealed_at: new Date(),
            };

            // 3. Processar fiscal
            const invoiceAdapter = new InvoiceXpressAdapter({
                apiKey: 'test-key',
                accountName: 'test-account',
            });

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 12345,
                    pdf: { url: 'https://test.pdf' },
                }),
            });

            const fiscalResult = await invoiceAdapter.onSealed(seal, paymentEvent);

            expect(fiscalResult.status).toBe('REPORTED');
            expect(fiscalResult.pdf_url).toBeDefined();
        });
    });

    describe('Cenário: Múltiplos Pedidos Glovo + Fiscal', () => {
        it('deve processar múltiplos pedidos e gerar fiscais separados', async () => {
            const orders = [
                {
                    id: 'glovo-order-1',
                    status: 'PENDING',
                    restaurant_id: 'rest-123',
                    customer: { id: 'customer-1', name: 'João', phone: '+351' },
                    delivery: { address: { address: 'Rua X', city: 'Lisboa' } },
                    items: [{ id: 'item-1', name: 'Pizza', quantity: 1, price: 10.00, total: 10.00 }],
                    total: 10.00,
                    currency: 'EUR',
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'glovo-order-2',
                    status: 'PENDING',
                    restaurant_id: 'rest-123',
                    customer: { id: 'customer-2', name: 'Maria', phone: '+351' },
                    delivery: { address: { address: 'Rua Y', city: 'Lisboa' } },
                    items: [{ id: 'item-2', name: 'Hamburger', quantity: 1, price: 8.00, total: 8.00 }],
                    total: 8.00,
                    currency: 'EUR',
                    created_at: new Date().toISOString(),
                },
            ];

            await glovoAdapter.initialize({
                restaurantId: 'rest-123',
                clientId: 'client-id',
                clientSecret: 'client-secret',
                enabled: true,
            });

            // Processar pedidos
            for (const order of orders) {
                const result = glovoAdapter.handleWebhook(order);
                expect(result.success).toBe(true);
            }

            // Processar fiscais
            const invoiceAdapter = new InvoiceXpressAdapter({
                apiKey: 'test-key',
                accountName: 'test-account',
            });

            (fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 1, pdf: { url: 'https://test1.pdf' } }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 2, pdf: { url: 'https://test2.pdf' } }),
                });

            for (const order of orders) {
                const paymentEvent: CoreEvent = {
                    event_id: `event-${order.id}`,
                    stream_id: `ORDER:${order.id}`,
                    stream_version: 0,
                    type: 'PAYMENT_CONFIRMED',
                    occurred_at: new Date(),
                    payload: {
                        order_id: order.id,
                        amount_cents: Math.round(order.total * 100),
                    },
                };

                const seal: LegalSeal = {
                    seal_id: `seal-${order.id}`,
                    event_id: `event-${order.id}`,
                    sealed_at: new Date(),
                };

                const fiscalResult = await invoiceAdapter.onSealed(seal, paymentEvent);
                expect(fiscalResult.status).toBe('REPORTED');
            }

            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });
});
