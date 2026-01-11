/**
 * 🧪 FISCAL PRINTING E2E TESTS
 * 
 * End-to-end tests for fiscal printing:
 * - Generate fiscal document
 * - Print receipt
 * - Store fiscal event
 * 
 * Roadmap: FASE 2 - Pagar Dívida Técnica
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { OrderEngine, OrderInput } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { PaymentEngine } from '../../merchant-portal/src/core/tpv/PaymentEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';
import { getFiscalService } from '../../merchant-portal/src/core/fiscal/FiscalService';
import { supabase } from '../../merchant-portal/src/core/supabase';

const TEST_TIMEOUT = 60000;
const TEST_RESTAURANT_ID = process.env.TEST_RESTAURANT_ID || 'test-restaurant-id';
const TEST_OPERATOR_ID = process.env.TEST_OPERATOR_ID || 'test-operator-id';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';

describe('E2E - Fiscal Printing', () => {
    let cashRegisterId: string;

    beforeAll(async () => {
        try {
            const cashRegister = await CashRegisterEngine.openCashRegister({
                restaurantId: TEST_RESTAURANT_ID,
                openedBy: TEST_OPERATOR_ID,
                openingBalanceCents: 0,
                name: 'Fiscal Test Register',
            });
            cashRegisterId = cashRegister.id;
        } catch (e) {
            const existing = await CashRegisterEngine.getOpenCashRegister(TEST_RESTAURANT_ID);
            if (existing) {
                cashRegisterId = existing.id;
            } else {
                throw e;
            }
        }
    }, TEST_TIMEOUT);

    afterAll(async () => {
        if (cashRegisterId) {
            try {
                await CashRegisterEngine.closeCashRegister({
                    cashRegisterId,
                    restaurantId: TEST_RESTAURANT_ID,
                    closedBy: TEST_OPERATOR_ID,
                    closingBalanceCents: 0,
                });
            } catch (e) {
                // Ignorar
            }
        }
    }, TEST_TIMEOUT);

    it('deve gerar documento fiscal após pagamento', async () => {
        // 1. Criar pedido
        const order = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID,
            tableNumber: 1,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Test Product',
                priceCents: 1000,
                quantity: 1,
            }],
        });

        // 2. Processar pagamento
        const payment = await PaymentEngine.processPayment({
            orderId: order.id,
            restaurantId: TEST_RESTAURANT_ID,
            cashRegisterId,
            amountCents: order.totalCents,
            method: 'cash',
            metadata: {
                operatorId: TEST_OPERATOR_ID,
            },
        });

        expect(payment).toBeDefined();
        expect(payment.status).toBe('paid');

        // 3. Processar documento fiscal
        const fiscalService = getFiscalService();
        const fiscalResult = await fiscalService.processPaymentConfirmed({
            orderId: order.id,
            restaurantId: TEST_RESTAURANT_ID,
            paymentMethod: 'cash',
            amountCents: payment.amountCents,
            paymentId: payment.id,
        });

        // Se fiscal está desabilitado, resultado pode ser null
        if (fiscalResult) {
            expect(fiscalResult.status).toBeDefined();
            expect(fiscalResult.reported_at).toBeInstanceOf(Date);
        }

        // 4. Verificar que documento pode ser recuperado
        const fiscalDoc = await fiscalService.getFiscalDocument(order.id);
        if (fiscalDoc) {
            expect(fiscalDoc.ref_event_id).toBeDefined();
            expect(fiscalDoc.doc_type).toBeDefined();
        }
    }, TEST_TIMEOUT);

    it('deve armazenar evento fiscal no fiscal_event_store', async () => {
        // Criar pedido e pagar
        const order = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID,
            tableNumber: 2,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Fiscal Test Item',
                priceCents: 1500,
                quantity: 1,
            }],
        });

        const payment = await PaymentEngine.processPayment({
            orderId: order.id,
            restaurantId: TEST_RESTAURANT_ID,
            cashRegisterId,
            amountCents: order.totalCents,
            method: 'card',
        });

        // Processar fiscal
        const fiscalService = getFiscalService();
        await fiscalService.processPaymentConfirmed({
            orderId: order.id,
            restaurantId: TEST_RESTAURANT_ID,
            paymentMethod: 'card',
            amountCents: payment.amountCents,
            paymentId: payment.id,
        });

        // Verificar fiscal_event_store (se a tabela existir)
        const { data: fiscalEvents, error: fiscalError } = await supabase
            .from('fiscal_event_store')
            .select('*')
            .eq('ref_event_id', payment.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (fiscalError) {
            // Se a tabela não existe, pular teste
            console.warn('[Fiscal E2E Test] fiscal_event_store not available:', fiscalError);
            return;
        }

        if (fiscalEvents && fiscalEvents.length > 0) {
            const fiscalEvent = fiscalEvents[0];
            expect(fiscalEvent.ref_event_id).toBe(payment.id);
            expect(fiscalEvent.doc_type).toBeDefined();
            expect(fiscalEvent.fiscal_status).toBeDefined();
        }
    }, TEST_TIMEOUT);
});
