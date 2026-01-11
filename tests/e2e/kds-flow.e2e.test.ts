/**
 * 🧪 KDS FLOW E2E TESTS
 * 
 * End-to-end tests for KDS (Kitchen Display System):
 * - Order appears in KDS
 * - Status updates reflect in real-time
 * - Multiple orders handled correctly
 * 
 * Roadmap: FASE 2 - Pagar Dívida Técnica
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { OrderEngine, OrderInput } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';
import { supabase } from '../../merchant-portal/src/core/supabase';

const TEST_TIMEOUT = 60000;
const TEST_RESTAURANT_ID = process.env.TEST_RESTAURANT_ID || 'test-restaurant-id';
const TEST_OPERATOR_ID = process.env.TEST_OPERATOR_ID || 'test-operator-id';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';

describe('E2E - KDS Flow', () => {
    let cashRegisterId: string;

    beforeAll(async () => {
        try {
            const cashRegister = await CashRegisterEngine.openCashRegister({
                restaurantId: TEST_RESTAURANT_ID,
                openedBy: TEST_OPERATOR_ID,
                openingBalanceCents: 0,
                name: 'KDS Test Register',
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

    it('deve listar pedidos ativos para KDS', async () => {
        // Criar pedidos em diferentes status
        const order1 = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID,
            tableNumber: 1,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId,
            items: [{ productId: TEST_PRODUCT_ID, name: 'Item 1', priceCents: 1000, quantity: 1 }],
        });

        const order2 = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID,
            tableNumber: 2,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId,
            items: [{ productId: TEST_PRODUCT_ID, name: 'Item 2', priceCents: 1500, quantity: 1 }],
        });

        // Atualizar status de um pedido
        await OrderEngine.updateOrderStatus(order1.id, 'preparing', TEST_RESTAURANT_ID);
        await OrderEngine.updateOrderStatus(order2.id, 'ready', TEST_RESTAURANT_ID);

        // Buscar pedidos ativos
        const activeOrders = await OrderEngine.getActiveOrders(TEST_RESTAURANT_ID);
        
        expect(activeOrders.length).toBeGreaterThanOrEqual(2);
        const foundOrder1 = activeOrders.find(o => o.id === order1.id);
        const foundOrder2 = activeOrders.find(o => o.id === order2.id);
        
        expect(foundOrder1).toBeDefined();
        expect(foundOrder1?.status).toBe('preparing');
        expect(foundOrder2).toBeDefined();
        expect(foundOrder2?.status).toBe('ready');
    }, TEST_TIMEOUT);

    it('deve atualizar status do pedido e refletir no KDS', async () => {
        const order = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID,
            tableNumber: 3,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId,
            items: [{ productId: TEST_PRODUCT_ID, name: 'KDS Test Item', priceCents: 2000, quantity: 1 }],
        });

        // Simular fluxo KDS: new -> preparing -> ready
        await OrderEngine.updateOrderStatus(order.id, 'preparing', TEST_RESTAURANT_ID);
        let updated = await OrderEngine.getOrderById(order.id);
        expect(updated.status).toBe('preparing');

        await OrderEngine.updateOrderStatus(order.id, 'ready', TEST_RESTAURANT_ID);
        updated = await OrderEngine.getOrderById(order.id);
        expect(updated.status).toBe('ready');
    }, TEST_TIMEOUT);
});
