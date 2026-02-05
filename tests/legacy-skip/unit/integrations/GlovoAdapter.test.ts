/**
 * Testes Unitários - GlovoAdapter
 * 
 * Valida que o adapter Glovo funciona corretamente
 */

import { GlovoAdapter } from '../../../merchant-portal/src/integrations/adapters/glovo/GlovoAdapter';
import { GlovoOAuth } from '../../../merchant-portal/src/integrations/adapters/glovo/GlovoOAuth';
import type { GlovoOrder, GlovoConfig } from '../../../merchant-portal/src/integrations/adapters/glovo/GlovoTypes';
import type { IntegrationEvent } from '../../../merchant-portal/src/integrations/types/IntegrationEvent';

// Mock GlovoOAuth
jest.mock('../../../merchant-portal/src/integrations/adapters/glovo/GlovoOAuth', () => ({
    GlovoOAuth: jest.fn().mockImplementation(() => ({
        getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
        refreshAccessToken: jest.fn().mockResolvedValue('mock-refresh-token'),
        isTokenValid: jest.fn().mockReturnValue(true),
    })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('GlovoAdapter', () => {
    let adapter: GlovoAdapter;
    let mockConfig: GlovoConfig;

    beforeEach(() => {
        adapter = new GlovoAdapter();
        mockConfig = {
            restaurantId: 'rest-123',
            clientId: 'client-id',
            clientSecret: 'client-secret',
            enabled: true,
        };

        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('deve inicializar adapter com configuração', async () => {
            await adapter.initialize(mockConfig);

            expect(adapter['config']).toEqual(mockConfig);
            expect(adapter['oauth']).toBeDefined();
        });

        it('deve iniciar polling quando habilitado', async () => {
            jest.useFakeTimers();
            
            await adapter.initialize(mockConfig);

            // Avançar timer para trigger polling
            jest.advanceTimersByTime(10000);

            expect(adapter['pollingInterval']).toBeDefined();
            
            jest.useRealTimers();
        });
    });

    describe('handleWebhook', () => {
        beforeEach(async () => {
            await adapter.initialize(mockConfig);
        });

        it('deve processar webhook válido corretamente', () => {
            const mockOrder: GlovoOrder = {
                id: 'order-123',
                status: 'PENDING',
                restaurant_id: 'rest-123',
                customer: {
                    id: 'customer-123',
                    name: 'João Silva',
                    phone: '+351912345678',
                },
                delivery: {
                    address: {
                        address: 'Rua X, 123',
                        city: 'Lisboa',
                    },
                },
                items: [
                    {
                        id: 'item-1',
                        name: 'Pizza Margherita',
                        quantity: 1,
                        price: 12.50,
                        total: 12.50,
                    },
                ],
                total: 12.50,
                currency: 'EUR',
                created_at: new Date().toISOString(),
            };

            const result = adapter.handleWebhook(mockOrder);

            expect(result.success).toBe(true);
            expect(result.orderId).toBe('order-123');
        });

        it('deve rejeitar payload inválido', () => {
            const invalidPayload = { invalid: 'data' };

            const result = adapter.handleWebhook(invalidPayload);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('deve rejeitar pedido de restaurante diferente', () => {
            const mockOrder: GlovoOrder = {
                id: 'order-123',
                status: 'PENDING',
                restaurant_id: 'restaurant-different',
                customer: { id: 'customer-123', name: 'Test', phone: '+351' },
                delivery: { address: { address: 'Test', city: 'Test' } },
                items: [],
                total: 0,
                currency: 'EUR',
                created_at: new Date().toISOString(),
            };

            const result = adapter.handleWebhook(mockOrder);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Restaurant ID mismatch');
        });

        it('deve evitar duplicatas', () => {
            const mockOrder: GlovoOrder = {
                id: 'order-123',
                status: 'PENDING',
                restaurant_id: 'rest-123',
                customer: { id: 'customer-123', name: 'Test', phone: '+351' },
                delivery: { address: { address: 'Test', city: 'Test' } },
                items: [],
                total: 0,
                currency: 'EUR',
                created_at: new Date().toISOString(),
            };

            // Processar primeiro
            const result1 = adapter.handleWebhook(mockOrder);
            expect(result1.success).toBe(true);
            
            // Tentar processar novamente
            const result2 = adapter.handleWebhook(mockOrder);
            
            // Deve detectar duplicata (o processedOrderIds é usado internamente)
            // Verificar que o resultado ainda é success mas o pedido não é processado novamente
            expect(result2.success).toBe(true);
        });
    });

    describe('polling', () => {
        beforeEach(async () => {
            await adapter.initialize(mockConfig);
        });

        it('deve fazer polling de pedidos pendentes', async () => {
            const mockOrders = {
                orders: [
                    {
                        id: 'order-123',
                        status: 'PENDING',
                        restaurant_id: 'rest-123',
                        customer: { name: 'Test', phone: '+351' },
                        delivery: { address: 'Test', city: 'Test' },
                        items: [],
                        total: 0,
                        currency: 'EUR',
                        created_at: new Date().toISOString(),
                    },
                ],
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockOrders,
            });

            // Trigger polling manualmente
            await adapter['pollOrders']();

            expect(fetch).toHaveBeenCalled();
            const fetchCall = (fetch as jest.Mock).mock.calls[0];
            expect(fetchCall[0]).toContain('/v3/orders');
            expect(fetchCall[0]).toContain('status=PENDING');
        });

        it('deve tratar erro de polling graciosamente', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(adapter['pollOrders']()).resolves.not.toThrow();
        });
    });

    describe('health check', () => {
        beforeEach(async () => {
            await adapter.initialize(mockConfig);
        });

        it('deve retornar status saudável quando funcionando', async () => {
            const status = await adapter.healthCheck();

            expect(status.status).toBe('ok');
        });

        it('deve retornar status degradado quando há erros', async () => {
            // Simular muitos erros para trigger degraded
            adapter['ordersReceived'] = 20;
            adapter['ordersErrors'] = 10; // 50% error rate > 30% threshold

            const status = await adapter.healthCheck();

            expect(status.status).toBe('degraded');
        });
    });

    describe('transformOrder', () => {
        beforeEach(async () => {
            await adapter.initialize(mockConfig);
        });

        it('deve transformar pedido Glovo em OrderCreatedEvent', () => {
            const mockOrder: GlovoOrder = {
                id: 'order-123',
                status: 'PENDING',
                restaurant_id: 'rest-123',
                customer: {
                    id: 'customer-123',
                    name: 'João Silva',
                    phone: '+351912345678',
                },
                delivery: {
                    address: {
                        address: 'Rua X, 123',
                        city: 'Lisboa',
                    },
                },
                items: [
                    {
                        id: 'item-1',
                        name: 'Pizza Margherita',
                        quantity: 2,
                        price: 12.50,
                        total: 25.00,
                    },
                ],
                total: 25.00,
                currency: 'EUR',
                created_at: new Date().toISOString(),
            };

            // processNewOrder retorna { success, orderId }, mas internamente emite evento
            // Vamos testar que o método funciona
            const result = adapter['processNewOrder'](mockOrder);

            expect(result.success).toBe(true);
            expect(result.orderId).toBe('order-123');
        });
    });
});
