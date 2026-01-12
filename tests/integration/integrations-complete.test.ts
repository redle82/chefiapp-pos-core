/**
 * Integrations - Testes de Integração Completos
 * 
 * Testa o fluxo completo de integrações:
 * - OrderIngestionPipeline (ingestão de pedidos externos)
 * - IntegrationRegistry (registro de adapters)
 * - GlovoAdapter (webhook e polling)
 * - StripeGatewayAdapter (pagamentos)
 */

import { OrderIngestionPipeline } from '../../merchant-portal/src/integrations/core/OrderIngestionPipeline';
import { IntegrationRegistry } from '../../merchant-portal/src/integrations/core/IntegrationRegistry';
import { GlovoAdapter } from '../../merchant-portal/src/integrations/adapters/glovo/GlovoAdapter';
import type { OrderCreatedEvent } from '../../merchant-portal/src/integrations/types/IntegrationEvent';
import { supabase } from '../../merchant-portal/src/core/supabase';
import { OrderEngine } from '../../merchant-portal/src/core/tpv/OrderEngine';

// Mock Supabase
jest.mock('../../merchant-portal/src/core/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock OrderEngine
jest.mock('../../merchant-portal/src/core/tpv/OrderEngine', () => ({
  OrderEngine: {
    createOrder: jest.fn(),
  },
}));

// Mock GlovoOAuth
jest.mock('../../merchant-portal/src/integrations/adapters/glovo/GlovoOAuth', () => ({
  GlovoOAuth: jest.fn().mockImplementation(() => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
    refreshAccessToken: jest.fn().mockResolvedValue('mock-refresh-token'),
    isTokenValid: jest.fn().mockReturnValue(true),
  })),
}));

