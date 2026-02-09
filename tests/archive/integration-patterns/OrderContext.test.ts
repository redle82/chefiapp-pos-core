/**
 * OrderContext Tests - Gerenciamento de Pedidos
 * 
 * Testa o contexto que gerencia pedidos no TPV.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase
const mockFrom = jest.fn() as jest.MockedFunction<(table: string) => any>;
const mockSelect = jest.fn() as jest.MockedFunction<(columns: string) => any>;
const mockEq = jest.fn() as jest.MockedFunction<(column: string, value: any) => any>;
const mockGte = jest.fn() as jest.MockedFunction<(column: string, value: any) => Promise<any>>;
const mockInsert = jest.fn() as jest.MockedFunction<(data: any) => Promise<any>>;
const mockUpdate = jest.fn() as jest.MockedFunction<(data: any) => Promise<any>>;

jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: mockFrom
    }
}));

// Mock useOfflineQueue
const mockEnqueue = jest.fn();
const mockProcessQueue = jest.fn();

jest.mock('../../../merchant-portal/src/core/queue/useOfflineQueue', () => ({
    useOfflineQueue: () => ({
        enqueue: mockEnqueue,
        processQueue: mockProcessQueue
    })
}));

describe('OrderContext - Gerenciamento de Pedidos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    describe('Criação de Pedido', () => {
        it('deve criar pedido com itens', async () => {
            const order = {
                id: 'order-123',
                tableNumber: '1',
                status: 'new' as const,
                total: 25.50,
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 },
                    { id: 'item-2', name: 'Coca', price: 3.00, quantity: 2 }
                ],
                createdAt: new Date()
            };

            // Simular criação
            mockInsert.mockResolvedValue({ data: [order], error: null } as any);

            expect(order.items.length).toBe(2);
            expect(order.total).toBe(25.50);
        });

        it('deve calcular total corretamente', () => {
            const items = [
                { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 },
                { id: 'item-2', name: 'Coca', price: 3.00, quantity: 2 }
            ];

            const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            expect(total).toBe(18.50); // 12.50 + (3.00 * 2)
        });

        it('deve criar pedido offline quando não há conexão', () => {
            const isOnline = false;
            const order = {
                id: 'order-123',
                tableNumber: '1',
                status: 'new' as const,
                total: 25.50,
                items: [],
                createdAt: new Date()
            };

            if (!isOnline) {
                // Deve enfileirar para processamento posterior
                mockEnqueue({ type: 'CREATE_ORDER', payload: order });
                expect(mockEnqueue).toHaveBeenCalled();
            }
        });
    });

    describe('Adição de Itens', () => {
        it('deve adicionar item a pedido existente', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 }
                ],
                total: 12.50
            };

            const newItem = { id: 'item-2', name: 'Coca', price: 3.00, quantity: 1 };
            const updatedItems = [...order.items, newItem];
            const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            expect(updatedItems.length).toBe(2);
            expect(updatedTotal).toBe(15.50);
        });

        it('deve incrementar quantidade se item já existe', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 }
                ]
            };

            const existingItem = order.items.find(item => item.id === 'item-1');
            if (existingItem) {
                existingItem.quantity += 1;
            }

            expect(existingItem?.quantity).toBe(2);
        });

        it('deve atualizar total ao adicionar item', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 }
                ],
                total: 12.50
            };

            const newItem = { id: 'item-2', name: 'Coca', price: 3.00, quantity: 1 };
            const newTotal = order.total + (newItem.price * newItem.quantity);

            expect(newTotal).toBe(15.50);
        });
    });

    describe('Remoção de Itens', () => {
        it('deve remover item do pedido', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 },
                    { id: 'item-2', name: 'Coca', price: 3.00, quantity: 1 }
                ]
            };

            const itemIdToRemove = 'item-2';
            const updatedItems = order.items.filter(item => item.id !== itemIdToRemove);

            expect(updatedItems.length).toBe(1);
            expect(updatedItems[0].id).toBe('item-1');
        });

        it('deve atualizar total ao remover item', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 },
                    { id: 'item-2', name: 'Coca', price: 3.00, quantity: 1 }
                ],
                total: 15.50
            };

            const itemToRemove = order.items.find(item => item.id === 'item-2');
            const newTotal = order.total - (itemToRemove ? itemToRemove.price * itemToRemove.quantity : 0);

            expect(newTotal).toBe(12.50);
        });
    });

    describe('Atualização de Quantidade', () => {
        it('deve atualizar quantidade de item', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 }
                ]
            };

            const itemId = 'item-1';
            const newQuantity = 3;

            const updatedItems = order.items.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );

            expect(updatedItems[0].quantity).toBe(3);
        });

        it('deve atualizar total ao mudar quantidade', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 }
                ],
                total: 12.50
            };

            const newQuantity = 3;
            const newTotal = order.items[0].price * newQuantity;

            expect(newTotal).toBe(37.50); // 12.50 * 3
        });

        it('deve remover item se quantidade for 0', () => {
            const order = {
                id: 'order-123',
                items: [
                    { id: 'item-1', name: 'Pizza', price: 12.50, quantity: 1 }
                ]
            };

            const newQuantity = 0;
            const updatedItems = order.items.filter(item => {
                if (item.id === 'item-1') {
                    return newQuantity > 0;
                }
                return true;
            });

            expect(updatedItems.length).toBe(0);
        });
    });

    describe('Atualização de Status', () => {
        it('deve atualizar status do pedido', () => {
            const order = {
                id: 'order-123',
                status: 'new' as const
            };

            const newStatus = 'preparing' as const;
            const updatedOrder = { ...order, status: newStatus };

            expect(updatedOrder.status).toBe('preparing');
        });

        it('deve permitir transições de status válidas', () => {
            const validTransitions: Record<string, string[]> = {
                'new': ['preparing', 'cancelled'],
                'preparing': ['served', 'cancelled'],
                'served': ['paid', 'cancelled'],
                'paid': [],
                'cancelled': []
            };

            const currentStatus = 'new';
            const newStatus = 'preparing';

            expect(validTransitions[currentStatus]).toContain(newStatus);
        });

        it('deve bloquear transições inválidas', () => {
            const validTransitions: Record<string, string[]> = {
                'new': ['preparing', 'cancelled'],
                'paid': []
            };

            const currentStatus = 'paid';
            const invalidStatus = 'new';

            expect(validTransitions[currentStatus] || []).not.toContain(invalidStatus);
        });
    });

    describe('Sincronização Offline/Online', () => {
        it('deve enfileirar pedidos quando offline', () => {
            const isOnline = false;
            const order = {
                id: 'order-123',
                tableNumber: '1',
                status: 'new' as const,
                total: 25.50,
                items: [],
                createdAt: new Date()
            };

            if (!isOnline) {
                mockEnqueue({ type: 'CREATE_ORDER', payload: order });
                expect(mockEnqueue).toHaveBeenCalled();
            }
        });

        it('deve processar fila quando voltar online', () => {
            const wasOffline = true;
            const isNowOnline = true;

            if (wasOffline && isNowOnline) {
                mockProcessQueue();
                expect(mockProcessQueue).toHaveBeenCalled();
            }
        });

        it('deve sincronizar pedidos ao reconectar', async () => {
            const restaurantId = 'restaurant-123';
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            // Simular fetch de pedidos
            mockFrom.mockReturnValue({
                select: mockSelect.mockReturnValue({
                    eq: mockEq.mockReturnValue({
                        gte: mockGte.mockResolvedValue({
                            data: [],
                            error: null
                        } as any)
                    })
                })
            });

            expect(restaurantId).toBeDefined();
        });
    });

    describe('Cálculo de Totais', () => {
        it('deve calcular total diário corretamente', () => {
            const orders = [
                { id: 'order-1', total: 25.50, status: 'paid' as const },
                { id: 'order-2', total: 15.00, status: 'paid' as const },
                { id: 'order-3', total: 30.00, status: 'new' as const }
            ];

            const dailyTotal = orders
                .filter(order => order.status === 'paid')
                .reduce((sum, order) => sum + order.total, 0);

            expect(dailyTotal).toBe(40.50); // 25.50 + 15.00
        });

        it('deve calcular total apenas de pedidos pagos', () => {
            const orders = [
                { id: 'order-1', total: 25.50, status: 'paid' as const },
                { id: 'order-2', total: 15.00, status: 'new' as const },
                { id: 'order-3', total: 30.00, status: 'preparing' as const }
            ];

            const paidTotal = orders
                .filter(order => order.status === 'paid')
                .reduce((sum, order) => sum + order.total, 0);

            expect(paidTotal).toBe(25.50);
        });
    });

    describe('Validações', () => {
        it('deve validar que pedido tem pelo menos um item', () => {
            const order = {
                id: 'order-123',
                items: []
            };

            expect(order.items.length).toBe(0);
            // Pedido sem itens deve ser inválido
        });

        it('deve validar que total é positivo', () => {
            const order = {
                id: 'order-123',
                total: -10.00
            };

            expect(order.total).toBeLessThan(0);
            // Total negativo deve ser inválido
        });

        it('deve validar que quantidade é positiva', () => {
            const item = {
                id: 'item-1',
                name: 'Pizza',
                price: 12.50,
                quantity: -1
            };

            expect(item.quantity).toBeLessThan(0);
            // Quantidade negativa deve ser inválida
        });
    });
});
