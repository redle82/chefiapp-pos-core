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

// Mock supabase com cadeia completa
const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
};

jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(() => mockSupabaseChain),
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
        // Reset mock chain
        mockSupabaseChain.select.mockReturnThis();
        mockSupabaseChain.eq.mockReturnThis();
        mockSupabaseChain.single.mockResolvedValue({ data: null, error: null });
        mockSupabaseChain.insert.mockReturnThis();
    });

    it('deve submeter pedido com sucesso quando auto-accept está ativo', async () => {
        // Mock restaurant config
        mockSupabaseChain.single
            .mockResolvedValueOnce({
                data: { id: mockRestaurantId, auto_accept_web_orders: true, web_ordering_enabled: true },
                error: null,
            })
            // Mock order creation
            .mockResolvedValueOnce({
                data: { id: 'order-123' },
                error: null,
            });

        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(true);
        expect(result.order_id).toBe('order-123');
        expect(result.status).toBe('ACCEPTED');
    });

    it('deve criar request quando auto-accept está desativado', async () => {
        // Mock restaurant config
        mockSupabaseChain.single
            .mockResolvedValueOnce({
                data: { id: mockRestaurantId, auto_accept_web_orders: false, web_ordering_enabled: true },
                error: null,
            })
            // Mock request creation
            .mockResolvedValueOnce({
                data: { id: 'req-123' },
                error: null,
            });

        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(true);
        expect(result.request_id).toBe('req-123');
        expect(result.status).toBe('PENDING_APPROVAL');
    });

    it('deve bloquear pedido quando proteção detecta duplicata', async () => {
        mockCheckOrderProtection.mockReturnValue({
            allowed: false,
            reason: 'DUPLICATE',
            message: 'Este pedido já foi enviado',
            existingOrderId: 'order-existing',
        });

        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(false);
        expect(result.status).toBe('BLOCKED');
        expect(result.blockReason).toBe('DUPLICATE');
        expect(result.message).toContain('já foi enviado');
    });

    it('deve retentar em caso de falha de rede', async () => {
        // Mock restaurant config - sucesso
        mockSupabaseChain.single
            .mockResolvedValueOnce({
                data: { id: mockRestaurantId, auto_accept_web_orders: true, web_ordering_enabled: true },
                error: null,
            })
            // Primeira tentativa - falha
            .mockRejectedValueOnce(new Error('Network error'))
            // Retry - sucesso
            .mockResolvedValueOnce({
                data: { id: 'order-123' },
                error: null,
            });

        // Usar submitOrderWithRetry diretamente para testar retry
        const progressCallback = jest.fn();
        const result = await WebOrderingService.submitOrderWithRetry(mockOrder, progressCallback);

        // O submitOrderWithRetry deve retentar e ter sucesso
        expect(result.success).toBe(true);
        expect(progressCallback).toHaveBeenCalled();
    });

    it('deve chamar recordOrderSubmission após sucesso', async () => {
        // Mock restaurant config
        mockSupabaseChain.single
            .mockResolvedValueOnce({
                data: { id: mockRestaurantId, auto_accept_web_orders: true, web_ordering_enabled: true },
                error: null,
            })
            // Mock order creation
            .mockResolvedValueOnce({
                data: { id: 'order-123' },
                error: null,
            });

        await WebOrderingService.submitOrder(mockOrder);

        expect(mockRecordOrderSubmission).toHaveBeenCalled();
    });

    it('deve reportar fase UNCERTAIN quando timeout', async () => {
        // Mock que sempre falha
        mockSupabaseChain.single.mockRejectedValue(new Error('Timeout'));

        const result = await WebOrderingService.submitOrder(mockOrder);

        expect(result.success).toBe(false);
        expect(result.status).toBe('UNCERTAIN');
        expect(result.nextAction).toBe('WAIT_AND_CHECK');
    });
});
