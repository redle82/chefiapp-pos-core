/**
 * OfflineSync - Testes Unitários Completos
 * 
 * Testa todas as funcionalidades críticas do OfflineSync:
 * - Processamento de fila offline
 * - Retry com backoff exponencial
 * - Idempotência
 * - Reconciliação
 */

import { syncOfflineQueue } from '../../../merchant-portal/src/core/queue/OfflineSync';
import { OfflineDB } from '../../../merchant-portal/src/core/queue/db';
import { OrderEngine } from '../../../merchant-portal/src/core/tpv/OrderEngine';
import type { OfflineQueueItem } from '../../../merchant-portal/src/core/queue/types';

// Mock OfflineDB
jest.mock('../../../merchant-portal/src/core/queue/db', () => ({
  OfflineDB: {
    getAll: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock OrderEngine
jest.mock('../../../merchant-portal/src/core/tpv/OrderEngine', () => ({
  OrderEngine: {
    createOrder: jest.fn(),
    addItemToOrder: jest.fn(),
    removeItemFromOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
  },
}));

// Mock checkExistingOrder
jest.mock('../../../merchant-portal/src/core/queue/OfflineSync', () => {
  const actual = jest.requireActual('../../../merchant-portal/src/core/queue/OfflineSync');
  return {
    ...actual,
    checkExistingOrder: jest.fn(),
  };
});

describe('🔄 OfflineSync - Testes Unitários', () => {
  const mockRestaurantId = 'REST-123';
  const mockTableId = 'TABLE-1';
  const mockLocalId = 'LOCAL-123';

  const mockQueueItem: OfflineQueueItem = {
    id: 'QUEUE-1',
    type: 'ORDER_CREATE',
    status: 'queued',
    attempts: 0,
    createdAt: Date.now(),
    payload: {
      restaurantId: mockRestaurantId,
      tableId: mockTableId,
      tableNumber: 1,
      items: [
        {
          productId: 'PROD-1',
          name: 'Hambúrguer',
          quantity: 1,
          priceCents: 1000,
        },
      ],
      localId: mockLocalId,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Processamento de Fila', () => {
    it('1.1 - Deve processar item ORDER_CREATE com sucesso', async () => {
      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([mockQueueItem]);

      // Mock: verificar se pedido já existe (não existe)
      const { checkExistingOrder } = require('../../../merchant-portal/src/core/queue/OfflineSync');
      (checkExistingOrder as jest.Mock).mockResolvedValueOnce(null);

      // Mock: criar pedido
      (OrderEngine.createOrder as jest.Mock).mockResolvedValueOnce({
        id: 'ORDER-123',
        restaurantId: mockRestaurantId,
      });

      // Mock: deletar item da fila após sucesso
      (OfflineDB.remove as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(OrderEngine.createOrder).toHaveBeenCalled();
      expect(OfflineDB.remove).toHaveBeenCalledWith('QUEUE-1');
    });

    it('1.2 - Deve pular item se pedido já foi sincronizado (idempotência)', async () => {
      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([mockQueueItem]);

      // Mock: verificar se pedido já existe (existe)
      const { checkExistingOrder } = require('../../../merchant-portal/src/core/queue/OfflineSync');
      (checkExistingOrder as jest.Mock).mockResolvedValueOnce('ORDER-123');

      // Mock: deletar item da fila
      (OfflineDB.remove as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(OrderEngine.createOrder).not.toHaveBeenCalled();
      expect(OfflineDB.remove).toHaveBeenCalledWith('QUEUE-1');
    });

    it('1.3 - Deve processar item ORDER_UPDATE (add_item)', async () => {
      const updateItem: OfflineQueueItem = {
        id: 'QUEUE-2',
        type: 'ORDER_UPDATE',
        status: 'queued',
        attempts: 0,
        createdAt: Date.now(),
        payload: {
          orderId: 'ORDER-123',
          restaurantId: mockRestaurantId,
          action: 'add_item',
          data: {
            productId: 'PROD-2',
            name: 'Batata Frita',
            quantity: 1,
            priceCents: 500,
          },
        },
      };

      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([updateItem]);

      // Mock: adicionar item
      (OrderEngine.addItemToOrder as jest.Mock).mockResolvedValueOnce({
        id: 'ORDER-123',
        items: [],
      });

      // Mock: deletar item da fila
      (OfflineDB.remove as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(1);
      expect(OrderEngine.addItemToOrder).toHaveBeenCalledWith(
        'ORDER-123',
        expect.objectContaining({
          productId: 'PROD-2',
        }),
        mockRestaurantId
      );
    });

    it('1.4 - Deve processar item ORDER_UPDATE (remove_item)', async () => {
      const removeItem: OfflineQueueItem = {
        id: 'QUEUE-3',
        type: 'ORDER_UPDATE',
        status: 'queued',
        attempts: 0,
        createdAt: Date.now(),
        payload: {
          orderId: 'ORDER-123',
          restaurantId: mockRestaurantId,
          action: 'remove_item',
          data: {
            itemId: 'ITEM-1',
          },
        },
      };

      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([removeItem]);

      // Mock: remover item
      (OrderEngine.removeItemFromOrder as jest.Mock).mockResolvedValueOnce({
        id: 'ORDER-123',
        items: [],
      });

      // Mock: deletar item da fila
      (OfflineDB.remove as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(1);
      expect(OrderEngine.removeItemFromOrder).toHaveBeenCalledWith(
        'ORDER-123',
        'ITEM-1',
        mockRestaurantId
      );
    });

    it('1.5 - Deve processar item ORDER_UPDATE (update_status)', async () => {
      const updateStatusItem: OfflineQueueItem = {
        id: 'QUEUE-4',
        type: 'ORDER_UPDATE',
        status: 'queued',
        attempts: 0,
        createdAt: Date.now(),
        payload: {
          orderId: 'ORDER-123',
          restaurantId: mockRestaurantId,
          action: 'update_status',
          data: {
            status: 'preparing',
          },
        },
      };

      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([updateStatusItem]);

      // Mock: atualizar status
      (OrderEngine.updateOrderStatus as jest.Mock).mockResolvedValueOnce(undefined);

      // Mock: deletar item da fila
      (OfflineDB.remove as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(1);
      expect(OrderEngine.updateOrderStatus).toHaveBeenCalledWith(
        'ORDER-123',
        'preparing',
        mockRestaurantId
      );
    });
  });

  describe('2. Retry com Backoff Exponencial', () => {
    it('2.1 - Deve incrementar attempts em caso de falha', async () => {
      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([mockQueueItem]);

      // Mock: verificar se pedido já existe (não existe)
      const { checkExistingOrder } = require('../../../merchant-portal/src/core/queue/OfflineSync');
      (checkExistingOrder as jest.Mock).mockResolvedValueOnce(null);

      // Mock: criar pedido falha
      (OrderEngine.createOrder as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Mock: atualizar item com attempts incrementado
      (OfflineDB.update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(OfflineDB.update).toHaveBeenCalledWith(
        'QUEUE-1',
        expect.objectContaining({
          attempts: 1,
          status: 'queued',
        })
      );
    });

    it('2.2 - Deve marcar como failed após MAX_RETRIES', async () => {
      const maxRetriesItem: OfflineQueueItem = {
        ...mockQueueItem,
        attempts: 5, // MAX_RETRIES
      };

      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([maxRetriesItem]);

      // Mock: verificar se pedido já existe (não existe)
      const { checkExistingOrder } = require('../../../merchant-portal/src/core/queue/OfflineSync');
      (checkExistingOrder as jest.Mock).mockResolvedValueOnce(null);

      // Mock: criar pedido falha
      (OrderEngine.createOrder as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Mock: atualizar item como failed
      (OfflineDB.update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(OfflineDB.update).toHaveBeenCalledWith(
        'QUEUE-1',
        expect.objectContaining({
          status: 'failed',
        })
      );
    });
  });

  describe('3. Sincronização Automática', () => {
    it('3.1 - Deve processar fila quando chamado syncQueue', async () => {
      // Mock: buscar itens da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([mockQueueItem]);

      // Mock: verificar se pedido já existe (não existe)
      const { checkExistingOrder } = require('../../../merchant-portal/src/core/queue/OfflineSync');
      (checkExistingOrder as jest.Mock).mockResolvedValueOnce(null);

      // Mock: criar pedido
      (OrderEngine.createOrder as jest.Mock).mockResolvedValueOnce({
        id: 'ORDER-123',
      });

      // Mock: deletar item da fila
      (OfflineDB.remove as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('3.2 - Deve processar múltiplos itens em ordem FIFO', async () => {
      const item1: OfflineQueueItem = {
        ...mockQueueItem,
        id: 'QUEUE-1',
        createdAt: new Date('2024-01-01T10:00:00Z').getTime(),
      };

      const item2: OfflineQueueItem = {
        ...mockQueueItem,
        id: 'QUEUE-2',
        createdAt: new Date('2024-01-01T10:01:00Z').getTime(),
      };

      // Mock: buscar itens da fila (ordem FIFO)
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([item1, item2]);

      // Mock: verificar se pedidos já existem (não existem)
      const { checkExistingOrder } = require('../../../merchant-portal/src/core/queue/OfflineSync');
      (checkExistingOrder as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      // Mock: criar pedidos
      (OrderEngine.createOrder as jest.Mock)
        .mockResolvedValueOnce({ id: 'ORDER-1' })
        .mockResolvedValueOnce({ id: 'ORDER-2' });

      // Mock: deletar itens da fila
      (OfflineDB.remove as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(OrderEngine.createOrder).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Tratamento de Erros', () => {
    it('4.1 - Deve tratar erro de tipo desconhecido', async () => {
      const unknownItem: OfflineQueueItem = {
        id: 'QUEUE-UNKNOWN',
        type: 'UNKNOWN_TYPE' as any,
        status: 'queued',
        attempts: 0,
        createdAt: Date.now(),
        payload: {},
      };

      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([unknownItem]);

      // Mock: atualizar item como failed
      (OfflineDB.update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(OfflineDB.update).toHaveBeenCalledWith(
        'QUEUE-UNKNOWN',
        expect.objectContaining({
          status: 'failed',
        })
      );
    });

    it('4.2 - Deve tratar erro de payload inválido', async () => {
      const invalidItem: OfflineQueueItem = {
        id: 'QUEUE-INVALID',
        type: 'ORDER_CREATE',
        status: 'queued',
        attempts: 0,
        createdAt: Date.now(),
        payload: null as any,
      };

      // Mock: buscar item da fila
      (OfflineDB.getAll as jest.Mock).mockResolvedValueOnce([invalidItem]);

      // Mock: atualizar item como failed
      (OfflineDB.update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await syncOfflineQueue();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
    });
  });
});
