/**
 * DashboardService Tests - Testes para serviço de dashboard
 *
 * O serviço está em modo mock/estático (PURE DOCKER / DEV_STABLE):
 * getDailyMetrics retorna dados fixos; getLowStockItems e restockItem idem.
 * Estes testes validam o contrato de retorno e a forma dos dados.
 */

import { DashboardService } from '../../../merchant-portal/src/core/services/DashboardService';
import type { DailyMetrics } from '../../../merchant-portal/src/core/services/DashboardService';

describe('DashboardService', () => {
    const mockRestaurantId = 'rest-123';

    describe('getDailyMetrics', () => {
        it('deve retornar métricas no formato DailyMetrics', async () => {
            const result = await DashboardService.getDailyMetrics(mockRestaurantId);

            expect(result).toMatchObject({
                totalSalesCents: expect.any(Number),
                totalOrders: expect.any(Number),
                avgTicketCents: expect.any(Number),
                totalCostCents: expect.any(Number),
                salesByHour: expect.any(Array),
            });
            expect(Array.isArray(result.salesByHour)).toBe(true);
            result.salesByHour.forEach((row) => {
                expect(row).toHaveProperty('hour');
                expect(row).toHaveProperty('totalCents');
            });
        });

        it('deve retornar valores numéricos consistentes', async () => {
            const result = await DashboardService.getDailyMetrics(mockRestaurantId);

            expect(result.totalSalesCents).toBe(1545000);
            expect(result.totalOrders).toBe(42);
            expect(result.avgTicketCents).toBe(3678);
            expect(result.totalCostCents).toBe(450000);
            expect(result.salesByHour).toHaveLength(3);
            expect(result.salesByHour[0]).toEqual({ hour: 11, totalCents: 120000 });
        });
    });

    describe('getLowStockItems', () => {
        it('deve retornar lista de itens com baixo estoque', async () => {
            const result = await DashboardService.getLowStockItems(mockRestaurantId);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            result.forEach((item) => {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('name');
                expect(item).toHaveProperty('stockLevel');
                expect(item).toHaveProperty('minStockLevel');
            });
        });
    });

    describe('restockItem', () => {
        it('deve retornar true em modo mock', async () => {
            const result = await DashboardService.restockItem('item-1', 10);
            expect(result).toBe(true);
        });
    });
});
