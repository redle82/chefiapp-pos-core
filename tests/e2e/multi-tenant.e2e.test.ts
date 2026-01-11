/**
 * 🧪 MULTI-TENANT E2E TESTS
 * 
 * End-to-end tests for multi-tenant functionality:
 * - Switch between tenants
 * - Data isolation
 * - Tenant context
 * 
 * Roadmap: FASE 2 - Pagar Dívida Técnica
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { OrderEngine, OrderInput } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';
import { supabase } from '../../merchant-portal/src/core/supabase';

const TEST_TIMEOUT = 60000;
const TEST_RESTAURANT_ID_1 = process.env.TEST_RESTAURANT_ID_1 || 'test-restaurant-id-1';
const TEST_RESTAURANT_ID_2 = process.env.TEST_RESTAURANT_ID_2 || 'test-restaurant-id-2';
const TEST_OPERATOR_ID = process.env.TEST_OPERATOR_ID || 'test-operator-id';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';

describe('E2E - Multi-Tenant Isolation', () => {
    let cashRegisterId1: string;
    let cashRegisterId2: string;

    beforeAll(async () => {
        // Abrir caixas para ambos os restaurantes
        try {
            const cashRegister1 = await CashRegisterEngine.openCashRegister({
                restaurantId: TEST_RESTAURANT_ID_1,
                openedBy: TEST_OPERATOR_ID,
                openingBalanceCents: 0,
                name: 'Multi-Tenant Test Register 1',
            });
            cashRegisterId1 = cashRegister1.id;

            const cashRegister2 = await CashRegisterEngine.openCashRegister({
                restaurantId: TEST_RESTAURANT_ID_2,
                openedBy: TEST_OPERATOR_ID,
                openingBalanceCents: 0,
                name: 'Multi-Tenant Test Register 2',
            });
            cashRegisterId2 = cashRegister2.id;
        } catch (e) {
            // Se já existirem, buscar
            const existing1 = await CashRegisterEngine.getOpenCashRegister(TEST_RESTAURANT_ID_1);
            if (existing1) cashRegisterId1 = existing1.id;

            const existing2 = await CashRegisterEngine.getOpenCashRegister(TEST_RESTAURANT_ID_2);
            if (existing2) cashRegisterId2 = existing2.id;
        }
    }, TEST_TIMEOUT);

    afterAll(async () => {
        if (cashRegisterId1) {
            try {
                await CashRegisterEngine.closeCashRegister({
                    cashRegisterId: cashRegisterId1,
                    restaurantId: TEST_RESTAURANT_ID_1,
                    closedBy: TEST_OPERATOR_ID,
                    closingBalanceCents: 0,
                });
            } catch (e) {
                // Ignorar
            }
        }

        if (cashRegisterId2) {
            try {
                await CashRegisterEngine.closeCashRegister({
                    cashRegisterId: cashRegisterId2,
                    restaurantId: TEST_RESTAURANT_ID_2,
                    closedBy: TEST_OPERATOR_ID,
                    closingBalanceCents: 0,
                });
            } catch (e) {
                // Ignorar
            }
        }
    }, TEST_TIMEOUT);

    it('deve isolar pedidos entre restaurantes diferentes', async () => {
        // Criar pedido no restaurante 1
        const order1 = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID_1,
            tableNumber: 1,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId: cashRegisterId1,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Restaurant 1 Item',
                priceCents: 1000,
                quantity: 1,
            }],
        });

        // Criar pedido no restaurante 2
        const order2 = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID_2,
            tableNumber: 1,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId: cashRegisterId2,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Restaurant 2 Item',
                priceCents: 2000,
                quantity: 1,
            }],
        });

        // Verificar que os pedidos são diferentes
        expect(order1.id).not.toBe(order2.id);
        expect(order1.totalCents).toBe(1000);
        expect(order2.totalCents).toBe(2000);

        // Verificar isolamento: buscar pedidos do restaurante 1 não deve retornar pedidos do restaurante 2
        const activeOrders1 = await OrderEngine.getActiveOrders(TEST_RESTAURANT_ID_1);
        const activeOrders2 = await OrderEngine.getActiveOrders(TEST_RESTAURANT_ID_2);

        const foundOrder1 = activeOrders1.find(o => o.id === order1.id);
        const foundOrder2 = activeOrders2.find(o => o.id === order2.id);

        expect(foundOrder1).toBeDefined();
        expect(foundOrder2).toBeDefined();

        // Verificar que pedido do restaurante 2 não aparece na lista do restaurante 1
        const order2InRestaurant1 = activeOrders1.find(o => o.id === order2.id);
        expect(order2InRestaurant1).toBeUndefined();

        // Verificar que pedido do restaurante 1 não aparece na lista do restaurante 2
        const order1InRestaurant2 = activeOrders2.find(o => o.id === order1.id);
        expect(order1InRestaurant2).toBeUndefined();
    }, TEST_TIMEOUT);

    it('deve permitir criar pedidos com mesma mesa em restaurantes diferentes', async () => {
        // Mesa 5 no restaurante 1
        const order1 = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID_1,
            tableNumber: 5,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId: cashRegisterId1,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Item 1',
                priceCents: 1000,
                quantity: 1,
            }],
        });

        // Mesa 5 no restaurante 2 (deve funcionar, pois são restaurantes diferentes)
        const order2 = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID_2,
            tableNumber: 5,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId: cashRegisterId2,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Item 2',
                priceCents: 1500,
                quantity: 1,
            }],
        });

        expect(order1).toBeDefined();
        expect(order2).toBeDefined();
        expect(order1.tableNumber).toBe(5);
        expect(order2.tableNumber).toBe(5);
    }, TEST_TIMEOUT);
});
