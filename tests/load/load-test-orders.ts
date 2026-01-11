/**
 * 🧪 LOAD TEST — ORDERS
 * 
 * Testes de carga para validar sistema com 20 pedidos simultâneos.
 * 
 * Cenários:
 * 1. Criação Simultânea de Pedidos (20x)
 * 2. Adição Simultânea de Itens (20x)
 * 3. Atualização Simultânea de Status (20x)
 * 4. Pagamento Simultâneo (20x)
 * 5. Fluxo Completo (20 pedidos end-to-end)
 * 
 * Roadmap: Sprint 3, Dia 9 — Load Testing
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { OrderEngine } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { PaymentEngine } from '../../merchant-portal/src/core/tpv/PaymentEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';
import { supabase } from '../../merchant-portal/src/core/supabase';

// Configuração
const CONCURRENT_REQUESTS = 20;
const TEST_TIMEOUT = 60000; // 60s

// IDs de teste (devem ser configurados no ambiente de teste)
let RESTAURANT_ID: string;
let OPERATOR_ID: string;
let CASH_REGISTER_ID: string | null = null;
let TEST_PRODUCT_ID: string;

describe('Load Test - Orders', () => {
    beforeAll(async () => {
        // Setup: Obter IDs de teste do ambiente
        // Em um ambiente real, isso viria de variáveis de ambiente ou fixtures
        RESTAURANT_ID = process.env.TEST_RESTAURANT_ID || 'test-restaurant-id';
        OPERATOR_ID = process.env.TEST_OPERATOR_ID || 'test-operator-id';
        TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';

        // Abrir caixa para testes de pagamento
        try {
            const cashRegister = await CashRegisterEngine.openCashRegister({
                restaurantId: RESTAURANT_ID,
                openingBalanceCents: 0,
                openedBy: OPERATOR_ID,
            });
            CASH_REGISTER_ID = cashRegister.id;
        } catch (e) {
            // Caixa já pode estar aberto, tentar buscar
            const existing = await CashRegisterEngine.getOpenCashRegister(RESTAURANT_ID);
            if (existing) {
                CASH_REGISTER_ID = existing.id;
            }
        }
    }, TEST_TIMEOUT);

    afterAll(async () => {
        // Cleanup: Fechar caixa se necessário
        if (CASH_REGISTER_ID) {
            try {
                await CashRegisterEngine.closeCashRegister({
                    cashRegisterId: CASH_REGISTER_ID,
                    restaurantId: RESTAURANT_ID,
                    closingBalanceCents: 0,
                    closedBy: OPERATOR_ID,
                });
            } catch (e) {
                // Ignorar erros de cleanup
            }
        }
    }, TEST_TIMEOUT);

    describe('Cenário 1: Criação Simultânea de Pedidos', () => {
        it('deve criar 20 pedidos simultaneamente sem race conditions', async () => {
            const startTime = Date.now();

            // Criar 20 pedidos simultaneamente (mesas 1-20)
            const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
                OrderEngine.createOrder({
                    restaurantId: RESTAURANT_ID,
                    tableNumber: (i + 1).toString(),
                    operatorId: OPERATOR_ID,
                    items: [{
                        productId: TEST_PRODUCT_ID,
                        name: `Test Product ${i + 1}`,
                        priceCents: 1000 + (i * 100), // Preços diferentes para facilitar identificação
                        quantity: 1,
                    }],
                    source: 'tpv',
                })
            );

            const results = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;

            // Validações
            const successful = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            console.log(`[Load Test] Criação Simultânea: ${successful.length}/${CONCURRENT_REQUESTS} sucessos em ${duration}ms`);
            if (failed.length > 0) {
                console.error('[Load Test] Falhas:', failed.map(f => f.status === 'rejected' ? f.reason : null));
            }

            // Taxa de sucesso: 100%
            expect(successful.length).toBe(CONCURRENT_REQUESTS);
            expect(failed.length).toBe(0);

            // Verificar que todos os pedidos foram criados
            const orderIds = successful
                .map(r => r.status === 'fulfilled' ? r.value.id : null)
                .filter((id): id is string => id !== null);

            // Sem duplicados
            const uniqueIds = new Set(orderIds);
            expect(uniqueIds.size).toBe(orderIds.length);

            // Verificar no banco
            const activeOrders = await OrderEngine.getActiveOrders(RESTAURANT_ID);
            const createdOrderIds = new Set(orderIds);
            const foundOrders = activeOrders.filter(o => createdOrderIds.has(o.id));
            expect(foundOrders.length).toBeGreaterThanOrEqual(CONCURRENT_REQUESTS);

            // Tempo de resposta: < 10s
            expect(duration).toBeLessThan(10000);
        }, TEST_TIMEOUT);
    });

    describe('Cenário 2: Adição Simultânea de Itens', () => {
        it('deve adicionar 20 itens simultaneamente ao mesmo pedido', async () => {
            // Criar 1 pedido
            const order = await OrderEngine.createOrder({
                restaurantId: RESTAURANT_ID,
                tableNumber: '100',
                operatorId: OPERATOR_ID,
                items: [{
                    productId: TEST_PRODUCT_ID,
                    name: 'Initial Product',
                    priceCents: 500,
                    quantity: 1,
                }],
                source: 'tpv',
            });

            const startTime = Date.now();

            // Adicionar 20 itens simultaneamente
            const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
                OrderEngine.addItemToOrder(order.id, {
                    productId: `${TEST_PRODUCT_ID}-${i}`,
                    name: `Concurrent Product ${i + 1}`,
                    priceCents: 500 + (i * 50),
                    quantity: 1,
                }, RESTAURANT_ID)
            );

            const results = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;

            // Validações
            const successful = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            console.log(`[Load Test] Adição de Itens: ${successful.length}/${CONCURRENT_REQUESTS} sucessos em ${duration}ms`);

            // Taxa de sucesso: 100%
            expect(successful.length).toBe(CONCURRENT_REQUESTS);
            expect(failed.length).toBe(0);

            // Verificar pedido atualizado
            const updatedOrder = await OrderEngine.getOrderById(order.id);
            // Deve ter 1 item inicial + 20 itens adicionados = 21 itens
            expect(updatedOrder.items.length).toBeGreaterThanOrEqual(21);

            // Tempo de resposta: < 5s
            expect(duration).toBeLessThan(5000);
        }, TEST_TIMEOUT);
    });

    describe('Cenário 3: Atualização Simultânea de Status', () => {
        it('deve atualizar status de 20 pedidos simultaneamente', async () => {
            // Criar 20 pedidos
            const orders = await Promise.all(
                Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
                    OrderEngine.createOrder({
                        restaurantId: RESTAURANT_ID,
                        tableNumber: `200-${i + 1}`,
                        operatorId: OPERATOR_ID,
                        items: [{
                            productId: TEST_PRODUCT_ID,
                            name: `Product ${i + 1}`,
                            priceCents: 1000,
                            quantity: 1,
                        }],
                        source: 'tpv',
                    })
                )
            );

            const startTime = Date.now();

            // Atualizar status de todos simultaneamente (pending → preparing)
            const promises = orders.map(order =>
                OrderEngine.updateOrderStatus(order.id, 'preparing', RESTAURANT_ID)
            );

            const results = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;

            // Validações
            const successful = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            console.log(`[Load Test] Atualização de Status: ${successful.length}/${CONCURRENT_REQUESTS} sucessos em ${duration}ms`);

            // Taxa de sucesso: 100%
            expect(successful.length).toBe(CONCURRENT_REQUESTS);
            expect(failed.length).toBe(0);

            // Verificar que todos os status foram atualizados
            const updatedOrders = await Promise.all(
                orders.map(o => OrderEngine.getOrderById(o.id))
            );
            const allPreparing = updatedOrders.every(o => o.status === 'preparing');
            expect(allPreparing).toBe(true);

            // Tempo de resposta: < 5s
            expect(duration).toBeLessThan(5000);
        }, TEST_TIMEOUT);
    });

    describe('Cenário 4: Pagamento Simultâneo', () => {
        it('deve processar 20 pagamentos simultaneamente', async () => {
            if (!CASH_REGISTER_ID) {
                throw new Error('Cash register not open');
            }

            // Criar 20 pedidos prontos para pagamento
            const orders = await Promise.all(
                Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
                    OrderEngine.createOrder({
                        restaurantId: RESTAURANT_ID,
                        tableNumber: `300-${i + 1}`,
                        operatorId: OPERATOR_ID,
                        items: [{
                            productId: TEST_PRODUCT_ID,
                            name: `Product ${i + 1}`,
                            priceCents: 1000 + (i * 100),
                            quantity: 1,
                        }],
                        source: 'tpv',
                    })
                )
            );

            // Atualizar status para 'ready'
            await Promise.all(
                orders.map(order =>
                    OrderEngine.updateOrderStatus(order.id, 'ready', RESTAURANT_ID)
                )
            );

            const startTime = Date.now();

            // Processar 20 pagamentos simultaneamente
            const promises = orders.map(order =>
                PaymentEngine.processPayment({
                    orderId: order.id,
                    restaurantId: RESTAURANT_ID,
                    cashRegisterId: CASH_REGISTER_ID!,
                    amountCents: order.total,
                    method: 'CASH',
                    metadata: {
                        operatorId: OPERATOR_ID,
                    },
                })
            );

            const results = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;

            // Validações
            const successful = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            console.log(`[Load Test] Pagamento Simultâneo: ${successful.length}/${CONCURRENT_REQUESTS} sucessos em ${duration}ms`);

            // Taxa de sucesso: 100%
            expect(successful.length).toBe(CONCURRENT_REQUESTS);
            expect(failed.length).toBe(0);

            // Verificar que todos os pagamentos foram processados
            const paymentIds = successful
                .map(r => r.status === 'fulfilled' ? r.value.id : null)
                .filter((id): id is string => id !== null);

            // Sem duplicados
            const uniquePaymentIds = new Set(paymentIds);
            expect(uniquePaymentIds.size).toBe(paymentIds.length);

            // Tempo de resposta: < 15s
            expect(duration).toBeLessThan(15000);
        }, TEST_TIMEOUT);
    });

    describe('Cenário 5: Fluxo Completo End-to-End', () => {
        it('deve processar 20 pedidos completos simultaneamente', async () => {
            if (!CASH_REGISTER_ID) {
                throw new Error('Cash register not open');
            }

            const startTime = Date.now();

            // 20 threads executam fluxo completo
            const promises = Array.from({ length: CONCURRENT_REQUESTS }, async (_, i) => {
                // 1. Criar pedido
                const order = await OrderEngine.createOrder({
                    restaurantId: RESTAURANT_ID,
                    tableNumber: `400-${i + 1}`,
                    operatorId: OPERATOR_ID,
                    items: [{
                        productId: TEST_PRODUCT_ID,
                        name: `Product ${i + 1}`,
                        priceCents: 1000,
                        quantity: 1,
                    }],
                    source: 'tpv',
                });

                // 2. Adicionar 3 itens
                await OrderEngine.addItemToOrder(order.id, {
                    productId: `${TEST_PRODUCT_ID}-1`,
                    name: `Additional Product 1`,
                    priceCents: 500,
                    quantity: 1,
                }, RESTAURANT_ID);

                await OrderEngine.addItemToOrder(order.id, {
                    productId: `${TEST_PRODUCT_ID}-2`,
                    name: `Additional Product 2`,
                    priceCents: 750,
                    quantity: 1,
                }, RESTAURANT_ID);

                await OrderEngine.addItemToOrder(order.id, {
                    productId: `${TEST_PRODUCT_ID}-3`,
                    name: `Additional Product 3`,
                    priceCents: 600,
                    quantity: 1,
                }, RESTAURANT_ID);

                // 3. Atualizar status (preparing → ready)
                await OrderEngine.updateOrderStatus(order.id, 'preparing', RESTAURANT_ID);
                await OrderEngine.updateOrderStatus(order.id, 'ready', RESTAURANT_ID);

                // 4. Processar pagamento
                const payment = await PaymentEngine.processPayment({
                    orderId: order.id,
                    restaurantId: RESTAURANT_ID,
                    cashRegisterId: CASH_REGISTER_ID!,
                    amountCents: order.total,
                    method: 'CASH',
                    metadata: {
                        operatorId: OPERATOR_ID,
                    },
                });

                return { order, payment };
            });

            const results = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;

            // Validações
            const successful = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            console.log(`[Load Test] Fluxo Completo: ${successful.length}/${CONCURRENT_REQUESTS} sucessos em ${duration}ms`);

            if (failed.length > 0) {
                console.error('[Load Test] Falhas no fluxo completo:', failed.map(f => 
                    f.status === 'rejected' ? f.reason : null
                ));
            }

            // Taxa de sucesso: 100%
            expect(successful.length).toBe(CONCURRENT_REQUESTS);
            expect(failed.length).toBe(0);

            // Verificar integridade dos dados
            const orderIds = successful
                .map(r => r.status === 'fulfilled' ? r.value.order.id : null)
                .filter((id): id is string => id !== null);

            const uniqueOrderIds = new Set(orderIds);
            expect(uniqueOrderIds.size).toBe(orderIds.length);

            // Verificar que todos os pedidos foram pagos
            const orders = await Promise.all(
                orderIds.map(id => OrderEngine.getOrderById(id))
            );
            const allPaid = orders.every(o => o.paymentStatus === 'PAID');
            expect(allPaid).toBe(true);

            // Tempo total: < 30s
            expect(duration).toBeLessThan(30000);

            console.log(`[Load Test] ✅ Fluxo completo validado: ${successful.length} pedidos processados em ${duration}ms`);
        }, TEST_TIMEOUT * 2); // Timeout maior para fluxo completo
    });
});
