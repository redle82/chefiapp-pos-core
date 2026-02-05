/**
 * CashRegisterAlert Tests - Testes de UI para alerta de caixa
 * 
 * Testa:
 * - Renderização quando caixa está fechado
 * - Não renderização quando caixa está aberto
 * - Clique no botão "Abrir Caixa"
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CashRegisterAlert } from '../../../merchant-portal/src/pages/TPV/components/CashRegisterAlert';

describe('CashRegisterAlert', () => {
    const mockOnOpenCash = jest.fn();

    beforeEach(() => {
        mockOnOpenCash.mockClear();
    });

    it('deve renderizar quando caixa está fechado', () => {
        render(<CashRegisterAlert isOpen={false} onOpenCash={mockOnOpenCash} />);
        
        expect(screen.getByText(/Caixa não está aberto/)).toBeInTheDocument();
        expect(screen.getByText('Abrir Caixa')).toBeInTheDocument();
    });

    it('não deve renderizar quando caixa está aberto', () => {
        const { container } = render(<CashRegisterAlert isOpen={true} onOpenCash={mockOnOpenCash} />);
        
        expect(container.firstChild).toBeNull();
    });

    it('deve chamar onOpenCash quando botão é clicado', () => {
        render(<CashRegisterAlert isOpen={false} onOpenCash={mockOnOpenCash} />);
        
        const button = screen.getByText('Abrir Caixa');
        fireEvent.click(button);
        
        expect(mockOnOpenCash).toHaveBeenCalledTimes(1);
    });

    it('deve exibir mensagem de alerta correta', () => {
        render(<CashRegisterAlert isOpen={false} onOpenCash={mockOnOpenCash} />);
        
        expect(screen.getByText(/Caixa não está aberto/)).toBeInTheDocument();
        expect(screen.getByText(/Abra o caixa antes de criar vendas/)).toBeInTheDocument();
    });
});
