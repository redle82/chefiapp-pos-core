/**
 * IncomingRequests Tests - Testes de UI para pedidos externos recebidos
 * 
 * Testa:
 * - Renderização quando há pedidos pendentes
 * - Não renderização quando não há pedidos
 * - Aceitar pedido
 * - Recusar pedido
 * - Estados de processamento
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IncomingRequests } from '../../../merchant-portal/src/pages/TPV/components/IncomingRequests';

// Mock supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(),
        channel: jest.fn(() => ({
            on: jest.fn(() => ({
                subscribe: jest.fn(() => ({})),
            })),
        })),
        removeChannel: jest.fn(),
    },
}));

// Mock OrderProcessingService
jest.mock('../../../merchant-portal/src/core/services/OrderProcessingService', () => ({
    OrderProcessingService: {
        acceptRequest: jest.fn(),
        rejectRequest: jest.fn(),
    },
}));

// Import after mocks
import { supabase } from '../../../merchant-portal/src/core/supabase';
import { OrderProcessingService } from '../../../merchant-portal/src/core/services/OrderProcessingService';

const mockAcceptRequest = OrderProcessingService.acceptRequest as jest.MockedFunction<typeof OrderProcessingService.acceptRequest>;
const mockRejectRequest = OrderProcessingService.rejectRequest as jest.MockedFunction<typeof OrderProcessingService.rejectRequest>;

describe('IncomingRequests', () => {
    const mockOnOrderAccepted = jest.fn();

    const mockRequests = [
        {
            id: 'req-1',
            customer_contact: { name: 'João Silva', phone: '+351912345678' },
            items: [
                { name: 'Pizza Margherita', quantity: 2 },
                { name: 'Coca-Cola', quantity: 1 },
            ],
            total_cents: 2500,
            created_at: new Date().toISOString(),
            status: 'PENDING',
        },
        {
            id: 'req-2',
            customer_contact: { name: 'Maria Santos' },
            items: [
                { name: 'Hambúrguer', quantity: 1 },
            ],
            total_cents: 1200,
            created_at: new Date().toISOString(),
            status: 'PENDING',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockOnOrderAccepted.mockClear();
        mockAcceptRequest.mockClear();
        mockRejectRequest.mockClear();
        
        // Mock window.confirm
        window.confirm = jest.fn(() => true);
    });

    it('não deve renderizar quando não há pedidos', async () => {
        (supabase.from as jest.Mock)
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'rest-123' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

        const { container } = render(
            <IncomingRequests restaurantId="rest-123" onOrderAccepted={mockOnOrderAccepted} />
        );
        
        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        }, { timeout: 3000 });
    });

    it('deve renderizar quando há pedidos pendentes', async () => {
        // Mock para resolver tenant ID
        const mockFrom = jest.fn();
        (supabase.from as jest.Mock) = mockFrom;
        
        mockFrom
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'rest-123' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: mockRequests,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

        render(
            <IncomingRequests restaurantId="rest-123" onOrderAccepted={mockOnOrderAccepted} />
        );
        
        await waitFor(() => {
            expect(screen.getByText(/COZINHA/)).toBeInTheDocument();
        }, { timeout: 5000 });
        
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    it('deve aceitar pedido quando botão ACEITAR é clicado', async () => {
        mockAcceptRequest.mockResolvedValue('order-123');
        
        (supabase.from as jest.Mock)
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'rest-123' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [mockRequests[0]],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

        render(
            <IncomingRequests restaurantId="rest-123" onOrderAccepted={mockOnOrderAccepted} />
        );
        
        await waitFor(() => {
            expect(screen.getByText('João Silva')).toBeInTheDocument();
        }, { timeout: 3000 });
        
        const acceptButtons = screen.getAllByText('ACEITAR');
        expect(acceptButtons.length).toBeGreaterThan(0);
        const acceptButton = acceptButtons[0];
        await act(async () => {
            fireEvent.click(acceptButton);
        });
        
        await waitFor(() => {
            expect(mockAcceptRequest).toHaveBeenCalledWith('req-1', 'rest-123');
            expect(mockOnOrderAccepted).toHaveBeenCalledTimes(1);
        });
    });

    it('deve recusar pedido quando botão recusar é clicado', async () => {
        mockRejectRequest.mockResolvedValue(undefined);
        
        (supabase.from as jest.Mock)
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'rest-123' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [mockRequests[0]],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

        render(
            <IncomingRequests restaurantId="rest-123" onOrderAccepted={mockOnOrderAccepted} />
        );
        
        await waitFor(() => {
            expect(screen.getByText('João Silva')).toBeInTheDocument();
        }, { timeout: 3000 });
        
        const rejectButtons = screen.getAllByText('XXX');
        expect(rejectButtons.length).toBeGreaterThan(0);
        const rejectButton = rejectButtons[0];
        await act(async () => {
            fireEvent.click(rejectButton);
        });
        
        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledWith('Recusar pedido?');
            expect(mockRejectRequest).toHaveBeenCalledWith('req-1');
        });
    });

    it('deve mostrar estado de processamento durante aceitar', async () => {
        let resolvePromise: (value: string) => void;
        const promise = new Promise<string>((resolve) => {
            resolvePromise = resolve;
        });
        mockAcceptRequest.mockReturnValue(promise);
        
        (supabase.from as jest.Mock)
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'rest-123' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [mockRequests[0]],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

        render(
            <IncomingRequests restaurantId="rest-123" onOrderAccepted={mockOnOrderAccepted} />
        );
        
        await waitFor(() => {
            expect(screen.getByText('João Silva')).toBeInTheDocument();
        }, { timeout: 3000 });
        
        const acceptButtons = screen.getAllByText('ACEITAR');
        expect(acceptButtons.length).toBeGreaterThan(0);
        const acceptButton = acceptButtons[0];
        await act(async () => {
            fireEvent.click(acceptButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText('...')).toBeInTheDocument();
        });
        
        expect(acceptButton).toBeDisabled();
        
        resolvePromise!('order-123');
        await promise;
    });

    it('deve exibir informações do pedido corretamente', async () => {
        (supabase.from as jest.Mock)
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'rest-123' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [mockRequests[0]],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

        render(
            <IncomingRequests restaurantId="rest-123" onOrderAccepted={mockOnOrderAccepted} />
        );
        
        await waitFor(() => {
            expect(screen.getByText('João Silva')).toBeInTheDocument();
            expect(screen.getByText(/2x Pizza Margherita/)).toBeInTheDocument();
            expect(screen.getByText(/1x Coca-Cola/)).toBeInTheDocument();
            expect(screen.getByText(/25,00 €/)).toBeInTheDocument();
        });
    });
});
