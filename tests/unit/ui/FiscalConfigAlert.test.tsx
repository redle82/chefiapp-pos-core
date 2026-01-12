/**
 * FiscalConfigAlert Tests - Testes de UI para alerta de configuração fiscal
 * 
 * Testa:
 * - Renderização quando fiscal não está configurado
 * - Não renderização quando fiscal está configurado
 * - Estado de loading
 * - Clique no botão "Configurar"
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FiscalConfigAlert } from '../../../merchant-portal/src/pages/TPV/components/FiscalConfigAlert';

// Mock supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

// Import after mock to get the mocked version
import { supabase } from '../../../merchant-portal/src/core/supabase';

describe('FiscalConfigAlert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('não deve renderizar quando restaurantId é null', () => {
        const { container } = render(<FiscalConfigAlert restaurantId={null} />);
        
        expect(container.firstChild).toBeNull();
    });

    it('deve renderizar quando fiscal não está configurado', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' },
                    }),
                }),
            }),
        });

        render(<FiscalConfigAlert restaurantId="rest-123" />);
        
        await waitFor(() => {
            expect(screen.getByText(/Fiscal não configurado/)).toBeInTheDocument();
        });
        
        expect(screen.getByText('Configurar')).toBeInTheDocument();
    });

    it('não deve renderizar quando fiscal está configurado', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            fiscal_config: {
                                invoicexpress: {
                                    apiKey: 'test-key',
                                },
                            },
                        },
                        error: null,
                    }),
                }),
            }),
        });

        const { container } = render(<FiscalConfigAlert restaurantId="rest-123" />);
        
        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        });
    });

    it('deve ter botão configurar que pode ser clicado', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' },
                    }),
                }),
            }),
        });

        render(<FiscalConfigAlert restaurantId="rest-123" />);
        
        await waitFor(() => {
            expect(screen.getByText('Configurar')).toBeInTheDocument();
        });

        const button = screen.getByText('Configurar');
        
        // Verificar que o botão existe e pode ser clicado
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
        
        // Simular clique (navegação real é difícil de testar em jsdom)
        fireEvent.click(button);
        
        // Verificar que o botão ainda está presente após o clique
        expect(screen.getByText('Configurar')).toBeInTheDocument();
    });
});
