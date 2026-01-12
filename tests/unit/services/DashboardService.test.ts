/**
 * DashboardService Tests - Testes para serviço de dashboard
 * 
 * Testa:
 * - Busca de métricas diárias
 * - Tratamento de erros
 * - Formatação de dados
 */

import { DashboardService } from '../../../merchant-portal/src/core/services/DashboardService';
import type { DailyMetrics } from '../../../merchant-portal/src/core/services/DashboardService';

// Mock supabase
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        rpc: jest.fn(),
    },
}));

import { supabase } from '../../../merchant-portal/src/core/supabase';

const mockRpc = supabase.rpc as jest.MockedFunction<typeof supabase.rpc>;

describe('DashboardService', () => {
    const mockRestaurantId = 'rest-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve buscar métricas diárias com sucesso', async () => {
        const mockData = {
            total_sales_cents: 50000,
            total_orders: 25,
            avg_ticket_cents: 2000,
            sales_by_hour: [
                { hour: 12, total_cents: 10000 },
                { hour: 13, total_cents: 15000 },
                { hour: 14, total_cents: 25000 },
            ],
        };

        mockRpc.mockResolvedValue({
            data: mockData,
            error: null,
        } as any);

        const result = await DashboardService.getDailyMetrics(mockRestaurantId);

        expect(mockRpc).toHaveBeenCalledWith('get_daily_metrics', {
            p_restaurant_id: mockRestaurantId,
        });

        expect(result).toEqual({
            totalSalesCents: 50000,
            totalOrders: 25,
            avgTicketCents: 2000,
            salesByHour: [
                { hour: 12, totalCents: 10000 },
                { hour: 13, totalCents: 15000 },
                { hour: 14, totalCents: 25000 },
            ],
        });
    });

    it('deve retornar valores padrão quando dados estão vazios', async () => {
        mockRpc.mockResolvedValue({
            data: {},
            error: null,
        } as any);

        const result = await DashboardService.getDailyMetrics(mockRestaurantId);

        expect(result).toEqual({
            totalSalesCents: 0,
            totalOrders: 0,
            avgTicketCents: 0,
            salesByHour: [],
        });
    });

    it('deve lançar erro quando RPC falha', async () => {
        const mockError = {
            message: 'Database error',
            code: 'PGRST301',
        };

        mockRpc.mockResolvedValue({
            data: null,
            error: mockError,
        } as any);

        await expect(DashboardService.getDailyMetrics(mockRestaurantId)).rejects.toThrow(
            'Failed to fetch metrics: Database error'
        );
    });

    it('deve mapear snake_case para camelCase corretamente', async () => {
        const mockData = {
            total_sales_cents: 100000,
            total_orders: 50,
            avg_ticket_cents: 2000,
            sales_by_hour: [
                { hour: 10, total_cents: 5000 },
            ],
        };

        mockRpc.mockResolvedValue({
            data: mockData,
            error: null,
        } as any);

        const result = await DashboardService.getDailyMetrics(mockRestaurantId);

        expect(result.totalSalesCents).toBe(100000);
        expect(result.totalOrders).toBe(50);
        expect(result.avgTicketCents).toBe(2000);
        expect(result.salesByHour[0].totalCents).toBe(5000);
    });
});
