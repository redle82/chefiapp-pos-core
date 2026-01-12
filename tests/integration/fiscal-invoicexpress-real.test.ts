/**
 * FISCAL INVOICEXPRESS REAL TEST
 * 
 * Teste de integração real com InvoiceXpress (sandbox)
 * REQUER: Credenciais sandbox configuradas
 * 
 * Para executar:
 * 1. Configurar variáveis de ambiente:
 *    - INVOICEXPRESS_ACCOUNT_NAME=minha-empresa
 *    - INVOICEXPRESS_API_KEY=abc123def456...
 * 2. Executar: npm test tests/integration/fiscal-invoicexpress-real.test.ts
 * 
 * Data: 18 Janeiro 2026
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { InvoiceXpressAdapter } from '../../fiscal-modules/adapters/InvoiceXpressAdapter';
import { FiscalService } from '../../merchant-portal/src/core/fiscal/FiscalService';
import { supabase } from '../../merchant-portal/src/core/supabase';
import type { TaxDocument } from '../../fiscal-modules/types';
import type { LegalSeal } from '../../legal-boundary/types';
import type { CoreEvent } from '../../event-log/types';

// Credenciais do ambiente (sandbox)
const INVOICEXPRESS_ACCOUNT_NAME = process.env.INVOICEXPRESS_ACCOUNT_NAME;
const INVOICEXPRESS_API_KEY = process.env.INVOICEXPRESS_API_KEY;
const TEST_RESTAURANT_ID = process.env.TEST_RESTAURANT_ID || 'test-restaurant-id';

// Skip se credenciais não configuradas
const SKIP_REAL_TESTS = !INVOICEXPRESS_ACCOUNT_NAME || !INVOICEXPRESS_API_KEY;

describe('🧾 FISCAL INVOICEXPRESS REAL TEST', () => {
    beforeAll(() => {
        if (SKIP_REAL_TESTS) {
            console.warn(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  TESTES REAIS PULADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Credenciais InvoiceXpress não configuradas.

Para executar testes reais:
1. Obter credenciais sandbox InvoiceXpress
2. Configurar variáveis de ambiente:
   export INVOICEXPRESS_ACCOUNT_NAME=minha-empresa
   export INVOICEXPRESS_API_KEY=abc123def456...
   export TEST_RESTAURANT_ID=seu-restaurant-id
3. Executar: npm test tests/integration/fiscal-invoicexpress-real.test.ts

Ver: FISCAL_VALIDACAO_REAL.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `);
        }
    });

    describe('1. Teste de Conexão', () => {
        it('1.1 - Deve conectar com InvoiceXpress sandbox', async () => {
            if (SKIP_REAL_TESTS) {
                return; // Skip test
            }

            // Mock localStorage
            (global as any).localStorage = { getItem: () => 'test-token' };
            (global as any).window = { localStorage: (global as any).localStorage };

            // Testar conexão via backend proxy
            const apiBase = process.env.VITE_API_BASE || 'http://localhost:4320';
            const response = await fetch(`${apiBase}/api/fiscal/invoicexpress/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-chefiapp-token': 'test-token',
                },
                body: JSON.stringify({
                    restaurantId: TEST_RESTAURANT_ID,
                    accountName: INVOICEXPRESS_ACCOUNT_NAME,
                    apiKey: INVOICEXPRESS_API_KEY,
                }),
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.status).toBe('OK');
        });
    });

    describe('2. Criação de Invoice Real', () => {
        it('2.1 - Deve criar invoice real no InvoiceXpress', async () => {
            if (SKIP_REAL_TESTS) {
                return; // Skip test
            }

            const adapter = new InvoiceXpressAdapter({
                accountName: INVOICEXPRESS_ACCOUNT_NAME!,
            });

            (global as any).localStorage = { getItem: () => 'test-token' };
            (global as any).window = { localStorage: (global as any).localStorage };

            const mockTaxDoc: TaxDocument = {
                doc_type: 'MOCK',
                ref_event_id: 'EVENT-REAL-TEST',
                ref_seal_id: 'SEAL-REAL-TEST',
                total_amount: 25.50,
                taxes: {
                    vat: 5.87, // 23% IVA
                },
                items: [
                    {
                        code: 'PROD-001',
                        description: 'Bacalhau à Brás (TESTE)',
                        quantity: 2,
                        unit_price: 12.75,
                        total: 25.50,
                    },
                ],
                raw_payload: {
                    order_id: 'ORDER-REAL-TEST',
                    restaurant_id: TEST_RESTAURANT_ID,
                },
            };

            const mockSeal: LegalSeal = {
                seal_id: 'SEAL-REAL-TEST',
                entity_type: 'ORDER',
                entity_id: 'ORDER-REAL-TEST',
                seal_event_id: 'EVENT-REAL-TEST',
                stream_hash: 'HASH-REAL-TEST',
                sealed_at: new Date(),
                sequence: 1,
                legal_state: 'PAYMENT_SEALED',
                financial_state: JSON.stringify({ amount: 2550 }),
            };

            const mockEvent: CoreEvent = {
                event_id: 'EVENT-REAL-TEST',
                stream_id: 'ORDER:ORDER-REAL-TEST',
                stream_version: 0,
                type: 'PAYMENT_CONFIRMED',
                payload: {
                    order_id: 'ORDER-REAL-TEST',
                    tax_document: mockTaxDoc,
                },
                occurred_at: new Date(),
                idempotency_key: 'fiscal:ORDER-REAL-TEST',
            };

            const result = await adapter.onSealed(mockSeal, mockEvent);

            // Verificar resultado
            expect(result.status).toBe('REPORTED');
            expect(result.gov_protocol).toBeDefined();
            expect(result.gov_protocol).not.toBe('');

            // Verificar que PDF URL está disponível (se InvoiceXpress retornar)
            if (result.pdf_url) {
                expect(result.pdf_url).toContain('invoicexpress.com');
            }

            console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ INVOICE CRIADO COM SUCESSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Protocolo: ${result.gov_protocol}
PDF URL: ${result.pdf_url || 'N/A'}
Status: ${result.status}

Verificar em: https://${INVOICEXPRESS_ACCOUNT_NAME}.app.invoicexpress.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `);
        });
    });

    describe('3. Validação de PDF', () => {
        it('3.1 - Deve validar que PDF é acessível', async () => {
            if (SKIP_REAL_TESTS) {
                return; // Skip test
            }

            // Buscar último invoice criado
            const { data: lastFiscal } = await supabase
                .from('fiscal_event_store')
                .select('*')
                .eq('restaurant_id', TEST_RESTAURANT_ID)
                .eq('fiscal_status', 'REPORTED')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!lastFiscal) {
                console.warn('Nenhum invoice encontrado para validar PDF');
                return;
            }

            const pdfUrl = lastFiscal.response_received?.pdf_url || 
                          lastFiscal.response_received?.invoice?.pdf?.url;

            if (!pdfUrl) {
                console.warn('PDF URL não disponível');
                return;
            }

            // Validar que PDF é acessível
            const response = await fetch(pdfUrl);
            expect(response.ok).toBe(true);
            expect(response.headers.get('content-type')).toContain('pdf');

            console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PDF VALIDADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PDF URL: ${pdfUrl}
Status: ${response.status}
Content-Type: ${response.headers.get('content-type')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `);
        });
    });

    describe('4. Validação de Armazenamento', () => {
        it('4.1 - Deve validar que invoice foi armazenado', async () => {
            if (SKIP_REAL_TESTS) {
                return; // Skip test
            }

            // Buscar invoice criado
            const { data: fiscal } = await supabase
                .from('fiscal_event_store')
                .select('*')
                .eq('order_id', 'ORDER-REAL-TEST')
                .single();

            expect(fiscal).toBeDefined();
            expect(fiscal?.fiscal_status).toBe('REPORTED');
            expect(fiscal?.gov_protocol).toBeDefined();
            expect(fiscal?.payload_sent).toBeDefined();
            expect(fiscal?.response_received).toBeDefined();
        });
    });
});
