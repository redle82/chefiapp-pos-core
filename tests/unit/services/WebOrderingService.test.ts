/**
 * WebOrderingService Tests - Testes para serviço de pedidos web
 * 
 * Testa:
 * - Submissão de pedidos web
 * - Retry com exponential backoff
 * - Auto-accept vs manual approval
 * - Progress callbacks
 * - Tratamento de erros
 */

import { WebOrderingService } from '../../../merchant-portal/src/core/services/WebOrderingService';

// Mock supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(),
        rpc: jest.fn(),
    },
}));

// Mock OrderProtection
jest.mock('../../../merchant-portal/src/core/services/OrderProtection', () => ({
    checkOrderProtection: jest.fn(),
    recordOrderSubmission: jest.fn(),
}));

import { supabase } from '../../../merchant-portal/src/core/supabase';
import { checkOrderProtection, recordOrderSubmission } from '../../../merchant-portal/src/core/services/OrderProtection';

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;
const mockRpc = supabase.rpc as jest.MockedFunction<typeof supabase.rpc>;
const mockCheckOrderProtection = checkOrderProtection as jest.MockedFunction<typeof checkOrderProtection>;
const mockRecordOrderSubmission = recordOrderSubmission as jest.MockedFunction<typeof recordOrderSubmission>;

describe('WebOrderingService', () => {
    const mockRestaurantId = 'rest-123';
    const mockOrder = {
        restaurant_id: mockRestaurantId,
        items: [
            { product_id: 'prod-1', name: 'Pizza', quantity: 2, price_cents: 2500 },
        ],
        customer_name: 'João Silva',
        customer_phone: '+351912345678',
        table_number: 5,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCheckOrderProtection.mockReturnValue({ allowed: true });
    });

    it('deve submeter pedido com sucesso quando auto-accept está ativo', async () => {
        // Mock restaurant config
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { auto_accept_web_orders: true },
                        error: null,
                    }),
                }),
            }),
        } as any);

        // Mock order creation
        mockFrom.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'order-123' },
                        error: null,
                    }),
                }),
            }),
        } as any);

        const progressCallback = jest.fn();
        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(true);
        expect(result.order_id).toBe('order-123');
        expect(progressCallback).toHaveBeenCalled();
    });

    it('deve criar request quando auto-accept está desativado', async () => {
        // Mock restaurant config
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { auto_accept_web_orders: false },
                        error: null,
                    }),
                }),
            }),
        } as any);

        // Mock request creation
        mockFrom.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'req-123' },
                        error: null,
                    }),
                }),
            }),
        } as any);

        const progressCallback = jest.fn();
        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(true);
        expect(result.request_id).toBe('req-123');
    });

    it('deve bloquear pedido quando proteção detecta duplicata', async () => {
        mockCheckOrderProtection.mockReturnValue({
            allowed: false,
            reason: 'DUPLICATE',
        });

        const progressCallback = jest.fn();
        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(false);
        expect(result.message).toContain('duplicado');
    });

    it('deve retentar em caso de falha de rede', async () => {
        // Mock restaurant config
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn()
                        .mockRejectedValueOnce(new Error('Network error'))
                        .mockResolvedValueOnce({
                            data: { auto_accept_web_orders: true },
                            error: null,
                        }),
                }),
            }),
        } as any);

        // Mock order creation (sucesso no retry)
        mockFrom.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'order-123' },
                        error: null,
                    }),
                }),
            }),
        } as any);

        const progressCallback = jest.fn();
        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(true);
        expect(progressCallback).toHaveBeenCalledWith(
            expect.objectContaining({ phase: 'RETRYING' })
        );
    });

    it('deve chamar recordOrderSubmission após sucesso', async () => {
        // Mock restaurant config
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { auto_accept_web_orders: true },
                        error: null,
                    }),
                }),
            }),
        } as any);

        // Mock order creation
        mockFrom.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'order-123' },
                        error: null,
                    }),
                }),
            }),
        } as any);

        await WebOrderingService.submitOrder(mockOrder);

        expect(mockRecordOrderSubmission).toHaveBeenCalled();
    });

    it('deve reportar fase UNCERTAIN quando timeout', async () => {
        // Mock que sempre falha
        mockFrom.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockRejectedValue(new Error('Timeout')),
                }),
            }),
        } as any);

        const progressCallback = jest.fn();
        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(false);
        expect(progressCallback).toHaveBeenCalledWith(
            expect.objectContaining({ phase: 'UNCERTAIN' })
        );
    });
});
