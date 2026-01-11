/**
 * 🧪 ORDERS API — INTEGRATION TESTS
 * 
 * Tests the Orders API endpoints (POST, GET, PATCH /api/orders)
 * 
 * Roadmap: Sprint 2, Semana 7-8 — Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Integration - Orders API', () => {
    const API_BASE = 'http://localhost:4320/api/orders';
    const mockRestaurantId = 'restaurant-123';
    const mockOrderId = 'order-123';

    beforeAll(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/orders - Create Order', () => {
        it('deve criar pedido via API', async () => {
            const orderData = {
                restaurantId: mockRestaurantId,
                items: [
                    { productId: 'product-1', name: 'Pizza', quantity: 1, unitPrice: 1250 },
                    { productId: 'product-2', name: 'Coca', quantity: 2, unitPrice: 300 }
                ],
                paymentMethod: 'cash'
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => ({
                    order_id: mockOrderId,
                    short_id: 'Order #1',
                    state: 'PENDING',
                    total_cents: 1850,
                    items: orderData.items
                })
            });

            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            expect(response.ok).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                API_BASE,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(orderData)
                })
            );

            const result = await response.json() as any;
            expect(result.order_id).toBe(mockOrderId);
            expect(result.total_cents).toBe(1850);
        });

        it('deve retornar erro 400 quando items está vazio', async () => {
            const orderData = {
                restaurantId: mockRestaurantId,
                items: [],
                paymentMethod: 'cash'
            };

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'items array required with at least one item' })
            });

            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/orders/:id - Fetch Order', () => {
        it('deve buscar pedido por ID via API', async () => {
            const orderResponse = {
                order_id: mockOrderId,
                short_id: 'Order #1',
                state: 'PENDING',
                total_cents: 1850,
                items: [
                    { id: 'item-1', product_id: 'product-1', name: 'Pizza', quantity: 1, unit_price: 1250, total_price: 1250 }
                ]
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => orderResponse
            });

            const response = await fetch(`${API_BASE}/${mockOrderId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `${API_BASE}/${mockOrderId}`,
                expect.objectContaining({ method: 'GET' })
            );

            const result = await response.json() as any;
            expect(result.order_id).toBe(mockOrderId);
            expect(result.items).toHaveLength(1);
        });

        it('deve retornar erro 404 quando pedido não existe', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ error: 'Order not found' })
            });

            const response = await fetch(`${API_BASE}/non-existent`, {
                method: 'GET'
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /api/orders/:id - Update Order', () => {
        it('deve atualizar pedido via API', async () => {
            const updateData = {
                items: [
                    { productId: 'product-1', name: 'Pizza', quantity: 2, unitPrice: 1250 },
                    { productId: 'product-2', name: 'Coca', quantity: 2, unitPrice: 300 }
                ]
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    order_id: mockOrderId,
                    short_id: 'Order #1',
                    state: 'PENDING',
                    total_cents: 3100, // (2 * 1250) + (2 * 300)
                    items: updateData.items
                })
            });

            const response = await fetch(`${API_BASE}/${mockOrderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            expect(response.ok).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `${API_BASE}/${mockOrderId}`,
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify(updateData)
                })
            );

            const result = await response.json() as any;
            expect(result.total_cents).toBe(3100);
        });

        it('deve retornar erro 400 quando tenta atualizar pedido não pendente', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Order cannot be updated: status is not pending' })
            });

            const response = await fetch(`${API_BASE}/${mockOrderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [] })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
    });

    describe('PATCH /api/orders/:id/status - Update Order Status', () => {
        it('deve atualizar status do pedido via API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    order_id: mockOrderId,
                    state: 'PREPARING'
                })
            });

            const response = await fetch(`${API_BASE}/${mockOrderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'preparing' })
            });

            expect(response.ok).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                `${API_BASE}/${mockOrderId}/status`,
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'preparing' })
                })
            );

            const result = await response.json() as any;
            expect(result.state).toBe('PREPARING');
        });

        it('deve retornar erro 400 quando status é inválido', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Invalid status' })
            });

            const response = await fetch(`${API_BASE}/${mockOrderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'invalid_status' })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
    });
});
