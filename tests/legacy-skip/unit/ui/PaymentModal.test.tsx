/**
 * PaymentModal Tests - Testes de UI para modal de pagamento
 * 
 * Testa:
 * - Renderização do modal
 * - Seleção de método de pagamento
 * - Cálculo de troco (cash)
 * - Proteção contra double-click
 * - Estados offline
 * - Integração com Stripe
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock Logger first to avoid import.meta issues
// Jest will automatically use merchant-portal/src/core/logger/__mocks__/Logger.ts
jest.mock('../../../merchant-portal/src/core/logger/Logger');

// Mock FiscalService to avoid Logger import issues
jest.mock('../../../merchant-portal/src/core/fiscal/FiscalService', () => ({
    getFiscalService: jest.fn(() => ({
        getFiscalDocument: jest.fn(),
        processPaymentConfirmed: jest.fn(),
        getOrderData: jest.fn(),
    })),
}));

// Mock dependencies
jest.mock('../../../merchant-portal/src/config', () => ({
    CONFIG: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        STRIPE_PUBLIC_KEY: 'test-stripe-key',
        IS_DEV: true,
        MODE: 'test',
    },
}));
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn().mockResolvedValue({
                data: { session: { access_token: 'test-token' } },
            }),
        },
        from: jest.fn(),
    },
}));
jest.mock('../../../merchant-portal/src/core/tpv/stripePayment');
jest.mock('../../../merchant-portal/src/pages/TPV/context/OfflineOrderContext');
jest.mock('../../../merchant-portal/src/pages/TPV/hooks/useConsumptionGroups');
jest.mock('../../../merchant-portal/src/components/payment/StripePaymentModal', () => ({
    StripePaymentModal: ({ onSuccess, onCancel }: any) => (
        <div data-testid="stripe-payment-modal">
            <button onClick={() => onSuccess('pi_test_123')}>Pay</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));
jest.mock('../../../merchant-portal/src/ui/design-system', () => ({
    useToast: () => ({
        success: jest.fn(),
        error: jest.fn(),
    }),
}));

// Import after mocks
import { PaymentModal, type PaymentMethod } from '../../../merchant-portal/src/pages/TPV/components/PaymentModal';
import { createPaymentIntent } from '../../../merchant-portal/src/core/tpv/stripePayment';
import { useOfflineOrder } from '../../../merchant-portal/src/pages/TPV/context/OfflineOrderContext';
import { useConsumptionGroups } from '../../../merchant-portal/src/pages/TPV/hooks/useConsumptionGroups';

const mockCreatePaymentIntent = createPaymentIntent as jest.MockedFunction<typeof createPaymentIntent>;
const mockUseOfflineOrder = useOfflineOrder as jest.MockedFunction<typeof useOfflineOrder>;
const mockUseConsumptionGroups = useConsumptionGroups as jest.MockedFunction<typeof useConsumptionGroups>;

describe('PaymentModal', () => {
    const defaultProps = {
        orderId: 'order-123',
        restaurantId: 'restaurant-456',
        orderTotal: 5000, // €50.00
        onPay: jest.fn(),
        onCancel: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock to default resolved value
        mockCreatePaymentIntent.mockResolvedValue({
            intent_id: 'pi_test_123',
            client_secret: 'secret_test_123',
            status: 'requires_payment_method',
        });
        mockUseOfflineOrder.mockReturnValue({
            isOffline: false,
            addToQueue: jest.fn(),
            updateOfflineOrder: jest.fn(),
            queue: [],
        } as any);
        mockUseConsumptionGroups.mockReturnValue({
            groups: [],
            loading: false,
            createGroup: jest.fn(),
            updateGroup: jest.fn(),
            deleteGroup: jest.fn(),
        } as any);
    });

    describe('Renderização', () => {
        it('deve renderizar modal com total correto', () => {
            render(<PaymentModal {...defaultProps} />);
            
            expect(screen.getByText('Cobrar Pedido')).toBeInTheDocument();
            // Intl.NumberFormat pode formatar como "50,00 €" ou "€50,00" dependendo da locale
            expect(screen.getByText(/50[.,]00/)).toBeInTheDocument();
        });

        it('deve mostrar métodos de pagamento disponíveis', () => {
            render(<PaymentModal {...defaultProps} />);
            
            expect(screen.getByText('💵 Dinheiro')).toBeInTheDocument();
            expect(screen.getByText(/💳 Cartão/)).toBeInTheDocument();
            expect(screen.getByText(/📱 PIX/)).toBeInTheDocument();
        });

        it('deve mostrar botões de ação', () => {
            render(<PaymentModal {...defaultProps} />);
            
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
            expect(screen.getByText('Cobrar')).toBeInTheDocument();
        });
    });

    describe('Seleção de Método de Pagamento', () => {
        it('deve selecionar dinheiro por padrão', () => {
            render(<PaymentModal {...defaultProps} />);
            
            // Verificar que o método cash está selecionado verificando se o campo de valor aparece
            const amountInput = screen.getByPlaceholderText(/0[.,]00/);
            expect(amountInput).toBeInTheDocument();
        });

        it('deve permitir mudar método de pagamento', async () => {
            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_secret',
                intent_id: 'pi_test_123',
                status: 'requires_payment_method',
            });
            
            render(<PaymentModal {...defaultProps} />);
            
            const cardButton = screen.getByText(/💳 Cartão/).closest('button');
            fireEvent.click(cardButton!);
            
            // Após clicar em cartão, deve tentar criar payment intent
            await waitFor(() => {
                expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
                    orderId: 'order-123',
                    restaurantId: 'restaurant-456',
                    amountCents: 5000,
                    currency: 'EUR',
                });
            }, { timeout: 2000 });
        });

        it('deve desabilitar cartão e PIX quando offline', () => {
            mockUseOfflineOrder.mockReturnValue({
                isOffline: true,
                addToQueue: jest.fn(),
                updateOfflineOrder: jest.fn(),
                queue: [],
            } as any);

            render(<PaymentModal {...defaultProps} />);
            
            const cardButton = screen.getByText(/💳 Cartão/).closest('button');
            const pixButton = screen.getByText(/📱 PIX/).closest('button');
            
            expect(cardButton).toBeDisabled();
            expect(pixButton).toBeDisabled();
        });

        it('deve mudar automaticamente para cash quando offline', async () => {
            mockUseOfflineOrder.mockReturnValue({
                isOffline: false,
                addToQueue: jest.fn(),
                updateOfflineOrder: jest.fn(),
                queue: [],
            } as any);

            const { rerender } = render(<PaymentModal {...defaultProps} />);
            
            // Selecionar cartão
            const cardButton = screen.getByText(/💳 Cartão/).closest('button');
            fireEvent.click(cardButton!);
            
            // Simular offline
            mockUseOfflineOrder.mockReturnValue({
                isOffline: true,
                addToQueue: jest.fn(),
                updateOfflineOrder: jest.fn(),
                queue: [],
            } as any);
            
            rerender(<PaymentModal {...defaultProps} />);
            
            // Deve ter mudado para cash - verificar que o campo de valor aparece
            await waitFor(() => {
                const amountInput = screen.getByPlaceholderText(/0[.,]00/);
                expect(amountInput).toBeInTheDocument();
            });
        });
    });

    describe('Cálculo de Troco (Cash)', () => {
        it('deve mostrar campo de valor recebido para cash', () => {
            render(<PaymentModal {...defaultProps} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            expect(amountInput).toBeInTheDocument();
        });

        it('deve calcular troco corretamente', () => {
            render(<PaymentModal {...defaultProps} />);
            
            const amountInput = screen.getByPlaceholderText(/0[.,]00/);
            fireEvent.change(amountInput, { target: { value: '60.00' } });
            
            // Intl.NumberFormat pode formatar como "10,00 €" ou "€10,00"
            expect(screen.getByText(/10[.,]00/)).toBeInTheDocument(); // Troco
        });

        it('deve desabilitar botão cobrar se valor insuficiente', () => {
            render(<PaymentModal {...defaultProps} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            fireEvent.change(amountInput, { target: { value: '40.00' } });
            
            const payButton = screen.getByText('Cobrar');
            expect(payButton).toBeDisabled();
        });

        it('deve habilitar botão cobrar se valor suficiente', () => {
            render(<PaymentModal {...defaultProps} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            fireEvent.change(amountInput, { target: { value: '50.00' } });
            
            const payButton = screen.getByText('Cobrar');
            expect(payButton).not.toBeDisabled();
        });
    });

    describe('Proteção contra Double-Click', () => {
        it('deve prevenir double-click em 500ms', async () => {
            const onPay = jest.fn().mockResolvedValue(undefined);
            render(<PaymentModal {...defaultProps} onPay={onPay} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            fireEvent.change(amountInput, { target: { value: '50.00' } });
            
            const payButton = screen.getByText('Cobrar');
            
            // Primeiro clique
            fireEvent.click(payButton);
            
            // Segundo clique imediato (deve ser ignorado)
            fireEvent.click(payButton);
            
            await waitFor(() => {
                expect(onPay).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Processamento de Pagamento', () => {
        it('deve chamar onPay com método correto', async () => {
            const onPay = jest.fn().mockResolvedValue(undefined);
            render(<PaymentModal {...defaultProps} onPay={onPay} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            fireEvent.change(amountInput, { target: { value: '50.00' } });
            
            const payButton = screen.getByText('Cobrar');
            fireEvent.click(payButton);
            
            await waitFor(() => {
                expect(onPay).toHaveBeenCalled();
                // onPay pode ser chamado com apenas 'cash' ou com 'cash' e undefined
                const calls = onPay.mock.calls;
                expect(calls.length).toBeGreaterThan(0);
                expect(calls[0][0]).toBe('cash');
            }, { timeout: 2000 });
        });

        it('deve mostrar estado de processamento', async () => {
            const onPay = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<PaymentModal {...defaultProps} onPay={onPay} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            fireEvent.change(amountInput, { target: { value: '50.00' } });
            
            const payButton = screen.getByText('Cobrar');
            fireEvent.click(payButton);
            
            expect(screen.getByText('Processando...')).toBeInTheDocument();
        });

        it('deve mostrar mensagem de sucesso após pagamento', async () => {
            const onPay = jest.fn().mockResolvedValue(undefined);
            render(<PaymentModal {...defaultProps} onPay={onPay} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            fireEvent.change(amountInput, { target: { value: '50.00' } });
            
            const payButton = screen.getByText('Cobrar');
            fireEvent.click(payButton);
            
            await waitFor(() => {
                expect(screen.getByText(/Pagamento registrado com sucesso!/)).toBeInTheDocument();
            });
        });

        it('deve mostrar mensagem de erro em caso de falha', async () => {
            const onPay = jest.fn().mockRejectedValue(new Error('Erro no pagamento'));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            // Mockar window.onerror para capturar erros não tratados
            const originalOnError = window.onerror;
            window.onerror = jest.fn(() => true); // Retornar true para prevenir que o erro seja exibido
            
            render(<PaymentModal {...defaultProps} onPay={onPay} />);
            
            const amountInput = screen.getByPlaceholderText('0.00');
            fireEvent.change(amountInput, { target: { value: '50.00' } });
            
            const payButton = screen.getByText('Cobrar');
            
            // Clicar no botão - o erro será capturado e result será setado para 'error'
            // O componente faz setResult('error') no catch, mas depois faz throw err
            // O erro será capturado por window.onerror, mas a mensagem deve aparecer
            fireEvent.click(payButton);
            
            // Aguardar que o estado seja atualizado após o catch
            // O componente mostra "✗ Erro ao processar pagamento. Tente novamente." quando result === 'error'
            await waitFor(() => {
                // O texto exato é "✗ Erro ao processar pagamento. Tente novamente."
                const errorText = screen.queryByText(/Erro ao processar pagamento/);
                if (errorText) return true;
                
                // Tentar encontrar por partes do texto
                const tryAgain = screen.queryByText(/Tente novamente/);
                if (tryAgain) return true;
                
                return false;
            }, { 
                timeout: 2000
            });
            
            // Verificar que a mensagem de erro foi exibida
            const errorMessage = screen.queryByText(/Erro ao processar pagamento/) || 
                                 screen.queryByText(/Tente novamente/);
            expect(errorMessage).toBeInTheDocument();
            expect(onPay).toHaveBeenCalled();
            
            // Restaurar
            window.onerror = originalOnError;
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Integração com Stripe', () => {
        it('deve criar Payment Intent ao selecionar cartão', async () => {
            mockCreatePaymentIntent.mockResolvedValue({
                client_secret: 'pi_test_secret',
                intent_id: 'pi_test_123',
                status: 'requires_payment_method',
            });

            render(<PaymentModal {...defaultProps} />);
            
            const cardButton = screen.getByText(/💳 Cartão/).closest('button');
            fireEvent.click(cardButton!);
            
            await waitFor(() => {
                expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
                    orderId: 'order-123',
                    restaurantId: 'restaurant-456',
                    amountCents: 5000,
                    currency: 'EUR',
                });
            });
        });

        it('deve mostrar erro se criar Payment Intent falhar', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            // Override default mock for this test
            mockCreatePaymentIntent.mockRejectedValueOnce(new Error('Erro ao criar intent'));
            
            render(<PaymentModal {...defaultProps} />);
            
            const cardButton = screen.getByText(/💳 Cartão/).closest('button');
            expect(cardButton).toBeInTheDocument();
            
            fireEvent.click(cardButton!);
            
            // Aguardar que o erro do Stripe seja exibido
            // O componente mostra stripeError que pode ser a mensagem do erro ou "Erro ao criar pagamento"
            await waitFor(() => {
                const errorText = screen.queryByText(/Erro ao criar intent/) || screen.queryByText(/Erro ao criar pagamento/);
                expect(errorText).toBeInTheDocument();
            }, { timeout: 3000 });
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Cancelamento', () => {
        it('deve chamar onCancel ao clicar em cancelar', () => {
            const onCancel = jest.fn();
            render(<PaymentModal {...defaultProps} onCancel={onCancel} />);
            
            const cancelButton = screen.getByText('Cancelar');
            fireEvent.click(cancelButton);
            
            expect(onCancel).toHaveBeenCalled();
        });
    });
});
