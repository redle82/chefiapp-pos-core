/**
 * Recipe Mapping — Product → Inventory Consumption
 * 
 * Maps menu products to inventory item consumption.
 * Used by CoreExecutor to deplete stock when order is created.
 * 
 * @module RecipeMapping
 * @since Phase 11.2 (ORDER→INVENTORY Integration)
 */

export interface IngredientConsumption {
    inventoryItemId: string;  // e.g., 'fresh-mozzarella'
    quantityUsed: number;     // e.g., 100 (grams)
    unit: 'g' | 'ml' | 'units';
}

export interface ProductRecipe {
    productId: string;        // e.g., 'pizza-margherita'
    productName: string;      // Human-readable name
    ingredients: IngredientConsumption[];
}

/**
 * SOFIA GASTROBAR — Example Recipes
 * In a real app, this would come from a database.
 */
export const RECIPE_DATABASE: ProductRecipe[] = [
    {
        productId: 'pizza-margherita',
        productName: 'Pizza Margherita',
        ingredients: [
            { inventoryItemId: 'base-pizza-artesanal', quantityUsed: 1, unit: 'units' },
            { inventoryItemId: 'fresh-mozzarella', quantityUsed: 100, unit: 'g' },
            { inventoryItemId: 'molho-tomate-casa', quantityUsed: 50, unit: 'ml' },
            { inventoryItemId: 'azeite-extra-virgem', quantityUsed: 10, unit: 'ml' },
        ]
    },
    {
        productId: 'pizza-pepperoni',
        productName: 'Pizza Pepperoni',
        ingredients: [
            { inventoryItemId: 'base-pizza-artesanal', quantityUsed: 1, unit: 'units' },
            { inventoryItemId: 'fresh-mozzarella', quantityUsed: 120, unit: 'g' },
            { inventoryItemId: 'molho-tomate-casa', quantityUsed: 50, unit: 'ml' },
            { inventoryItemId: 'pepperoni-fatiado', quantityUsed: 80, unit: 'g' },
        ]
    },
    {
        productId: 'pizza-quattro-formaggi',
        productName: 'Pizza Quattro Formaggi',
        ingredients: [
            { inventoryItemId: 'base-pizza-artesanal', quantityUsed: 1, unit: 'units' },
            { inventoryItemId: 'fresh-mozzarella', quantityUsed: 80, unit: 'g' },
            { inventoryItemId: 'gorgonzola', quantityUsed: 50, unit: 'g' },
            { inventoryItemId: 'parmesao', quantityUsed: 40, unit: 'g' },
            { inventoryItemId: 'molho-tomate-casa', quantityUsed: 50, unit: 'ml' },
        ]
    },
    {
        productId: 'super-bock-draft',
        productName: 'Super Bock (Pint)',
        ingredients: [
            { inventoryItemId: 'keg-super-bock', quantityUsed: 500, unit: 'ml' }, // Imperial Pint approx
        ]
    },
    {
        productId: 'coca-cola',
        productName: 'Coca-Cola',
        ingredients: [
            { inventoryItemId: 'coca-cola-can', quantityUsed: 1, unit: 'units' },
        ]
    },
    {
        productId: 'agua-gas',
        productName: 'Água com Gás',
        ingredients: [
            { inventoryItemId: 'agua-gas-bottle', quantityUsed: 1, unit: 'units' },
        ]
    },
    {
        productId: 'bruschetta',
        productName: 'Bruschetta Pomodoro',
        ingredients: [
            { inventoryItemId: 'bread-slice', quantityUsed: 2, unit: 'units' },
            { inventoryItemId: 'tomato-diced', quantityUsed: 80, unit: 'g' },
            { inventoryItemId: 'basil-leaves', quantityUsed: 5, unit: 'units' },
            { inventoryItemId: 'azeite-extra-virgem', quantityUsed: 15, unit: 'ml' },
        ]
    }
];

/**
 * Lookup function
 */
export function getRecipe(productId: string): ProductRecipe | undefined {
    return RECIPE_DATABASE.find(r => r.productId === productId);
}

/**
 * Calculate total consumption for an order
 */
export function calculateOrderConsumption(
    orderItems: Array<{ productId: string; quantity: number }>
): Map<string, number> {
    const consumption = new Map<string, number>();

    for (const item of orderItems) {
        const recipe = getRecipe(item.productId);

        if (!recipe) {
            console.warn(`[RecipeMapping] No recipe found for product: ${item.productId}`);
            continue;
        }

        for (const ingredient of recipe.ingredients) {
            const current = consumption.get(ingredient.inventoryItemId) || 0;
            consumption.set(
                ingredient.inventoryItemId,
                current + (ingredient.quantityUsed * item.quantity)
            );
        }
    }

    return consumption;
}

/**
 * Validates if all items in an order have recipes
 */
export function validateOrderRecipes(
    orderItems: Array<{ productId: string }>
): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const item of orderItems) {
        if (!getRecipe(item.productId)) {
            missing.push(item.productId);
        }
    }

    return {
        valid: missing.length === 0,
        missing: [...new Set(missing)] // Dedupe
    };
}
