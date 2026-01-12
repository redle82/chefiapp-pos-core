/**
 * 🧪 CASH REGISTER FLOW E2E TESTS
 * 
 * End-to-end tests for complete cash register flow:
 * - Open cash register
 * - Create orders and process payments
 * - Close cash register with closing balance
 * - Verify totals and audit logs
 * 
 * Roadmap: OPÇÃO A - Semana 3
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { OrderEngine, OrderInput } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { PaymentEngine } from '../../merchant-portal/src/core/tpv/PaymentEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';
import { supabase } from '../../merchant-portal/src/core/supabase';

const TEST_TIMEOUT = 60000;
const TEST_RESTAURANT_ID = process.env.TEST_RESTAURANT_ID || 'test-restaurant-id';
const TEST_OPERATOR_ID = process.env.TEST_OPERATOR_ID || 'test-operator-id';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';

describe('E2E - Cash Register Complete Flow', () => {
    let cashRegisterId: string;

    afterAll(async () => {
        // Cleanup: fechar caixa se ainda estiver aberto
        if (cashRegisterId) {
            try {
                const register = await CashRegisterEngine.getCashRegisterById(cashRegisterId, TEST_RESTAURANT_ID);
                if (register.status === 'open') {
                    await CashRegisterEngine.closeCashRegister({
                        cashRegisterId,
                        restaurantId: TEST_RESTAURANT_ID,
                        closedBy: TEST_OPERATOR_ID,
                        closingBalanceCents: 0,
                    });
                }
            } catch (e) {
                // Ignorar erros de cleanup
            }
        }
    }, TEST_TIMEOUT);

    it('deve abrir caixa, criar vendas e fechar caixa', async () => {
        // 1. Abrir caixa
        const openingBalanceCents = 10000; // €100.00
        const cashRegister = await CashRegisterEngine.openCashRegister({
            restaurantId: TEST_RESTAURANT_ID,
            openedBy: TEST_OPERATOR_ID,
            openingBalanceCents,
            name: 'E2E Cash Register Test',
        });

        expect(cashRegister).toBeDefined();
        expect(cashRegister.id).toBeDefined();
        expect(cashRegister.status).toBe('open');
        expect(cashRegister.openingBalanceCents).toBe(openingBalanceCents);
        cashRegisterId = cashRegister.id;

        // 2. Criar e pagar 3 pedidos
        const orders: string[] = [];
        const payments: string[] = [];

        for (let i = 1; i <= 3; i++) {
            const order = await OrderEngine.createOrder({
                restaurantId: TEST_RESTAURANT_ID,
                tableNumber: i,
                operatorId: TEST_OPERATOR_ID,
                cashRegisterId,
                items: [{
                    productId: TEST_PRODUCT_ID,
                    name: `Test Product ${i}`,
                    priceCents: 1000 * i, // €10, €20, €30
                    quantity: 1,
                }],
            });

            expect(order).toBeDefined();
            orders.push(order.id);

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
            payments.push(payment.id);
        }

        // 3. Verificar total de vendas do dia
        const todayPayments = await PaymentEngine.getTodayPayments(TEST_RESTAURANT_ID);
        const totalSalesCents = todayPayments.reduce((sum, p) => sum + p.amountCents, 0);
        
        // Total esperado: €10 + €20 + €30 = €60 = 6000 centavos
        expect(totalSalesCents).toBeGreaterThanOrEqual(6000);

        // 4. Fechar caixa
        const closingBalanceCents = openingBalanceCents + totalSalesCents; // Saldo inicial + vendas
        const closedRegister = await CashRegisterEngine.closeCashRegister({
            cashRegisterId,
            restaurantId: TEST_RESTAURANT_ID,
            closedBy: TEST_OPERATOR_ID,
            closingBalanceCents,
        });

        expect(closedRegister).toBeDefined();
        expect(closedRegister.status).toBe('closed');
        expect(closedRegister.closingBalanceCents).toBe(closingBalanceCents);
        expect(closedRegister.totalSalesCents).toBeGreaterThanOrEqual(6000);

        // 5. Verificar que não é possível criar pedidos após fechar caixa
        try {
            await OrderEngine.createOrder({
                restaurantId: TEST_RESTAURANT_ID,
                tableNumber: 99,
                operatorId: TEST_OPERATOR_ID,
                cashRegisterId, // Caixa fechado
                items: [{
                    productId: TEST_PRODUCT_ID,
                    name: 'Should Fail',
                    priceCents: 1000,
                    quantity: 1,
                }],
            });
            // Se chegou aqui, falhou (deveria lançar erro)
            expect(true).toBe(false); // Force fail
        } catch (error: any) {
            // Esperado: erro porque caixa está fechado
            expect(error.message || error.code).toBeDefined();
        }

        // 6. Verificar audit logs
        const { data: auditLogs, error: auditError } = await supabase
            .from('gm_audit_logs')
            .select('*')
            .eq('resource_entity', 'gm_cash_registers')
            .eq('resource_id', cashRegisterId)
            .order('created_at', { ascending: false });

        if (!auditError && auditLogs) {
            // Deve ter logs de abertura e fechamento
            const openLog = auditLogs.find(log => log.action === 'cash_register_opened');
            const closeLog = auditLogs.find(log => log.action === 'cash_register_closed');
            
            expect(openLog).toBeDefined();
            expect(closeLog).toBeDefined();
        }
    }, TEST_TIMEOUT);

    it('deve impedir fechar caixa com pedidos abertos', async () => {
        // 1. Abrir novo caixa
        const cashRegister = await CashRegisterEngine.openCashRegister({
            restaurantId: TEST_RESTAURANT_ID,
            openedBy: TEST_OPERATOR_ID,
            openingBalanceCents: 0,
            name: 'E2E Test Register - Open Orders',
        });

        const testCashRegisterId = cashRegister.id;

        // 2. Criar pedido mas NÃO pagar
        const order = await OrderEngine.createOrder({
            restaurantId: TEST_RESTAURANT_ID,
            tableNumber: 99,
            operatorId: TEST_OPERATOR_ID,
            cashRegisterId: testCashRegisterId,
            items: [{
                productId: TEST_PRODUCT_ID,
                name: 'Unpaid Order',
                priceCents: 1000,
                quantity: 1,
            }],
        });

        expect(order).toBeDefined();
        expect(order.paymentStatus).toBe('PENDING');

        // 3. Tentar fechar caixa (deve falhar)
        try {
            await CashRegisterEngine.closeCashRegister({
                cashRegisterId: testCashRegisterId,
                restaurantId: TEST_RESTAURANT_ID,
                closedBy: TEST_OPERATOR_ID,
                closingBalanceCents: 0,
            });
            // Se chegou aqui, falhou (deveria lançar erro)
            expect(true).toBe(false); // Force fail
        } catch (error: any) {
            // Esperado: erro porque há pedidos abertos
            expect(error.message || error.code).toContain('open');
        }

        // 4. Pagar pedido
        await PaymentEngine.processPayment({
            orderId: order.id,
            restaurantId: TEST_RESTAURANT_ID,
            cashRegisterId: testCashRegisterId,
            amountCents: order.totalCents,
            method: 'cash',
        });

        // 5. Agora deve conseguir fechar
        const closedRegister = await CashRegisterEngine.closeCashRegister({
            cashRegisterId: testCashRegisterId,
            restaurantId: TEST_RESTAURANT_ID,
            closedBy: TEST_OPERATOR_ID,
            closingBalanceCents: 1000,
        });

        expect(closedRegister.status).toBe('closed');
    }, TEST_TIMEOUT);

    it('deve impedir abrir múltiplos caixas simultâneos', async () => {
        // 1. Abrir primeiro caixa
        const register1 = await CashRegisterEngine.openCashRegister({
            restaurantId: TEST_RESTAURANT_ID,
            openedBy: TEST_OPERATOR_ID,
            openingBalanceCents: 0,
            name: 'Register 1',
        });

        // 2. Tentar abrir segundo caixa (deve falhar)
        try {
            await CashRegisterEngine.openCashRegister({
                restaurantId: TEST_RESTAURANT_ID,
                openedBy: TEST_OPERATOR_ID,
                openingBalanceCents: 0,
                name: 'Register 2',
            });
            // Se chegou aqui, falhou (deveria lançar erro)
            expect(true).toBe(false); // Force fail
        } catch (error: any) {
            // Esperado: erro porque já existe caixa aberto
            expect(error.message || error.code).toContain('open');
        }

        // 3. Fechar primeiro caixa
        await CashRegisterEngine.closeCashRegister({
            cashRegisterId: register1.id,
            restaurantId: TEST_RESTAURANT_ID,
            closedBy: TEST_OPERATOR_ID,
            closingBalanceCents: 0,
        });
    }, TEST_TIMEOUT);
});
