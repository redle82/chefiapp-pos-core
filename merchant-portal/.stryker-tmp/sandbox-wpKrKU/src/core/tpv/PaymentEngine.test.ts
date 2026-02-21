/**
 * PaymentEngine - Testes Unitarios Completos
 *
 * Testa todas as funcionalidades criticas do PaymentEngine:
 * - Processamento de pagamentos
 * - Validacoes de regras de negocio
 * - Idempotencia
 * - Logging de tentativas
 */

import { vi } from "vitest";
import { PaymentEngine, type PaymentInput } from "./PaymentEngine";

const mockInvokeRpc = vi.fn();
const mockGetTableClient = vi.fn();

vi.mock("../infra/coreRpc", () => ({
  invokeRpc: (...args: unknown[]) => mockInvokeRpc(...args),
  getTableClient: (...args: unknown[]) => mockGetTableClient(...args),
}));

vi.mock("../audit/logAuditEvent", () => ({
  logAuditEvent: vi.fn(),
}));

describe("PaymentEngine - Testes Unitarios", () => {
  const mockRestaurantId = "REST-123";
  const mockOrderId = "ORDER-123";
  const mockCashRegisterId = "CASH-1";
  const mockOperatorId = "OP-1";

  const mockPaymentInput: PaymentInput = {
    orderId: mockOrderId,
    restaurantId: mockRestaurantId,
    cashRegisterId: mockCashRegisterId,
    amountCents: 1000,
    method: "cash",
    metadata: {
      operatorId: mockOperatorId,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "uuid-123"),
    });
  });

  describe("1. Processamento de Pagamentos", () => {
    it("1.1 - Deve processar pagamento com dados validos", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: "PAYMENT-123",
          order_id: mockOrderId,
          amount_cents: 1000,
          method: "cash",
          status: "PAID",
        },
        error: null,
      });

      mockGetTableClient.mockResolvedValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => ({
                data: {
                  id: "PAYMENT-123",
                  tenant_id: mockRestaurantId,
                  order_id: mockOrderId,
                  amount_cents: 1000,
                  currency: "EUR",
                  method: "cash",
                  status: "PAID",
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const payment = await PaymentEngine.processPayment(mockPaymentInput);

      expect(payment).toBeDefined();
      expect(payment.id).toBe("PAYMENT-123");
      expect(payment.orderId).toBe(mockOrderId);
      expect(payment.amountCents).toBe(1000);
      expect(payment.method).toBe("cash");
      expect(payment.status).toBe("PAID");
    });

    it("1.2 - Deve gerar idempotency key automaticamente", async () => {
      const inputWithoutKey: PaymentInput = {
        ...mockPaymentInput,
        idempotencyKey: undefined,
      };

      mockInvokeRpc.mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: "PAYMENT-123",
        },
        error: null,
      });

      mockGetTableClient.mockResolvedValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => ({
                data: {
                  id: "PAYMENT-123",
                  tenant_id: mockRestaurantId,
                  order_id: mockOrderId,
                  amount_cents: 1000,
                  currency: "EUR",
                  method: "cash",
                  status: "PAID",
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      await PaymentEngine.processPayment(inputWithoutKey);

      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "process_order_payment",
        expect.objectContaining({
          p_idempotency_key: expect.stringContaining(mockOrderId),
        }),
      );
    });

    it("1.3 - Deve usar idempotency key fornecido", async () => {
      const inputWithKey: PaymentInput = {
        ...mockPaymentInput,
        idempotencyKey: "custom-key-123",
      };

      mockInvokeRpc.mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: "PAYMENT-123",
        },
        error: null,
      });

      mockGetTableClient.mockResolvedValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => ({
                data: {
                  id: "PAYMENT-123",
                  tenant_id: mockRestaurantId,
                  order_id: mockOrderId,
                  amount_cents: 1000,
                  currency: "EUR",
                  method: "cash",
                  status: "PAID",
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      await PaymentEngine.processPayment(inputWithKey);

      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "process_order_payment",
        expect.objectContaining({
          p_idempotency_key: "custom-key-123",
        }),
      );
    });

    it("1.4 - Deve lancar erro se RPC falhar", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: "23505",
          message: "Duplicate payment",
        },
      });

      await expect(
        PaymentEngine.processPayment(mockPaymentInput),
      ).rejects.toThrow("Erro ao processar pagamento");
    });

    it("1.5 - Deve lancar erro se transacao nao retornar success", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: {
          success: false,
          error: "Insufficient funds",
        },
        error: null,
      });

      await expect(
        PaymentEngine.processPayment(mockPaymentInput),
      ).rejects.toThrow("Transação de pagamento falhou");
    });
  });

  describe("2. Metodos de Pagamento", () => {
    const paymentMethods = ["cash", "card", "pix"] as const;

    paymentMethods.forEach((method) => {
      it(`2.${
        paymentMethods.indexOf(method) + 1
      } - Deve processar pagamento via ${method}`, async () => {
        const input: PaymentInput = {
          ...mockPaymentInput,
          method,
        };

        mockInvokeRpc.mockResolvedValueOnce({
          data: {
            success: true,
            payment_id: "PAYMENT-123",
            method,
          },
          error: null,
        });

        mockGetTableClient.mockResolvedValueOnce({
          from: () => ({
            select: () => ({
              eq: () => ({
                single: () => ({
                  data: {
                    id: "PAYMENT-123",
                    tenant_id: mockRestaurantId,
                    order_id: mockOrderId,
                    amount_cents: 1000,
                    currency: "EUR",
                    method,
                    status: "PAID",
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }),
        });

        const payment = await PaymentEngine.processPayment(input);

        expect(payment.method).toBe(method);
      });
    });
  });

  describe("3. Logging de Tentativas", () => {
    it("3.1 - Deve logar tentativa de pagamento bem-sucedida", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: "PAYMENT-123",
        },
        error: null,
      });

      mockGetTableClient.mockResolvedValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => ({
                data: {
                  id: "PAYMENT-123",
                  tenant_id: mockRestaurantId,
                  order_id: mockOrderId,
                  amount_cents: 1000,
                  currency: "EUR",
                  method: "cash",
                  status: "PAID",
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockInvokeRpc.mockResolvedValueOnce(undefined);

      await PaymentEngine.processPayment(mockPaymentInput);

      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "fn_log_payment_attempt",
        expect.any(Object),
      );
    });

    it("3.2 - Deve logar tentativa de pagamento falhada", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: "23505",
          message: "Duplicate payment",
        },
      });

      mockInvokeRpc.mockResolvedValueOnce(undefined);

      await expect(
        PaymentEngine.processPayment(mockPaymentInput),
      ).rejects.toThrow();

      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "fn_log_payment_attempt",
        expect.any(Object),
      );
    });
  });

  describe("4. Validacoes", () => {
    it("4.1 - Deve validar que cashRegisterId e obrigatorio", async () => {
      const inputWithoutCashRegister: PaymentInput = {
        ...mockPaymentInput,
        cashRegisterId: "" as any,
      };

      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: "23502",
          message: "cash_register_id is required",
        },
      });

      await expect(
        PaymentEngine.processPayment(inputWithoutCashRegister),
      ).rejects.toThrow();
    });

    it("4.2 - Deve validar que amountCents e positivo", async () => {
      const inputWithNegativeAmount: PaymentInput = {
        ...mockPaymentInput,
        amountCents: -100,
      };

      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: "23514",
          message: "amount_cents must be positive",
        },
      });

      await expect(
        PaymentEngine.processPayment(inputWithNegativeAmount),
      ).rejects.toThrow();
    });
  });

  describe("5. Estoque (Ledger)", () => {
    it("5.1 - Nao deve chamar process_inventory_deduction", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: {
          success: true,
          payment_id: "PAYMENT-123",
        },
        error: null,
      });

      mockGetTableClient.mockResolvedValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => ({
                data: {
                  id: "PAYMENT-123",
                  tenant_id: mockRestaurantId,
                  order_id: mockOrderId,
                  amount_cents: 1000,
                  currency: "EUR",
                  method: "cash",
                  status: "PAID",
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      await PaymentEngine.processPayment(mockPaymentInput);

      const calledInventory = mockInvokeRpc.mock.calls.some(
        (call) => call[0] === "process_inventory_deduction",
      );
      expect(calledInventory).toBe(false);
    });
  });
});
