/**
 * 🧪 TPV FLOW E2E TESTS
 * 
 * End-to-end tests for complete TPV flow:
 * - Create order
 * - Add items
 * - Process payment
 * - Verify order status
 * 
 * Roadmap: FASE 2 - Pagar Dívida Técnica
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { OrderEngine, OrderInput } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { PaymentEngine } from '../../merchant-portal/src/core/tpv/PaymentEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';
import { supabase } from '../../merchant-portal/src/core/supabase';

// Configuração
const TEST_TIMEOUT = 60000;
const TEST_RESTAURANT_ID = process.env.TEST_RESTAURANT_ID || 'test-restaurant-id';
const TEST_OPERATOR_ID = process.env.TEST_OPERATOR_ID || 'test-operator-id';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';

describe('E2E - TPV Complete Flow', () => {
    let cashRegisterId: string;

    beforeAll(async () => {
        // Abrir caixa
        try {
            const cashRegister = await CashRegisterEngine.openCashRegister({
                restaurantId: TEST_RESTAURANT_ID,
                openedBy: TEST_OPERATOR_ID,
                openingBalanceCents: 0,
                name: 'E2E Test Register',
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
        // Cleanup
        if (cashRegisterId) {
            try {
                await CashRegisterEngine.closeCashRegister({
                    cashRegisterId,
                    restaurantId: TEST_RESTAURANT_ID,
                    closedBy: TEST_OPERATOR_ID,
                    closingBalanceCents: 0,
                });
            } catch (e) {
                // Ignorar erros de cleanup
            }
        }
    }, TEST_TIMEOUT);

    it('deve criar pedido, adicionar itens e processar pagamento', async () => {
        // 1. Criar pedido
        const orderInput: OrderInput = {
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
        };

        const order = await OrderEngine.createOrder(orderInput);
        expect(order).toBeDefined();
        expect(order.id).toBeDefined();
        expect(order.totalCents).toBe(1000);

        // 2. Adicionar item ao pedido
        const updatedOrder = await OrderEngine.addItemToOrder(order.id, {
            productId: TEST_PRODUCT_ID,
            name: 'Test Product 2',
            priceCents: 500,
            quantity: 2,
        }, TEST_RESTAURANT_ID);

        expect(updatedOrder.items.length).toBe(2);
        expect(updatedOrder.totalCents).toBe(2000); // 1000 + (500 * 2)

        // 3. Processar pagamento
        const payment = await PaymentEngine.processPayment({
            orderId: updatedOrder.id,
            restaurantId: TEST_RESTAURANT_ID,
            cashRegisterId,
            amountCents: updatedOrder.totalCents,
            method: 'cash',
            metadata: {
                operatorId: TEST_OPERATOR_ID,
            },
        });

        expect(payment).toBeDefined();
        expect(payment.status).toBe('paid');
        expect(payment.amountCents).toBe(2000);

        // 4. Verificar status do pedido
        const finalOrder = await OrderEngine.getOrderById(updatedOrder.id);
        expect(finalOrder.paymentStatus).toBe('PAID');
    }, TEST_TIMEOUT);

    it('deve atualizar status do pedido corretamente', async () => {
        // Criar pedido
        const order = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID,
            tableNumber: 2,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Test Product',
                priceCents: 1000,
                quantity: 1,
            }],
        });

        // Atualizar status para 'preparing'
        await OrderEngine.updateOrderStatus(order.id, 'preparing', TEST_RESTAURANT_ID);
        const updated = await OrderEngine.getOrderById(order.id);
        expect(updated.status).toBe('preparing');

        // Atualizar status para 'ready'
        await OrderEngine.updateOrderStatus(order.id, 'ready', TEST_RESTAURANT_ID);
        const ready = await OrderEngine.getOrderById(order.id);
        expect(ready.status).toBe('ready');
    }, TEST_TIMEOUT);
});
