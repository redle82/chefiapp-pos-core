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

// Mock Supabase — pipeline: from().select().contains().maybeSingle() e from().insert().select().single(); GlovoAdapter: channel().on().subscribe()
jest.mock('../../merchant-portal/src/core/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    }),
    removeChannel: jest.fn(),
    functions: undefined as { invoke?: jest.Mock } | undefined,
  },
}));

// Mock OrderEngine
jest.mock('../../merchant-portal/src/core/tpv/OrderEngine', () => ({
  OrderEngine: {
    createOrder: jest.fn(),
  },
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

      // 1) Pipeline faz duplicate check: from().select().contains().maybeSingle()
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          contains: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      // 2) DbWriteGate.insert: from().insert().select().single()
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'REQUEST-123',
                order_id: 'GLOVO-123',
                restaurant_id: mockRestaurantId,
                source: 'glovo',
                status: 'pending',
              },
              error: null,
            }),
          }),
        }),
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

      // Duplicate check (null) + insert rejeitado (erro)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          contains: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Invalid payload' },
            }),
          }),
        }),
      });

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

      // 1) Primeira chamada: duplicate check (null) + insert (sucesso)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          contains: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'REQUEST-1' }, error: null }),
          }),
        }),
      });

      const result1 = await pipeline.processExternalOrder(mockEvent, mockRestaurantId);
      expect(result1.success).toBe(true);

      // 2) Segunda chamada: duplicate check retorna existente (idempotência)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          contains: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'REQUEST-1' }, error: null }),
          }),
        }),
      });

      const result2 = await pipeline.processExternalOrder(mockEvent, mockRestaurantId);

      // Deve retornar sucesso mas indicar que já existe
      expect(result2.success).toBe(true);
      expect(result2.requestId).toBe('REQUEST-1');
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
    let adapter: GlovoAdapter;

    afterEach(async () => {
      if (adapter) await adapter.dispose();
    });

    it('3.1 - Deve processar webhook e emitir evento', async () => {
      adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
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

      const result = adapter.processIncomingOrder(mockGlovoOrder as any);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('GLOVO-123');
    });

    it('3.2 - Deve fazer polling via Edge Function quando disponível', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({ data: { created: 0 }, error: null });
      (supabase as any).functions = { invoke: mockInvoke };

      adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        enabled: true,
      });

      // Trigger polling manualmente (usa supabase.functions.invoke('delivery-proxy', ...))
      await (adapter as any).pollOrders();

      expect(mockInvoke).toHaveBeenCalledWith('delivery-proxy', {
        body: {
          action: 'sync',
          provider: 'glovo',
          restaurantId: mockRestaurantId,
        },
      });
    });

    it('3.3 - Deve validar health check', async () => {
      adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        enabled: true,
      });

      const status = await adapter.healthCheck();

      expect(status).toBeDefined();
      expect(['ok', 'degraded', 'down']).toContain(status.status);
    });
  });

  describe('4. Integração End-to-End', () => {
    let adapter: GlovoAdapter;

    afterEach(async () => {
      if (adapter) await adapter.dispose();
    });

    it('4.1 - Deve processar pedido Glovo completo (webhook → pipeline → order request)', async () => {
      adapter = new GlovoAdapter();
      const pipeline = new OrderIngestionPipeline();

      // 1. Inicializar adapter
      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
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

      const webhookResult = adapter.processIncomingOrder(mockGlovoOrder as any);
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

      // 1) Duplicate check (null) + 2) insert (sucesso)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          contains: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'REQUEST-123',
                order_id: 'GLOVO-123',
                restaurant_id: mockRestaurantId,
                source: 'glovo',
                status: 'pending',
              },
              error: null,
            }),
          }),
        }),
      });

      const pipelineResult = await pipeline.processExternalOrder(mockEvent, mockRestaurantId);

      expect(pipelineResult.success).toBe(true);
      expect(pipelineResult.requestId).toBe('REQUEST-123');
    });
  });

  describe('5. Tratamento de Erros', () => {
    let adapter: GlovoAdapter;

    afterEach(async () => {
      if (adapter) await adapter.dispose();
    });

    it('5.1 - Deve tratar erro de rede no polling', async () => {
      adapter = new GlovoAdapter();

      await adapter.initialize({
        restaurantId: mockRestaurantId,
        clientId: 'client-id',
        enabled: true,
      });

      // supabase.functions.invoke indisponível → pollOrders retorna sem lançar
      await expect((adapter as any).pollOrders()).resolves.not.toThrow();
    });

    it('5.2 - Deve tratar erro de autenticação OAuth', async () => {
      adapter = new GlovoAdapter();

      // Mock: OAuth falha
      const mockOAuth = {
        getAccessToken: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
      };

      (adapter as any).oauth = mockOAuth;

      await expect(adapter.healthCheck()).resolves.toBeDefined();
    });
  });
});
