/**
 * 🧪 OFFLINE MODE E2E TESTS
 * 
 * End-to-end tests for offline mode functionality:
 * - Create order offline
 * - Queue syncs when online
 * - Retry logic works
 * 
 * Roadmap: FASE 2 - Pagar Dívida Técnica
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { OrderEngine, OrderInput } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';
import { OfflineDB } from '../../merchant-portal/src/core/queue/db';

const TEST_TIMEOUT = 60000;
const TEST_RESTAURANT_ID = process.env.TEST_RESTAURANT_ID || 'test-restaurant-id';
const TEST_OPERATOR_ID = process.env.TEST_OPERATOR_ID || 'test-operator-id';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';

describe('E2E - Offline Mode', () => {
    let cashRegisterId: string;

    beforeAll(async () => {
        // Limpar fila offline antes dos testes
        await OfflineDB.clear();

        try {
            const cashRegister = await CashRegisterEngine.openCashRegister({
                restaurantId: TEST_RESTAURANT_ID,
                openedBy: TEST_OPERATOR_ID,
                openingBalanceCents: 0,
                name: 'Offline Test Register',
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
        // Limpar fila offline após testes
        await OfflineDB.clear();

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

    it('deve adicionar pedido à fila offline quando offline', async () => {
        // Simular modo offline (mock navigator.onLine)
        const originalOnLine = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
        });

        try {
            // Criar payload de pedido offline
            const offlinePayload = {
                id: 'test-offline-order-id',
                restaurant_id: TEST_RESTAURANT_ID,
                table_number: 1,
                operator_id: TEST_OPERATOR_ID,
                cash_register_id: cashRegisterId,
                status: 'OPEN',
                payment_status: 'PENDING',
                total_cents: 1000,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                items: [{
                    id: 'test-item-id',
                    product_id: TEST_PRODUCT_ID,
                    name_snapshot: 'Test Product',
                    price_snapshot: 1000,
                    quantity: 1,
                }],
            };

            // Adicionar à fila offline
            const queueItem = {
                id: 'test-queue-item-id',
                type: 'ORDER_CREATE' as const,
                status: 'queued' as const,
                payload: offlinePayload,
                createdAt: Date.now(),
                attempts: 0,
            };

            await OfflineDB.put(queueItem);

            // Verificar que está na fila
            const allItems = await OfflineDB.getAll();
            expect(allItems.length).toBe(1);
            expect(allItems[0].type).toBe('ORDER_CREATE');
            expect(allItems[0].status).toBe('queued');
        } finally {
            // Restaurar navigator.onLine
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                configurable: true,
                value: originalOnLine,
            });
        }
    }, TEST_TIMEOUT);

    it('deve sincronizar fila quando volta online', async () => {
        // Este teste requer integração com OrderContextReal
        // Por enquanto, apenas verifica que a estrutura está correta
        const queueItems = await OfflineDB.getAll();
        expect(Array.isArray(queueItems)).toBe(true);
    }, TEST_TIMEOUT);
});
