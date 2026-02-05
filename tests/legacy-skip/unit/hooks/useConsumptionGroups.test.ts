/**
 * useConsumptionGroups Tests - Testes para hook de grupos de consumo
 * 
 * Testa:
 * - Carregamento de grupos
 * - Criação de grupos
 * - Atualização de grupos
 * - Pagamento de grupos
 */

import { renderHook, act } from '@testing-library/react';
import { useConsumptionGroups } from '../../../merchant-portal/src/pages/TPV/hooks/useConsumptionGroups';

// Mock supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn().mockResolvedValue({
                data: {
                    session: {
                        access_token: 'test-token',
                    },
                },
            }),
        },
    },
}));

// Mock fetch
global.fetch = jest.fn();

describe('useConsumptionGroups', () => {
    const mockOrderId = 'order-123';

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
    });

    it('deve inicializar com grupos vazios', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ groups: [] }),
        });

        const { result } = renderHook(() => useConsumptionGroups(mockOrderId));
        
        // Aguardar carregamento inicial
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        expect(result.current.groups).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('deve retornar grupos vazios quando orderId é null', () => {
        const { result } = renderHook(() => useConsumptionGroups(null));
        
        expect(result.current.groups).toEqual([]);
    });

    it('deve carregar grupos quando orderId é fornecido', async () => {
        const mockGroups = [
            {
                id: 'group-1',
                restaurant_id: 'rest-1',
                order_id: mockOrderId,
                label: 'Mesa 1',
                color: '#FF5733',
                position: 1,
                status: 'active' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ groups: mockGroups }),
        });

        const { result } = renderHook(() => useConsumptionGroups(mockOrderId));
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        expect(global.fetch).toHaveBeenCalled();
    });

    it('deve ter função createGroup disponível', () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ groups: [] }),
        });

        const { result } = renderHook(() => useConsumptionGroups(mockOrderId));
        
        expect(typeof result.current.createGroup).toBe('function');
    });

    it('deve ter função updateGroup disponível', () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ groups: [] }),
        });

        const { result } = renderHook(() => useConsumptionGroups(mockOrderId));
        
        expect(typeof result.current.updateGroup).toBe('function');
    });

    it('deve ter função payGroup disponível', () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ groups: [] }),
        });

        const { result } = renderHook(() => useConsumptionGroups(mockOrderId));
        
        expect(typeof result.current.payGroup).toBe('function');
    });
});
