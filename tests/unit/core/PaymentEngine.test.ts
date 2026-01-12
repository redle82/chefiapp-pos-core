/**
 * PaymentEngine - Testes Unitários Completos
 * 
 * Testa todas as funcionalidades críticas do PaymentEngine:
 * - Processamento de pagamentos
 * - Validações de regras de negócio
 * - Idempotência
 * - Logging de tentativas
 */

import { PaymentEngine, type PaymentInput } from '../../../merchant-portal/src/core/tpv/PaymentEngine';
import { supabase } from '../../../merchant-portal/src/core/supabase';

// Mock Supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

// Mock logAuditEvent
jest.mock('../../../merchant-portal/src/core/audit/logAuditEvent', () => ({
  logAuditEvent: jest.fn(),
}));

describe('💳 PaymentEngine - Testes Unitários', () => {
  const mockRestaurantId = 'REST-123';
  const mockOrderId = 'ORDER-123';
  const mockCashRegisterId = 'CASH-1';
  const mockOperatorId = 'OP-1';

  const mockPaymentInput: PaymentInput = {
    orderId: mockOrderId,
    restaurantId: mockRestaurantId,
    cashRegisterId: mockCashRegisterId,
    amountCents: 1000,
    method: 'cash',
    metadata: {
      operatorId: mockOperatorId,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: jest.fn(() => 'uuid-123'),
    } as any;
  });

  describe('1. Processamento de Pagamentos', () => {
    it('1.1 - Deve processar pagamento com dados válidos', async () => {
      // Mock: RPC process_order_payment
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: 'PAYMENT-123',
          order_id: mockOrderId,
          amount_cents: 1000,
          method: 'cash',
          status: 'PAID',
        },
        error: null,
      });

      // Mock: logPaymentAttempt (buscar payment)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'PAYMENT-123',
                tenant_id: mockRestaurantId,
                order_id: mockOrderId,
                amount_cents: 1000,
                currency: 'EUR',
                method: 'cash',
                status: 'PAID',
                created_at: new Date().toISOString(),
              },
              error: null,
            })),
          })),
        })),
      });

      const payment = await PaymentEngine.processPayment(mockPaymentInput);

      expect(payment).toBeDefined();
      expect(payment.id).toBe('PAYMENT-123');
      expect(payment.orderId).toBe(mockOrderId);
      expect(payment.amountCents).toBe(1000);
      expect(payment.method).toBe('cash');
      expect(payment.status).toBe('PAID');
    });

    it('1.2 - Deve gerar idempotency key automaticamente', async () => {
      const inputWithoutKey: PaymentInput = {
        ...mockPaymentInput,
        idempotencyKey: undefined,
      };

      // Mock: RPC process_order_payment
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: 'PAYMENT-123',
        },
        error: null,
      });

      // Mock: buscar payment
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'PAYMENT-123',
                tenant_id: mockRestaurantId,
                order_id: mockOrderId,
                amount_cents: 1000,
                currency: 'EUR',
                method: 'cash',
                status: 'PAID',
                created_at: new Date().toISOString(),
              },
              error: null,
            })),
          })),
        })),
      });

      await PaymentEngine.processPayment(inputWithoutKey);

      // Verificar que idempotency key foi gerado
      expect(supabase.rpc).toHaveBeenCalledWith(
        'process_order_payment',
        expect.objectContaining({
          p_idempotency_key: expect.stringContaining(mockOrderId),
        })
      );
    });

    it('1.3 - Deve usar idempotency key fornecido', async () => {
      const inputWithKey: PaymentInput = {
        ...mockPaymentInput,
        idempotencyKey: 'custom-key-123',
      };

      // Mock: RPC process_order_payment
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: 'PAYMENT-123',
        },
        error: null,
      });

      // Mock: buscar payment
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'PAYMENT-123',
                tenant_id: mockRestaurantId,
                order_id: mockOrderId,
                amount_cents: 1000,
                currency: 'EUR',
                method: 'cash',
                status: 'PAID',
                created_at: new Date().toISOString(),
              },
              error: null,
            })),
          })),
        })),
      });

      await PaymentEngine.processPayment(inputWithKey);

      // Verificar que idempotency key customizado foi usado
      expect(supabase.rpc).toHaveBeenCalledWith(
        'process_order_payment',
        expect.objectContaining({
          p_idempotency_key: 'custom-key-123',
        })
      );
    });

    it('1.4 - Deve lançar erro se RPC falhar', async () => {
      // Mock: RPC com erro
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'Duplicate payment',
        },
      });

      await expect(PaymentEngine.processPayment(mockPaymentInput)).rejects.toThrow('Erro ao processar pagamento');
    });

    it('1.5 - Deve lançar erro se transação não retornar success', async () => {
      // Mock: RPC retorna success: false
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: false,
          error: 'Insufficient funds',
        },
        error: null,
      });

      await expect(PaymentEngine.processPayment(mockPaymentInput)).rejects.toThrow('Transação de pagamento falhou');
    });
  });

  describe('2. Métodos de Pagamento', () => {
    const paymentMethods = ['cash', 'card', 'mbway', 'multibanco', 'other'] as const;

    paymentMethods.forEach((method) => {
      it(`2.${paymentMethods.indexOf(method) + 1} - Deve processar pagamento via ${method}`, async () => {
        const input: PaymentInput = {
          ...mockPaymentInput,
          method,
        };

        // Mock: RPC process_order_payment
        (supabase.rpc as jest.Mock).mockResolvedValueOnce({
          data: {
            success: true,
            payment_id: 'PAYMENT-123',
            method,
          },
          error: null,
        });

        // Mock: buscar payment
        (supabase.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'PAYMENT-123',
                  tenant_id: mockRestaurantId,
                  order_id: mockOrderId,
                  amount_cents: 1000,
                  currency: 'EUR',
                  method,
                  status: 'PAID',
                  created_at: new Date().toISOString(),
                },
                error: null,
              })),
            })),
          })),
        });

        const payment = await PaymentEngine.processPayment(input);

        expect(payment.method).toBe(method);
      });
    });
  });

  describe('3. Logging de Tentativas', () => {
    it('3.1 - Deve logar tentativa de pagamento bem-sucedida', async () => {
      // Mock: RPC process_order_payment
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: 'PAYMENT-123',
        },
        error: null,
      });

      // Mock: buscar payment
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'PAYMENT-123',
                tenant_id: mockRestaurantId,
                order_id: mockOrderId,
                amount_cents: 1000,
                currency: 'EUR',
                method: 'cash',
                status: 'PAID',
                created_at: new Date().toISOString(),
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock: logPaymentAttempt (insert)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn(() => ({
          data: [{ id: 'LOG-123' }],
          error: null,
        })),
      });

      await PaymentEngine.processPayment(mockPaymentInput);

      // Verificar que log foi criado
      expect(supabase.from).toHaveBeenCalledWith('payment_attempts');
    });

    it('3.2 - Deve logar tentativa de pagamento falhada', async () => {
      // Mock: RPC com erro
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'Duplicate payment',
        },
      });

      // Mock: logPaymentAttempt (insert)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn(() => ({
          data: [{ id: 'LOG-123' }],
          error: null,
        })),
      });

      await expect(PaymentEngine.processPayment(mockPaymentInput)).rejects.toThrow();

      // Verificar que log de falha foi criado
      expect(supabase.from).toHaveBeenCalledWith('payment_attempts');
    });
  });

  describe('4. Validações', () => {
    it('4.1 - Deve validar que cashRegisterId é obrigatório', async () => {
      const inputWithoutCashRegister: PaymentInput = {
        ...mockPaymentInput,
        cashRegisterId: '' as any,
      };

      // Mock: RPC com erro de validação
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: {
          code: '23502',
          message: 'cash_register_id is required',
        },
      });

      await expect(PaymentEngine.processPayment(inputWithoutCashRegister)).rejects.toThrow();
    });

    it('4.2 - Deve validar que amountCents é positivo', async () => {
      const inputWithNegativeAmount: PaymentInput = {
        ...mockPaymentInput,
        amountCents: -100,
      };

      // Mock: RPC com erro de validação
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: {
          code: '23514',
          message: 'amount_cents must be positive',
        },
      });

      await expect(PaymentEngine.processPayment(inputWithNegativeAmount)).rejects.toThrow();
    });
  });
});
