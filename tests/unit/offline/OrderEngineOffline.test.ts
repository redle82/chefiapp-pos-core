/**
 * Testes Unitários - OrderEngineOffline
 * 
 * Valida que o wrapper offline-aware funciona corretamente
 */

import { createOrderOffline, checkOrderSynced } from '../../../merchant-portal/src/core/tpv/OrderEngineOffline';
import { OrderEngine } from '../../../merchant-portal/src/core/tpv/OrderEngine';
import { OfflineDB } from '../../../merchant-portal/src/core/queue/db';
import type { OrderInput, Order } from '../../../merchant-portal/src/core/tpv/OrderEngine';

// Mock OrderEngine
jest.mock('../../../merchant-portal/src/core/tpv/OrderEngine', () => ({
    OrderEngine: {
        createOrder: jest.fn(),
    },
}));

// Mock OfflineDB
jest.mock('../../../merchant-portal/src/core/queue/db', () => ({
    OfflineDB: {
        put: jest.fn(),
        getAll: jest.fn(),
        get: jest.fn(),
    },
}));

// Mock navigator.onLine
const mockNavigatorOnline = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value,
    });
};

// Mock Logger
jest.mock('../../../merchant-portal/src/core/logger/Logger', () => ({
    Logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock Supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                limit: jest.fn(() => ({
                    abortSignal: jest.fn(() => Promise.resolve({ error: null })),
                })),
            })),
        })),
    },
}));

describe('OrderEngineOffline', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigatorOnline(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createOrderOffline - Online Mode', () => {
        it('deve chamar OrderEngine.createOrder quando online', async () => {
            mockNavigatorOnline(true);
            
            const mockOrder: Order = {
                id: 'order-123',
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

            const input: OrderInput = {
                restaurantId: 'rest-123',
                tableNumber: 1,
                items: [
                    {
                        name: 'Pizza',
                        priceCents: 1000,
                        quantity: 1,
                    },
                ],
            };

            const result = await createOrderOffline(input);

            expect(OrderEngine.createOrder).toHaveBeenCalledWith(input);
            expect(result).toEqual(mockOrder);
            expect(OfflineDB.put).not.toHaveBeenCalled();
        });

        it('deve fazer fallback para offline queue se OrderEngine falhar com erro de rede', async () => {
            mockNavigatorOnline(true);
            
            const networkError = new Error('fetch failed');
            (OrderEngine.createOrder as jest.Mock).mockRejectedValue(networkError);

            const input: OrderInput = {
                restaurantId: 'rest-123',
                tableNumber: 1,
                items: [
                    {
                        name: 'Pizza',
                        priceCents: 1000,
                        quantity: 1,
                    },
                ],
            };

            (OfflineDB.put as jest.Mock).mockResolvedValue(undefined);

            const result = await createOrderOffline(input);

            expect(OrderEngine.createOrder).toHaveBeenCalled();
            expect(OfflineDB.put).toHaveBeenCalled();
            expect(result.id).toBeDefined();
            expect(result.status).toBe('pending');
        });
    });

    describe('createOrderOffline - Offline Mode', () => {
        it('deve adicionar à fila IndexedDB quando offline', async () => {
            mockNavigatorOnline(false);
            
            const input: OrderInput = {
                restaurantId: 'rest-123',
                tableNumber: 1,
                items: [
                    {
                        name: 'Pizza',
                        priceCents: 1000,
                        quantity: 1,
                    },
                ],
            };

            (OfflineDB.put as jest.Mock).mockResolvedValue(undefined);

            const result = await createOrderOffline(input);

            expect(OrderEngine.createOrder).not.toHaveBeenCalled();
            expect(OfflineDB.put).toHaveBeenCalled();
            expect(result.id).toBeDefined();
            expect(result.status).toBe('pending');
            expect(result.totalCents).toBe(1000);
        });

        it('deve calcular total corretamente para múltiplos itens', async () => {
            mockNavigatorOnline(false);
            
            const input: OrderInput = {
                restaurantId: 'rest-123',
                tableNumber: 1,
                items: [
                    {
                        name: 'Pizza',
                        priceCents: 1000,
                        quantity: 2,
                    },
                    {
                        name: 'Coca',
                        priceCents: 200,
                        quantity: 1,
                    },
                ],
            };

            (OfflineDB.put as jest.Mock).mockResolvedValue(undefined);

            const result = await createOrderOffline(input);

            expect(result.totalCents).toBe(2200); // (1000 * 2) + (200 * 1)
            expect(result.items).toHaveLength(2);
        });

        it('deve retornar pedido otimista com estrutura correta', async () => {
            mockNavigatorOnline(false);
            
            const input: OrderInput = {
                restaurantId: 'rest-123',
                tableNumber: 5,
                tableId: 'table-123',
                operatorId: 'op-123',
                cashRegisterId: 'cash-123',
                source: 'tpv',
                notes: 'Sem cebola',
                items: [
                    {
                        name: 'Pizza',
                        priceCents: 1000,
                        quantity: 1,
                        notes: 'Bem passada',
                    },
                ],
            };

            (OfflineDB.put as jest.Mock).mockResolvedValue(undefined);

            const result = await createOrderOffline(input);

            expect(result.restaurantId).toBe('rest-123');
            expect(result.tableNumber).toBe(5);
            expect(result.tableId).toBe('table-123');
            expect(result.operatorId).toBe('op-123');
            expect(result.cashRegisterId).toBe('cash-123');
            expect(result.source).toBe('tpv');
            expect(result.notes).toBe('Sem cebola');
            expect(result.items[0].nameSnapshot).toBe('Pizza');
            expect(result.items[0].notes).toBe('Bem passada');
        });
    });

    describe('checkOrderSynced', () => {
        it('deve retornar null se item não está na fila', async () => {
            (OfflineDB.getAll as jest.Mock).mockResolvedValue([]);

            const result = await checkOrderSynced('local-id-123');

            expect(result).toBeNull();
        });

        it('deve retornar null se item está na fila mas não sincronizado', async () => {
            (OfflineDB.getAll as jest.Mock).mockResolvedValue([
                {
                    id: 'local-id-123',
                    status: 'queued',
                },
            ]);

            const result = await checkOrderSynced('local-id-123');

            expect(result).toBeNull();
        });
    });
});