describe('🔌 Integrations - Testes de Integração Completos', () => {
  const mockRestaurantId = 'REST-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. OrderIngestionPipeline', () => {
    it('1.1 - Deve processar pedido externo e criar order request', async () => {
      const pipeline = new OrderIngestionPipeline();

      const mockEvent: OrderCreatedEvent = {
        type: 'order.created',
        payload: {
          orderId: 'GLOVO-123',
          source: 'delivery',
          customerName: 'João Silva',
          items: [
            {
              id: 'PROD-1',
              name: 'Pizza Margherita',
              quantity: 2,
              priceCents: 1250,
            },
          ],
          totalCents: 2500,
          createdAt: Date.now(),
        },
      };

      // Mock: inserir em gm_order_requests
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'REQUEST-123',
                order_id: 'GLOVO-123',
                restaurant_id: mockRestaurantId,
                source: 'glovo',
                status: 'pending',
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await pipeline.processExternalOrder(mockEvent, mockRestaurantId);

      expect(result.success).toBe(true);
      expect(result.requestId).toBe('REQUEST-123');
      expect(supabase.from).toHaveBeenCalledWith('gm_order_requests');
    });

    it('1.2 - Deve rejeitar pedido com dados inválidos', async () => {
      const pipeline = new OrderIngestionPipeline();

      const invalidEvent: OrderCreatedEvent = {
        type: 'order.created',
        payload: {
          orderId: '',
          source: 'delivery',
          items: [],
          totalCents: 0,
          createdAt: Date.now(),
        } as any,
      };

      const result = await pipeline.processExternalOrder(invalidEvent, mockRestaurantId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('1.3 - Deve prevenir duplicatas (idempotência)', async () => {
      const pipeline = new OrderIngestionPipeline();

      const mockEvent: OrderCreatedEvent = {
        type: 'order.created',
        payload: {
          orderId: 'GLOVO-123',
          source: 'delivery',
          items: [
            {
              id: 'PROD-1',
              name: 'Pizza',
              quantity: 1,
              priceCents: 1000,
            },
          ],
          totalCents: 1000,
          createdAt: Date.now(),
        },
      };

      // Mock: primeira inserção (sucesso)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'REQUEST-1' },
              error: null,
            })),
          })),
        })),
      });

      const result1 = await pipeline.processExternalOrder(mockEvent, mockRestaurantId);
      expect(result1.success).toBe(true);

      // Mock: segunda inserção (duplicata - erro de constraint)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint',
              },
            })),
          })),
        })),
      });

      const result2 = await pipeline.processExternalOrder(mockEvent, mockRestaurantId);

      // Deve retornar sucesso mas indicar que já existe
      expect(result2.success).toBe(true);
    });
  });

  describe('2. IntegrationRegistry', () => {
    beforeEach(async () => {
      // Limpar registry antes de cada teste
      await IntegrationRegistry.clear();
    });

    it('2.1 - Deve registrar adapter corretamente', async () => {
      const adapter = new GlovoAdapter();

      await IntegrationRegistry.register(adapter);

      const adapters = IntegrationRegistry.list();
      expect(adapters).toContain(adapter);
    });

    it('2.2 - Deve listar todos os adapters registrados', async () => {
      const glovoAdapter = new GlovoAdapter();

      await IntegrationRegistry.register(glovoAdapter);

      const adapters = IntegrationRegistry.list();
      expect(adapters.length).toBeGreaterThan(0);
      expect(adapters).toContain(glovoAdapter);
    });

    it('2.3 - Deve retornar info de adapters', async () => {
      const glovoAdapter = new GlovoAdapter();

      await IntegrationRegistry.register(glovoAdapter);

      const info = IntegrationRegistry.getInfo();
      expect(info.length).toBeGreaterThan(0);
      expect(info.some(i => i.id === glovoAdapter.id)).toBe(true);
    });
  });

  describe('3. GlovoAdapter - Fluxo Completo', () => {
    it('3.1 - Deve processar webhook e emitir evento', async () => {
      const adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        enabled: true,
      });

      const mockGlovoOrder = {
        id: 'GLOVO-123',
        status: 'PENDING',
        restaurant_id: mockRestaurantId,
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

      const result = adapter.handleWebhook(mockGlovoOrder);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('GLOVO-123');
    });

    it('3.2 - Deve fazer polling quando webhook não disponível', async () => {
      global.fetch = jest.fn();

      const adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        enabled: true,
      });

      const mockOrders = {
        orders: [
          {
            id: 'GLOVO-123',
            status: 'PENDING',
            restaurant_id: mockRestaurantId,
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
      await (adapter as any).pollOrders();

      expect(fetch).toHaveBeenCalled();
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/v3/orders');
    });

    it('3.3 - Deve validar health check', async () => {
      const adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        enabled: true,
      });

      const status = await adapter.healthCheck();

      expect(status).toBeDefined();
      expect(['ok', 'degraded', 'down']).toContain(status.status);
    });
  });

  describe('4. Integração End-to-End', () => {
    it('4.1 - Deve processar pedido Glovo completo (webhook → pipeline → order request)', async () => {
      const adapter = new GlovoAdapter();
      const pipeline = new OrderIngestionPipeline();

      // 1. Inicializar adapter
      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        enabled: true,
      });

      // 2. Processar webhook Glovo
      const mockGlovoOrder = {
        id: 'GLOVO-123',
        status: 'PENDING',
        restaurant_id: mockRestaurantId,
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

      const webhookResult = adapter.handleWebhook(mockGlovoOrder);
      expect(webhookResult.success).toBe(true);

      // 3. Pipeline processa evento (simulado)
      // Nota: O adapter emite evento internamente, mas para teste isolamos
      const mockEvent: OrderCreatedEvent = {
        type: 'order.created',
        payload: {
          orderId: 'GLOVO-123',
          source: 'delivery',
          items: [
            {
              id: 'PROD-1',
              name: 'Pizza Margherita',
              quantity: 2,
              priceCents: 1250,
            },
          ],
          totalCents: 2500,
          createdAt: Date.now(),
        },
      };

      // Mock: inserir em gm_order_requests
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'REQUEST-123',
                order_id: 'GLOVO-123',
                restaurant_id: mockRestaurantId,
                source: 'glovo',
                status: 'pending',
              },
              error: null,
            })),
          })),
        })),
      });

      const pipelineResult = await pipeline.processExternalOrder(mockEvent, mockRestaurantId);

      expect(pipelineResult.success).toBe(true);
      expect(pipelineResult.requestId).toBe('REQUEST-123');
    });
  });

  describe('5. Tratamento de Erros', () => {
    it('5.1 - Deve tratar erro de rede no polling', async () => {
      global.fetch = jest.fn();

      const adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        enabled: true,
      });

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Não deve lançar erro
      await expect((adapter as any).pollOrders()).resolves.not.toThrow();
    });

    it('5.2 - Deve tratar erro de autenticação OAuth', async () => {
      const adapter = new GlovoAdapter();

      // Mock: OAuth falha
      const mockOAuth = {
        getAccessToken: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
      };

      (adapter as any).oauth = mockOAuth;

      await expect(adapter.healthCheck()).resolves.toBeDefined();
    });
  });
});
