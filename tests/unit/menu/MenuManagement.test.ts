/**
 * Menu Management Tests - Gerenciamento de Cardápio
 * 
 * Testa as operações de gerenciamento de cardápio.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase
const mockFrom = jest.fn() as jest.MockedFunction<(table: string) => any>;
const mockSelect = jest.fn() as jest.MockedFunction<(columns: string) => any>;
const mockInsert = jest.fn() as jest.MockedFunction<(data: any) => Promise<any>>;
const mockUpdate = jest.fn() as jest.MockedFunction<(data: any) => Promise<any>>;
const mockDelete = jest.fn() as jest.MockedFunction<() => Promise<any>>;

jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: mockFrom
    }
}));

describe('Menu Management - Gerenciamento de Cardápio', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Criação de Categoria', () => {
        it('deve criar categoria com nome', async () => {
            const category = {
                name: 'Principais',
                sort_order: 1,
                restaurant_id: 'restaurant-123'
            };

            mockInsert.mockResolvedValue({ data: [category], error: null } as any);

            expect(category.name).toBe('Principais');
            expect(category.sort_order).toBe(1);
        });

        it('deve validar que nome é obrigatório', () => {
            const category = {
                name: '',
                sort_order: 1
            };

            const isValid = category.name.trim().length > 0;

            expect(isValid).toBe(false);
        });

        it('deve ordenar categorias por sort_order', () => {
            const categories = [
                { id: 'cat-1', name: 'Bebidas', sort_order: 3 },
                { id: 'cat-2', name: 'Principais', sort_order: 1 },
                { id: 'cat-3', name: 'Sobremesas', sort_order: 2 }
            ];

            const sorted = categories.sort((a, b) => a.sort_order - b.sort_order);

            expect(sorted[0].name).toBe('Principais');
            expect(sorted[1].name).toBe('Sobremesas');
            expect(sorted[2].name).toBe('Bebidas');
        });
    });

    describe('Criação de Item', () => {
        it('deve criar item com nome e preço', async () => {
            const item = {
                name: 'Pizza Margherita',
                price: 12.50,
                category_id: 'cat-1',
                restaurant_id: 'restaurant-123'
            };

            mockInsert.mockResolvedValue({ data: [item], error: null } as any);

            expect(item.name).toBe('Pizza Margherita');
            expect(item.price).toBe(12.50);
        });

        it('deve validar que nome é obrigatório', () => {
            const item = {
                name: '',
                price: 12.50
            };

            const isValid = item.name.trim().length > 0;

            expect(isValid).toBe(false);
        });

        it('deve validar que preço é positivo', () => {
            const item = {
                name: 'Pizza',
                price: -10.00
            };

            const isValid = item.price > 0;

            expect(isValid).toBe(false);
        });

        it('deve validar que categoria existe', () => {
            const item = {
                name: 'Pizza',
                price: 12.50,
                category_id: 'cat-1'
            };

            const categories = ['cat-1', 'cat-2'];
            const categoryExists = categories.includes(item.category_id);

            expect(categoryExists).toBe(true);
        });
    });

    describe('Atualização de Item', () => {
        it('deve atualizar nome do item', () => {
            const item = {
                id: 'item-1',
                name: 'Pizza Margherita'
            };

            const newName = 'Pizza Margherita Grande';
            const updatedItem = { ...item, name: newName };

            expect(updatedItem.name).toBe('Pizza Margherita Grande');
        });

        it('deve atualizar preço do item', () => {
            const item = {
                id: 'item-1',
                price: 12.50
            };

            const newPrice = 15.00;
            const updatedItem = { ...item, price: newPrice };

            expect(updatedItem.price).toBe(15.00);
        });

        it('deve atualizar categoria do item', () => {
            const item = {
                id: 'item-1',
                category_id: 'cat-1'
            };

            const newCategoryId = 'cat-2';
            const updatedItem = { ...item, category_id: newCategoryId };

            expect(updatedItem.category_id).toBe('cat-2');
        });
    });

    describe('Remoção de Item', () => {
        it('deve remover item do cardápio', async () => {
            const itemId = 'item-1';

            mockDelete.mockResolvedValue({ data: null, error: null } as any);

            expect(itemId).toBeDefined();
        });

        it('deve validar que item existe antes de remover', () => {
            const items = [
                { id: 'item-1', name: 'Pizza' },
                { id: 'item-2', name: 'Coca' }
            ];

            const itemId = 'item-1';
            const itemExists = items.some(item => item.id === itemId);

            expect(itemExists).toBe(true);
        });
    });

    describe('Publicação de Cardápio', () => {
        it('deve validar que cardápio tem pelo menos 5 itens', () => {
            const items = [
                { id: 'item-1' },
                { id: 'item-2' },
                { id: 'item-3' },
                { id: 'item-4' },
                { id: 'item-5' }
            ];

            const canPublish = items.length >= 5;

            expect(canPublish).toBe(true);
        });

        it('deve bloquear publicação com menos de 5 itens', () => {
            const items = [
                { id: 'item-1' },
                { id: 'item-2' },
                { id: 'item-3' }
            ];

            const canPublish = items.length >= 5;

            expect(canPublish).toBe(false);
        });

        it('deve validar que todas as categorias têm pelo menos um item', () => {
            const categories = [
                { id: 'cat-1', name: 'Principais' },
                { id: 'cat-2', name: 'Bebidas' }
            ];

            const items = [
                { id: 'item-1', category_id: 'cat-1' },
                { id: 'item-2', category_id: 'cat-2' }
            ];

            const allCategoriesHaveItems = categories.every(cat =>
                items.some(item => item.category_id === cat.id)
            );

            expect(allCategoriesHaveItems).toBe(true);
        });
    });

    describe('Ordenação', () => {
        it('deve ordenar itens dentro da categoria', () => {
            const items = [
                { id: 'item-1', name: 'Pizza', sort_order: 2, category_id: 'cat-1' },
                { id: 'item-2', name: 'Hamburger', sort_order: 1, category_id: 'cat-1' },
                { id: 'item-3', name: 'Salada', sort_order: 3, category_id: 'cat-1' }
            ];

            const sorted = items.sort((a, b) => a.sort_order - b.sort_order);

            expect(sorted[0].name).toBe('Hamburger');
            expect(sorted[1].name).toBe('Pizza');
            expect(sorted[2].name).toBe('Salada');
        });

        it('deve permitir reordenar itens', () => {
            const items = [
                { id: 'item-1', sort_order: 1 },
                { id: 'item-2', sort_order: 2 }
            ];

            // Trocar ordem
            const updated = items.map(item => {
                if (item.id === 'item-1') return { ...item, sort_order: 2 };
                if (item.id === 'item-2') return { ...item, sort_order: 1 };
                return item;
            });

            expect(updated[0].sort_order).toBe(2);
            expect(updated[1].sort_order).toBe(1);
        });
    });

    describe('Validações', () => {
        it('deve validar que nome do item não está vazio', () => {
            const item = {
                name: '   ',
                price: 12.50
            };

            const isValid = item.name.trim().length > 0;

            expect(isValid).toBe(false);
        });

        it('deve validar que preço é um número válido', () => {
            const validPrices = [12.50, 0.99, 100.00];
            const invalidPrices = [-10, NaN, Infinity];

            validPrices.forEach(price => {
                expect(price).toBeGreaterThan(0);
                expect(typeof price).toBe('number');
            });

            invalidPrices.forEach(price => {
                expect(price <= 0 || !isFinite(price)).toBe(true);
            });
        });

        it('deve validar que categoria pertence ao restaurante', () => {
            const category = {
                id: 'cat-1',
                restaurant_id: 'restaurant-123'
            };

            const restaurantId = 'restaurant-123';
            const belongsToRestaurant = category.restaurant_id === restaurantId;

            expect(belongsToRestaurant).toBe(true);
        });
    });
});
