/**
 * OrderEngine - Testes Unitários Completos
 * 
 * Testa todas as funcionalidades críticas do OrderEngine:
 * - Criação de pedidos
 * - Validações de regras de negócio
 * - Gestão de itens
 * - Atualização de status
 * - Gestão de mesas
 */

import { OrderEngine, OrderEngineError, type OrderInput, type OrderItemInput } from '../../../merchant-portal/src/core/tpv/OrderEngine';
import { supabase } from '../../../merchant-portal/src/core/supabase';
import { CashRegisterEngine } from '../../../merchant-portal/src/core/tpv/CashRegister';

// Mock Supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

// Mock CashRegisterEngine
jest.mock('../../../merchant-portal/src/core/tpv/CashRegister', () => ({
  CashRegisterEngine: {
    getOpenCashRegister: jest.fn(),
  },
}));

describe('🧾 OrderEngine - Testes Unitários', () => {
  const mockRestaurantId = 'REST-123';
  const mockTableId = 'TABLE-1';
  const mockCashRegisterId = 'CASH-1';
  const mockOperatorId = 'OP-1';

  const mockOrderItem: OrderItemInput = {
    productId: 'PROD-1',
    name: 'Hambúrguer',
    quantity: 1,
    priceCents: 1000,
  };

  const mockOrderInput: OrderInput = {
    restaurantId: mockRestaurantId,
    tableId: mockTableId,
    tableNumber: 1,
    operatorId: mockOperatorId,
    source: 'tpv',
    items: [mockOrderItem],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Criação de Pedidos', () => {
    it('1.1 - Deve criar pedido com dados válidos', async () => {
      // Mock: caixa aberto
      (CashRegisterEngine.getOpenCashRegister as jest.Mock).mockResolvedValue({
        id: mockCashRegisterId,
        restaurant_id: mockRestaurantId,
      });

      // Mock: mesa sem pedido ativo
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: null,
                  error: { code: 'PGRST116' }, // Not found
                })),
              })),
            })),
          })),
        })),
      });

      // Mock: RPC create_order_atomic
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          order_id: 'ORDER-123',
          restaurant_id: mockRestaurantId,
          table_id: mockTableId,
          table_number: 1,
          status: 'pending',
          total_cents: 1000,
          payment_status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      // Mock: buscar itens do pedido
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [
              {
                id: 'ITEM-1',
                order_id: 'ORDER-123',
                product_id: 'PROD-1',
                name: 'Hambúrguer',
                quantity: 1,
                unit_price: 1000,
                total_price: 1000,
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          })),
        })),
      });

      const order = await OrderEngine.createOrder(mockOrderInput);

      expect(order).toBeDefined();
      expect(order.id).toBe('ORDER-123');
      expect(order.restaurantId).toBe(mockRestaurantId);
      expect(order.tableId).toBe(mockTableId);
      expect(order.status).toBe('pending');
      expect(order.items).toHaveLength(1);
      expect(order.totalCents).toBe(1000);
    });

    it('1.2 - Deve rejeitar pedido sem itens', async () => {
      const emptyOrderInput: OrderInput = {
        ...mockOrderInput,
        items: [],
      };

      await expect(OrderEngine.createOrder(emptyOrderInput)).rejects.toThrow(OrderEngineError);
      await expect(OrderEngine.createOrder(emptyOrderInput)).rejects.toThrow('Pedido deve ter pelo menos 1 item');
    });

    it('1.3 - Deve rejeitar pedido com caixa fechado (TPV)', async () => {
      // Mock: caixa fechado
      (CashRegisterEngine.getOpenCashRegister as jest.Mock).mockResolvedValue(null);

      await expect(OrderEngine.createOrder(mockOrderInput)).rejects.toThrow(OrderEngineError);
      await expect(OrderEngine.createOrder(mockOrderInput)).rejects.toThrow('Caixa não está aberto');
    });

    it('1.4 - Deve rejeitar pedido para mesa com pedido ativo', async () => {
      // Mock: caixa aberto
      (CashRegisterEngine.getOpenCashRegister as jest.Mock).mockResolvedValue({
        id: mockCashRegisterId,
        restaurant_id: mockRestaurantId,
      });

      // Mock: mesa com pedido ativo
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    id: 'ORDER-EXISTING',
                    status: 'pending',
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      });

      await expect(OrderEngine.createOrder(mockOrderInput)).rejects.toThrow(OrderEngineError);
      await expect(OrderEngine.createOrder(mockOrderInput)).rejects.toThrow('já possui pedido ativo');
    });
  });

  describe('2. Busca de Pedidos', () => {
    it('2.1 - Deve buscar pedido por ID', async () => {
      // Mock: buscar pedido
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: mockRestaurantId,
                  table_id: mockTableId,
                  status: 'pending',
                  total_cents: 1000,
                  payment_status: 'PENDING',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar itens
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [
              {
                id: 'ITEM-1',
                order_id: 'ORDER-123',
                product_id: 'PROD-1',
                name: 'Hambúrguer',
                quantity: 1,
                unit_price: 1000,
                total_price: 1000,
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          })),
        })),
      });

      const order = await OrderEngine.getOrderById('ORDER-123');

      expect(order).toBeDefined();
      expect(order.id).toBe('ORDER-123');
      expect(order.restaurantId).toBe(mockRestaurantId);
    });

    it('2.2 - Deve lançar erro se pedido não encontrado', async () => {
      // Mock: pedido não encontrado
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              })),
            })),
          })),
        })),
      });

      await expect(OrderEngine.getOrderById('ORDER-NOT-FOUND')).rejects.toThrow(OrderEngineError);
      await expect(OrderEngine.getOrderById('ORDER-NOT-FOUND')).rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('3. Gestão de Itens', () => {
    it('3.1 - Deve adicionar item a pedido', async () => {
      // Mock: buscar pedido
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: mockRestaurantId,
                  status: 'pending',
                  total_cents: 1000,
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: RPC add_item_to_order
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          order_id: 'ORDER-123',
          new_total_cents: 2000,
        },
        error: null,
      });

      // Mock: buscar pedido atualizado
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: mockRestaurantId,
                  status: 'pending',
                  total_cents: 2000,
                  payment_status: 'PENDING',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      // Mock: buscar itens
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [
              {
                id: 'ITEM-1',
                order_id: 'ORDER-123',
                product_id: 'PROD-1',
                name: 'Hambúrguer',
                quantity: 1,
                unit_price: 1000,
                total_price: 1000,
                created_at: new Date().toISOString(),
              },
              {
                id: 'ITEM-2',
                order_id: 'ORDER-123',
                product_id: 'PROD-2',
                name: 'Batata Frita',
                quantity: 1,
                unit_price: 1000,
                total_price: 1000,
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          })),
        })),
      });

      const newItem: OrderItemInput = {
        productId: 'PROD-2',
        name: 'Batata Frita',
        quantity: 1,
        priceCents: 1000,
      };

      const order = await OrderEngine.addItemToOrder('ORDER-123', newItem, mockRestaurantId);

      expect(order).toBeDefined();
      expect(order.items).toHaveLength(2);
      expect(order.totalCents).toBe(2000);
    });

    it('3.2 - Deve rejeitar adicionar item a pedido fechado', async () => {
      // Mock: buscar pedido fechado
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'ORDER-123',
                  restaurant_id: mockRestaurantId,
                  status: 'delivered',
                  total_cents: 1000,
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      const newItem: OrderItemInput = {
        productId: 'PROD-2',
        name: 'Batata Frita',
        quantity: 1,
        priceCents: 1000,
      };

      await expect(OrderEngine.addItemToOrder('ORDER-123', newItem, mockRestaurantId)).rejects.toThrow(OrderEngineError);
      await expect(OrderEngine.addItemToOrder('ORDER-123', newItem, mockRestaurantId)).rejects.toThrow('Pedido já foi fechado');
    });
  });

  describe('4. Atualização de Status', () => {
    it('4.1 - Deve atualizar status do pedido', async () => {
      // Mock: atualizar status
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: [{ id: 'ORDER-123' }],
              error: null,
            })),
          })),
        })),
      });

      await OrderEngine.updateOrderStatus('ORDER-123', 'preparing', mockRestaurantId);

      expect(supabase.from).toHaveBeenCalledWith('gm_orders');
    });

    it('4.2 - Deve lançar erro se atualização falhar', async () => {
      // Mock: erro ao atualizar
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: null,
              error: { message: 'Update failed' },
            })),
          })),
        })),
      });

      await expect(OrderEngine.updateOrderStatus('ORDER-123', 'preparing', mockRestaurantId)).rejects.toThrow(OrderEngineError);
    });
  });

  describe('5. Gestão de Mesas', () => {
    it('5.1 - Deve buscar pedido ativo por mesa', async () => {
      // Mock: buscar pedido ativo
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    id: 'ORDER-123',
                    restaurant_id: mockRestaurantId,
                    table_id: mockTableId,
                    status: 'pending',
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      });

      const order = await OrderEngine.getActiveOrderByTable(mockRestaurantId, mockTableId);

      expect(order).toBeDefined();
      expect(order?.id).toBe('ORDER-123');
      expect(order?.tableId).toBe(mockTableId);
    });

    it('5.2 - Deve retornar null se mesa não tem pedido ativo', async () => {
      // Mock: mesa sem pedido ativo
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: null,
                  error: { code: 'PGRST116' },
                })),
              })),
            })),
          })),
        })),
      });

      const order = await OrderEngine.getActiveOrderByTable(mockRestaurantId, mockTableId);

      expect(order).toBeNull();
    });
  });
});
