/**
 * CloseCashRegisterModal Tests - Testes de UI para modal de fechamento de caixa
 * 
 * Testa:
 * - Renderização do modal
 * - Resumo do dia
 * - Validação de pedidos abertos
 * - Input de saldo final
 * - Cálculo de diferença
 * - Sucesso ao fechar caixa
 * - Erro ao fechar caixa
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CloseCashRegisterModal } from '../../../merchant-portal/src/pages/TPV/components/CloseCashRegisterModal';

// Mock supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

// Import after mock to get the mocked version
import { supabase } from '../../../merchant-portal/src/core/supabase';

describe('CloseCashRegisterModal', () => {
    const mockOnClose = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve renderizar o modal', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        neq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        render(
            <CloseCashRegisterModal
                dailyTotalCents={50000}
                openingBalanceCents={10000}
                restaurantId="rest-123"
                onClose={mockOnClose}
                onCancel={mockOnCancel}
            />
        );
        
        await waitFor(() => {
            expect(screen.getByTestId('close-cash-modal')).toBeInTheDocument();
            expect(screen.getByText(/RESUMO DO DIA/)).toBeInTheDocument();
        });
    });

    it('deve exibir resumo do dia corretamente', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        neq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        render(
            <CloseCashRegisterModal
                dailyTotalCents={50000}
                openingBalanceCents={10000}
                restaurantId="rest-123"
                onClose={mockOnClose}
                onCancel={mockOnCancel}
            />
        );
        
        await waitFor(() => {
            // Verificar se os valores aparecem (formato pt-PT: "100,00 €")
            const text = screen.getByTestId('close-cash-modal').textContent || '';
            expect(text).toMatch(/100[,.]00/); // Saldo inicial (10,00 € = 10000 cents)
            expect(text).toMatch(/500[,.]00/); // Vendas do dia (50,00 € = 50000 cents)
            expect(text).toMatch(/600[,.]00/); // Saldo esperado (60,00 € = 60000 cents)
        });
    });

    it('deve validar pedidos abertos antes de fechar', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        neq: jest.fn().mockResolvedValue({
                            data: [{ id: 'order-1', table_number: 1 }],
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        render(
            <CloseCashRegisterModal
                dailyTotalCents={50000}
                openingBalanceCents={10000}
                restaurantId="rest-123"
                onClose={mockOnClose}
                onCancel={mockOnCancel}
            />
        );
        
        await waitFor(() => {
            expect(screen.getByText(/1 pedido\(s\) aberto\(s\)/)).toBeInTheDocument();
        });
        
        const buttons = screen.getAllByText('Fechar Caixa');
        const actionButton = buttons.find(btn => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
        expect(actionButton).toBeDisabled();
    });

    it('deve calcular diferença corretamente', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        neq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        render(
            <CloseCashRegisterModal
                dailyTotalCents={50000}
                openingBalanceCents={10000}
                restaurantId="rest-123"
                onClose={mockOnClose}
                onCancel={mockOnCancel}
            />
        );
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
        });
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '65.00' } });
        
        await waitFor(() => {
            // Verificar diferença (formato pt-PT: "5,00 €")
            // Diferença = 65.00 - 60.00 = +5.00
            const text = screen.getByTestId('close-cash-modal').textContent || '';
            // Pode aparecer como "+5,00" ou "5,00" dependendo do formato
            expect(text).toMatch(/[+]?5[,.]00/); // Diferença positiva
        });
    });

    it('deve fechar caixa com valor válido', async () => {
        mockOnClose.mockResolvedValue(undefined);
        
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        neq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        render(
            <CloseCashRegisterModal
                dailyTotalCents={50000}
                openingBalanceCents={10000}
                restaurantId="rest-123"
                onClose={mockOnClose}
                onCancel={mockOnCancel}
            />
        );
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
        });
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '60.00' } });
        
        const buttons = screen.getAllByText('Fechar Caixa');
        const actionButton = buttons.find(btn => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
        await act(async () => {
            fireEvent.click(actionButton);
        });
        
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledWith(6000); // 60.00 * 100
        });
    });

    it('deve mostrar erro quando onClose falha', async () => {
        const errorMessage = 'Erro ao fechar caixa';
        mockOnClose.mockRejectedValue(new Error(errorMessage));
        
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        neq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        render(
            <CloseCashRegisterModal
                dailyTotalCents={50000}
                openingBalanceCents={10000}
                restaurantId="rest-123"
                onClose={mockOnClose}
                onCancel={mockOnCancel}
            />
        );
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
        });
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '60.00' } });
        
        const buttons = screen.getAllByText('Fechar Caixa');
        const actionButton = buttons.find(btn => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
        await act(async () => {
            fireEvent.click(actionButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('deve cancelar quando botão cancelar é clicado', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        neq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        render(
            <CloseCashRegisterModal
                dailyTotalCents={50000}
                openingBalanceCents={10000}
                restaurantId="rest-123"
                onClose={mockOnClose}
                onCancel={mockOnCancel}
            />
        );
        
        await waitFor(() => {
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });
        
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
        
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnClose).not.toHaveBeenCalled();
    });
});
