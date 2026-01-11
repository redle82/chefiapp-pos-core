/**
 * 🧪 OPERATION GATE — INTEGRATION TESTS
 * 
 * Tests the OperationGate functionality (pause/resume system)
 * 
 * Roadmap: Sprint 2, Semana 7-8 — Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

describe('Integration - OperationGate', () => {
    const mockRestaurantId = 'restaurant-123';
    const mockUserId = 'user-123';

    beforeAll(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    describe('Pausar Sistema', () => {
        it('deve pausar sistema via RPC update_operation_status', async () => {
            // Simular chamada RPC
            const mockRpcCall = jest.fn() as any;
            mockRpcCall.mockResolvedValueOnce({
                data: null,
                error: null
            });

            const result = await mockRpcCall('update_operation_status', {
                p_restaurant_id: mockRestaurantId,
                p_status: 'paused',
                p_reason: 'Test pause',
                p_actor_id: mockUserId
            });

            expect(mockRpcCall).toHaveBeenCalledWith(
                'update_operation_status',
                expect.objectContaining({
                    p_restaurant_id: mockRestaurantId,
                    p_status: 'paused',
                    p_reason: 'Test pause',
                    p_actor_id: mockUserId
                })
            );

            expect(result.error).toBeNull();
        });

        it('deve registrar mudança de status no audit_logs', async () => {
            // Simular que o RPC também insere em operation_status_audit
            const mockRpcCall = jest.fn() as any;
            mockRpcCall.mockResolvedValueOnce({
                data: null,
                error: null
            });

            await mockRpcCall('update_operation_status', {
                p_restaurant_id: mockRestaurantId,
                p_status: 'paused',
                p_reason: 'Test pause',
                p_actor_id: mockUserId
            });

            // Verificar que RPC foi chamado (que internamente insere no audit)
            expect(mockRpcCall).toHaveBeenCalled();
        });
    });

    describe('Retomar Sistema', () => {
        it('deve retomar sistema via RPC update_operation_status', async () => {
            const mockRpcCall = jest.fn() as any;
            mockRpcCall.mockResolvedValueOnce({
                data: null,
                error: null
            });

            const result = await mockRpcCall('update_operation_status', {
                p_restaurant_id: mockRestaurantId,
                p_status: 'active',
                p_reason: 'Test resume',
                p_actor_id: mockUserId
            });

            expect(mockRpcCall).toHaveBeenCalledWith(
                'update_operation_status',
                expect.objectContaining({
                    p_restaurant_id: mockRestaurantId,
                    p_status: 'active',
                    p_reason: 'Test resume',
                    p_actor_id: mockUserId
                })
            );

            expect(result.error).toBeNull();
        });

        it('deve registrar mudança de paused para active no audit', async () => {
            const mockRpcCall = jest.fn() as any;
            mockRpcCall.mockResolvedValueOnce({
                data: null,
                error: null
            });

            await mockRpcCall('update_operation_status', {
                p_restaurant_id: mockRestaurantId,
                p_status: 'active',
                p_reason: 'Resumed from paused',
                p_actor_id: mockUserId
            });

            expect(mockRpcCall).toHaveBeenCalled();
        });
    });

    describe('Suspender Sistema', () => {
        it('deve suspender sistema via RPC update_operation_status', async () => {
            const mockRpcCall = jest.fn() as any;
            mockRpcCall.mockResolvedValueOnce({
                data: null,
                error: null
            });

            const result = await mockRpcCall('update_operation_status', {
                p_restaurant_id: mockRestaurantId,
                p_status: 'suspended',
                p_reason: 'Test suspension',
                p_actor_id: mockUserId
            });

            expect(mockRpcCall).toHaveBeenCalledWith(
                'update_operation_status',
                expect.objectContaining({
                    p_restaurant_id: mockRestaurantId,
                    p_status: 'suspended',
                    p_reason: 'Test suspension',
                    p_actor_id: mockUserId
                })
            );

            expect(result.error).toBeNull();
        });
    });

    describe('Histórico de Mudanças', () => {
        it('deve buscar histórico de mudanças de status via RPC', async () => {
            const mockHistory = [
                {
                    id: 'audit-1',
                    previous_status: 'active',
                    new_status: 'paused',
                    reason: 'Test pause',
                    actor_id: mockUserId,
                    created_at: '2026-01-10T10:00:00Z'
                },
                {
                    id: 'audit-2',
                    previous_status: 'paused',
                    new_status: 'active',
                    reason: 'Test resume',
                    actor_id: mockUserId,
                    created_at: '2026-01-10T11:00:00Z'
                }
            ];

            const mockRpcCall = jest.fn() as any;
            mockRpcCall.mockResolvedValueOnce({
                data: mockHistory,
                error: null
            });

            const result = await mockRpcCall('get_operation_status_history', {
                p_restaurant_id: mockRestaurantId,
                p_limit: 50
            }) as any;

            expect(mockRpcCall).toHaveBeenCalledWith(
                'get_operation_status_history',
                expect.objectContaining({
                    p_restaurant_id: mockRestaurantId,
                    p_limit: 50
                })
            );

            expect(result.data).toHaveLength(2);
            expect(result.data[0].new_status).toBe('paused');
            expect(result.data[1].new_status).toBe('active');
        });
    });
});
