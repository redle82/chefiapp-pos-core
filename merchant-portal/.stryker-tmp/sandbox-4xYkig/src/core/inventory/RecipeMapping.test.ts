/**
 * RecipeMapping Tests
 * 
 * Tests product → inventory consumption calculations
 */

import { describe, it, expect } from 'vitest';
import {
    calculateOrderConsumption,
    getRecipe,
    validateOrderRecipes,
    RECIPE_DATABASE
} from './RecipeMapping';

describe('RecipeMapping', () => {

    describe('getRecipe()', () => {
        it('returns recipe for valid product', () => {
            const recipe = getRecipe('pizza-margherita');
            expect(recipe).toBeDefined();
            expect(recipe?.productName).toBe('Pizza Margherita');
        });

        it('returns undefined for invalid product', () => {
            const recipe = getRecipe('invalid-id');
            expect(recipe).toBeUndefined();
        });
    });

    describe('calculateOrderConsumption()', () => {
        it('calculates consumption for single item', () => {
            const items = [{ productId: 'pizza-margherita', quantity: 1 }];
            const consumption = calculateOrderConsumption(items);

            expect(consumption.get('base-pizza-artesanal')).toBe(1);
            expect(consumption.get('fresh-mozzarella')).toBe(100);
            expect(consumption.get('molho-tomate-casa')).toBe(50);
        });

        it('calculates consumption for multiple quantities', () => {
            const items = [{ productId: 'pizza-margherita', quantity: 3 }];
            const consumption = calculateOrderConsumption(items);

            expect(consumption.get('fresh-mozzarella')).toBe(300); // 100 * 3
        });

        it('aggregates same ingredient from different products', () => {
            const items = [
                { productId: 'pizza-margherita', quantity: 1 }, // 100g mozz
                { productId: 'pizza-pepperoni', quantity: 1 }   // 120g mozz
            ];
            const consumption = calculateOrderConsumption(items);

            expect(consumption.get('fresh-mozzarella')).toBe(220); // 100 + 120
            expect(consumption.get('pepperoni-fatiado')).toBe(80);
        });

        it('ignores products without recipes but logs warning', () => {
            const items = [{ productId: 'unknown-product', quantity: 1 }];
            const consumption = calculateOrderConsumption(items);
            expect(consumption.size).toBe(0);
        });
    });

    describe('validateOrderRecipes()', () => {
        it('returns valid for known products', () => {
            const items = [{ productId: 'pizza-margherita' }];
            const result = validateOrderRecipes(items);
            expect(result.valid).toBe(true);
            expect(result.missing).toHaveLength(0);
        });

        it('returns invalid for unknown products', () => {
            const items = [{ productId: 'unknown-product' }];
            const result = validateOrderRecipes(items);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('unknown-product');
        });
    });
});
