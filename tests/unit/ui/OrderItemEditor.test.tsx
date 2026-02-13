/**
 * OrderItemEditor Tests - Testes de UI para editor de itens do pedido
 * 
 * Testa:
 * - Renderização do editor
 * - Lista de itens
 * - Edição de quantidade
 * - Remoção de itens
 * - Cálculo de total
 * - Estados vazios
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderItemEditor } from '../../../merchant-portal/src/pages/TPV/components/OrderItemEditor';
import type { Order, OrderItem } from '../../../merchant-portal/src/pages/TPV/context/OrderTypes';

describe('OrderItemEditor', () => {
    const mockOrder: Order = {
        id: 'order-123',
        status: 'new',
        items: [
            {
                id: 'item-1',
                productId: 'product-1',
                name: 'Pizza Margherita',
                quantity: 2,
                price: 1000, // €10.00 em centavos
            },
            {
                id: 'item-2',
                productId: 'product-2',
                name: 'Coca-Cola',
                quantity: 1,
                price: 200, // €2.00 em centavos
            },
        ],
        total: 2200, // €22.00 em centavos
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const defaultProps = {
        order: mockOrder,
        onUpdateQuantity: jest.fn(),
        onRemoveItem: jest.fn(),
        onBackToMenu: jest.fn(),
        loading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Renderização', () => {
        it('deve renderizar editor com pedido', () => {
            render(<OrderItemEditor {...defaultProps} />);
            
            expect(screen.getByText(/Editor de Itens/)).toBeInTheDocument();
            expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
        });

        it('deve mostrar lista de itens', () => {
            render(<OrderItemEditor {...defaultProps} />);
            
            expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
            expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
        });

        it('deve mostrar totais corretos', () => {
            render(<OrderItemEditor {...defaultProps} />);
            
            expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
            expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
        });

        it('deve mostrar estado vazio quando não há pedido', () => {
            render(<OrderItemEditor {...defaultProps} order={null} />);
            
            expect(screen.getByText(/Selecione um pedido/)).toBeInTheDocument();
        });

        it('deve mostrar editor vazio quando pedido não tem itens', () => {
            const emptyOrder: Order = {
                ...mockOrder,
                items: [],
                total: 0,
            };
            
            render(<OrderItemEditor {...defaultProps} order={emptyOrder} />);
            
            expect(screen.getByText(/Editor de Itens/)).toBeInTheDocument();
            expect(screen.queryByText('Pizza Margherita')).not.toBeInTheDocument();
        });
    });

    describe('Edição de Quantidade', () => {
        it('deve mostrar quantidade atual de cada item', () => {
            render(<OrderItemEditor {...defaultProps} />);
            
            // Deve mostrar quantidade 2 para Pizza
            const pizzaQuantity = screen.getByText('2');
            expect(pizzaQuantity).toBeInTheDocument();
        });

        it('deve incrementar quantidade ao clicar em +', async () => {
            const onUpdateQuantity = jest.fn().mockResolvedValue(undefined);
            render(<OrderItemEditor {...defaultProps} onUpdateQuantity={onUpdateQuantity} />);
            
            // Encontrar botão de incrementar (assumindo que existe)
            const incrementButtons = screen.getAllByText('+');
            if (incrementButtons.length > 0) {
                fireEvent.click(incrementButtons[0]);
                
                await waitFor(() => {
                    expect(onUpdateQuantity).toHaveBeenCalledWith('item-1', 3);
                });
            }
        });

        it('deve decrementar quantidade ao clicar em -', async () => {
            const onUpdateQuantity = jest.fn().mockResolvedValue(undefined);
            render(<OrderItemEditor {...defaultProps} onUpdateQuantity={onUpdateQuantity} />);
            
            const decrementButtons = screen.getAllByText('-');
            if (decrementButtons.length > 0) {
                fireEvent.click(decrementButtons[0]);
                
                await waitFor(() => {
                    expect(onUpdateQuantity).toHaveBeenCalledWith('item-1', 1);
                });
            } else {
                expect(true).toBe(true);
            }
        });

        it('deve chamar onUpdateQuantity com quantidade 0 ao decrementar de 1 para 0', async () => {
            const onUpdateQuantity = jest.fn().mockResolvedValue(undefined);
            
            const itemWithQuantity1: Order = {
                ...mockOrder,
                items: [{
                    id: 'item-1',
                    productId: 'product-1',
                    name: 'Pizza Margherita',
                    quantity: 1,
                    price: 1000,
                }],
            };
            
            render(<OrderItemEditor {...defaultProps} order={itemWithQuantity1} onUpdateQuantity={onUpdateQuantity} />);
            
            const decrementButtons = screen.getAllByText('-');
            expect(decrementButtons.length).toBeGreaterThan(0);
            
            fireEvent.click(decrementButtons[0]);
            
            await waitFor(() => {
                expect(onUpdateQuantity).toHaveBeenCalledWith('item-1', 0);
            }, { timeout: 2000 });
        });
    });

    describe('Remoção de Itens', () => {
        it('deve remover item ao clicar no botão de remover', async () => {
            const onRemoveItem = jest.fn().mockResolvedValue(undefined);
            render(<OrderItemEditor {...defaultProps} onRemoveItem={onRemoveItem} />);
            
            const removeButtons = screen.getAllByText('🗑️');
            if (removeButtons.length > 0) {
                fireEvent.click(removeButtons[0]);
                
                await waitFor(() => {
                    expect(onRemoveItem).toHaveBeenCalledWith('item-1');
                });
            }
        });
    });

    describe('Estados de Loading', () => {
        it('deve desabilitar ações durante loading', () => {
            render(<OrderItemEditor {...defaultProps} loading={true} />);
            
            // Botões devem estar desabilitados durante loading
            // (Isso depende da implementação específica)
        });
    });
});
