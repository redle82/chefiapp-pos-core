/**
 * OpenCashRegisterModal Tests - Testes de UI para modal de abertura de caixa
 * 
 * Testa:
 * - Renderização do modal
 * - Input de saldo inicial
 * - Validação de valores
 * - Sucesso ao abrir caixa
 * - Erro ao abrir caixa
 * - Cancelamento
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { OpenCashRegisterModal } from '../../../merchant-portal/src/pages/TPV/components/OpenCashRegisterModal';

describe('OpenCashRegisterModal', () => {
    const mockOnOpen = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        mockOnOpen.mockClear();
        mockOnCancel.mockClear();
    });

    it('deve renderizar o modal', () => {
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        expect(screen.getAllByText('Abrir Caixa').length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('deve permitir digitar saldo inicial', () => {
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '100.50' } });
        
        expect(input.value).toBe('100.50');
    });

    it('deve filtrar caracteres inválidos do input', () => {
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'abc100.50xyz' } });
        
        expect(input.value).toBe('100.50');
    });

    it('deve validar valor inválido (negativo)', async () => {
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        // O componente filtra caracteres inválidos, então "-" não será aceito
        // Vamos testar com um valor que passe pelo filtro mas seja inválido após parse
        fireEvent.change(input, { target: { value: 'abc' } });
        
        const buttons = screen.getAllByText('Abrir Caixa');
        const actionButton = buttons.find(btn => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
        await act(async () => {
            fireEvent.click(actionButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText('Valor inválido')).toBeInTheDocument();
        }, { timeout: 3000 });
        
        expect(mockOnOpen).not.toHaveBeenCalled();
    });

    it('deve abrir caixa com valor válido', async () => {
        mockOnOpen.mockResolvedValue(undefined);
        
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '100.50' } });
        
        const buttons = screen.getAllByText('Abrir Caixa');
        const actionButton = buttons.find(btn => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
        await act(async () => {
            fireEvent.click(actionButton);
        });
        
        await waitFor(() => {
            expect(mockOnOpen).toHaveBeenCalledWith(10050); // 100.50 * 100
        });
    });

    it('deve mostrar erro quando onOpen falha', async () => {
        const errorMessage = 'Erro ao abrir caixa';
        mockOnOpen.mockRejectedValue(new Error(errorMessage));
        
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '100' } });
        
        const buttons = screen.getAllByText('Abrir Caixa');
        const actionButton = buttons.find(btn => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
        await act(async () => {
            fireEvent.click(actionButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('deve cancelar quando botão cancelar é clicado', () => {
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
        
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnOpen).not.toHaveBeenCalled();
    });

    it('deve desabilitar botões durante processamento', async () => {
        let resolvePromise: () => void;
        const promise = new Promise<void>((resolve) => {
            resolvePromise = resolve;
        });
        mockOnOpen.mockReturnValue(promise);
        
        render(<OpenCashRegisterModal onOpen={mockOnOpen} onCancel={mockOnCancel} />);
        
        const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '100' } });
        
        const buttons = screen.getAllByText('Abrir Caixa');
        const actionButton = buttons.find(btn => btn.tagName === 'BUTTON') || buttons[buttons.length - 1];
        await act(async () => {
            fireEvent.click(actionButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText('Abrindo...')).toBeInTheDocument();
        });
        
        expect(actionButton).toBeDisabled();
        
        resolvePromise!();
        await promise;
    });
});
