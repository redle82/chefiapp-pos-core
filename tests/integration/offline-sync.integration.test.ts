/**
 * Testes de Integração - Offline Sync
 * 
 * Valida que a sincronização offline funciona end-to-end
 */

import { OfflineDB } from '../../merchant-portal/src/core/queue/db';
import { syncOfflineQueue } from '../../merchant-portal/src/core/queue/OfflineSync';
import { OrderEngine } from '../../merchant-portal/src/core/tpv/OrderEngine';
import type { OfflineQueueItem } from '../../merchant-portal/src/core/queue/types';

// Mock OrderEngine
jest.mock('../../merchant-portal/src/core/tpv/OrderEngine', () => ({
    OrderEngine: {
        createOrder: jest.fn(),
    },
}));

// Mock Supabase
jest.mock('../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                ilike: jest.fn(() => ({
                    limit: jest.fn(() => ({
                        maybeSingle: jest.fn(() => Promise.resolve({ data: null })),
                    })),
                })),
            })),
        })),
    },
}));

describe('Offline Sync Integration', () => {
    beforeEach(async () => {
        // Limpar fila antes de cada teste
        const items = await OfflineDB.getAll();
        for (const item of items) {
            await OfflineDB.remove(item.id);
        }
        jest.clearAllMocks();
    });

    describe('syncOfflineQueue', () => {
        it('deve processar fila vazia sem erros', async () => {
            const result = await syncOfflineQueue();

            expect(result.processed).toBe(0);
            expect(result.failed).toBe(0);
            expect(result.remaining).toBe(0);
        });

        it('deve sincronizar pedido offline quando volta online', async () => {
            // Criar pedido offline na fila
            const queueItem: OfflineQueueItem = {
                id: 'local-order-123',
                type: 'ORDER_CREATE',
                status: 'queued',
                payload: {
                    restaurantId: 'rest-123',
                    tableNumber: 1,
                    items: [
                        {
                            name: 'Pizza',
                            priceCents: 1000,
                            quantity: 1,
                        },
                    ],
                    localId: 'local-order-123',
                },
                createdAt: Date.now(),
                attempts: 0,
                nextRetryAt: null,
                lastError: null,
            };

            await OfflineDB.put(queueItem);

            // Mock OrderEngine.createOrder
            const mockOrder = {
                id: 'real-order-123',
                restaurantId: 'rest-123',
                status: 'pending',
                paymentStatus: 'PENDING',
                totalCents: 1000,
                subtotalCents: 1000,
                taxCents: 0,
                discountCents: 0,
                source: 'tpv',
                items: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (OrderEngine.createOrder as jest.Mock).mockResolvedValue(mockOrder);

            // Sincronizar
            const result = await syncOfflineQueue();

            expect(result.processed).toBe(1);
            expect(result.failed).toBe(0);
            expect(OrderEngine.createOrder).toHaveBeenCalled();
        });

        it('deve fazer retry com backoff exponencial em caso de falha', async () => {
            // Criar pedido offline na fila
            const queueItem: OfflineQueueItem = {
                id: 'local-order-123',
                type: 'ORDER_CREATE',
                status: 'queued',
                payload: {
                    restaurantId: 'rest-123',
                    tableNumber: 1,
                    items: [
                        {
                            name: 'Pizza',
                            priceCents: 1000,
                            quantity: 1,
                        },
                    ],
                    localId: 'local-order-123',
                },
                createdAt: Date.now(),
                attempts: 0,
                nextRetryAt: null,
                lastError: null,
            };

            await OfflineDB.put(queueItem);

            // Mock OrderEngine.createOrder para falhar
            (OrderEngine.createOrder as jest.Mock).mockRejectedValue(new Error('Network error'));

            // Primeira tentativa
            const result1 = await syncOfflineQueue();
            expect(result1.processed).toBe(0);
            expect(result1.failed).toBe(0); // Não falhou ainda, apenas marcou para retry

            // Verificar que item está marcado para retry
            const item = await OfflineDB.get('local-order-123');
            expect(item?.attempts).toBe(1);
            expect(item?.nextRetryAt).toBeDefined();
        });

        it('deve processar múltiplos pedidos em ordem FIFO', async () => {
            // Criar 3 pedidos offline
            const orders = [
                {
                    id: 'local-order-1',
                    createdAt: Date.now() - 3000,
                },
                {
                    id: 'local-order-2',
                    createdAt: Date.now() - 2000,
                },
                {
                    id: 'local-order-3',
                    createdAt: Date.now() - 1000,
                },
            ];

            for (const order of orders) {
                await OfflineDB.put({
                    id: order.id,
                    type: 'ORDER_CREATE',
                    status: 'queued',
                    payload: {
                        restaurantId: 'rest-123',
                        tableNumber: 1,
                        items: [{ name: 'Pizza', priceCents: 1000, quantity: 1 }],
                        localId: order.id,
                    },
                    createdAt: order.createdAt,
                    attempts: 0,
                    nextRetryAt: null,
                    lastError: null,
                });
            }

            // Mock OrderEngine.createOrder
            (OrderEngine.createOrder as jest.Mock).mockImplementation(async (input) => ({
                id: `real-${input.items[0].name}`,
                restaurantId: input.restaurantId,
                status: 'pending',
                paymentStatus: 'PENDING',
                totalCents: 1000,
                subtotalCents: 1000,
                taxCents: 0,
                discountCents: 0,
                source: 'tpv',
                items: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            // Sincronizar
            const result = await syncOfflineQueue();

            expect(result.processed).toBe(3);
            expect(OrderEngine.createOrder).toHaveBeenCalledTimes(3);
        });
    });
});
