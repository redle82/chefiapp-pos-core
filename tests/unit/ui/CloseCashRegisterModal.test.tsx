/**
 * CloseCashRegisterModal Tests - Modal de fechamento de caixa (FASE 2.3)
 *
 * Testa: renderização, totais, input declarado, diferença, submit, cancelar.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CloseCashRegisterModal } from '../../../merchant-portal/src/pages/TPV/components/CloseCashRegisterModal';

describe('CloseCashRegisterModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnDismiss = jest.fn();

  const defaultProps = {
    dailyTotalCents: 50000,
    openingBalanceCents: 10000,
    restaurantId: 'rest-123',
    onClose: mockOnClose,
    onCancel: mockOnCancel,
    onDismiss: mockOnDismiss,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o modal', async () => {
    render(<CloseCashRegisterModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('close-cash-modal')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Fechar caixa/i })).toBeInTheDocument();
    });
  });

  it('deve exibir total esperado (abertura + vendas)', async () => {
    render(<CloseCashRegisterModal {...defaultProps} />);

    await waitFor(() => {
      const text = screen.getByTestId('close-cash-modal').textContent || '';
      expect(text).toMatch(/600[,.]00/);
    });
  });

  it('deve ter input de total declarado com placeholder 0,00', async () => {
    render(<CloseCashRegisterModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument();
    });
  });

  it('deve calcular diferença ao preencher valor', async () => {
    render(<CloseCashRegisterModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('0,00') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '65.00' } });

    await waitFor(() => {
      const text = screen.getByTestId('close-cash-modal').textContent || '';
      expect(text).toMatch(/[+]?5[,.]00|a mais/);
    });
  });

  it('deve fechar caixa com valor válido', async () => {
    mockOnClose.mockResolvedValue(undefined);

    render(<CloseCashRegisterModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('0,00') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '600.00' } });

    const buttons = screen.getAllByText('Fechar caixa');
    const actionButton =
      buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
    await act(async () => {
      fireEvent.click(actionButton!);
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(60000, undefined);
    });
  });

  it('deve cancelar quando botão cancelar é clicado', async () => {
    render(<CloseCashRegisterModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
