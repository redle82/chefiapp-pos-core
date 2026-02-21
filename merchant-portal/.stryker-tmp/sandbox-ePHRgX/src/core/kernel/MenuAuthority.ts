// @ts-nocheck
import { DbWriteGate } from '../governance/DbWriteGate';

/**
 * MENU AUTHORITY
 * 
 * Infrastructure Authority for Menu Structure (Non-Event-Sourced).
 * 
 * Responsibilities:
 * - Category Management (Create, Update, Reorder)
 * - Menu Availability Rules (Dayparts, Seasons)
 * 
 * NOTE:
 * MenuAuthority is NOT Event-Sourced by design.
 * Structural state only.
 * May be promoted to Kernel in future versions.
 */
export class MenuAuthority {

    /**
     * Creates a new Menu Category.
     * Enforced by DbWriteGate.
     */
    static async createCategory(tenantId: string, name: string, sortOrder: number) {
        if (!tenantId) throw new Error('MenuAuthority: Tenant ID required for category creation.');
        if (!name) throw new Error('MenuAuthority: Category name is required.');

        // 1. Structural Validation
        // (Could check for duplicates here if we had a read repo, but DB constraint handles it uniquely per tenant usually)

        // 2. Execution (via Gate)
        const { data, error } = await DbWriteGate.insert(
            'MenuAuthority',
            'gm_menu_categories',
            {
                restaurant_id: tenantId,
                name: name.trim(),
                sort_order: sortOrder
            },
            { tenantId }
        );

        if (error) {
            console.error('[MenuAuthority] Failed to create category:', error);
            throw error;
        }

        return data;
    }

    /**
     * Updates an existing Category.
     */
    static async updateCategory(tenantId: string, categoryId: string, updates: { name?: string; sort_order?: number }) {
        if (!tenantId) throw new Error('MenuAuthority: Tenant ID required.');
        if (!categoryId) throw new Error('MenuAuthority: Category ID required.');

        const { data, error } = await DbWriteGate.update(
            'MenuAuthority',
            'gm_menu_categories',
            updates,
            { id: categoryId, restaurant_id: tenantId },
            { tenantId }
        );

        if (error) throw error;
        return data;
    }
}
