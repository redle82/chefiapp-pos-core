/**
 * DOMAIN WRITE AUTHORITY CONTRACT - REGISTRY
 * 
 * Defines the ALLOWED Transitional Exceptions (Law 2).
 * Any writer not in this registry is blocked in HYBRID mode.
 * In PURE mode, this registry is ignored (ALL writes blocked).
 */

export type AllowedTable =
    | 'gm_cash_registers'
    | 'gm_orders'
    | 'gm_order_items'
    | 'gm_payments'
    | 'gm_products'
    | 'gm_menu_categories'
    | 'gm_restaurant_members'
    | 'gm_diagnostics'
    | 'gm_restaurants';

export type AllowedOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';

interface ExceptionGrant {
    reason: string;
    allowedTables: AllowedTable[];
    allowedOperations: AllowedOperation[];
}

export const EXCEPTION_REGISTRY: Record<string, ExceptionGrant> = {
    'CashRegisterEngine': {
        reason: 'Legacy engine pending full Kernel inversion (Step 11518)',
        allowedTables: ['gm_cash_registers'],
        allowedOperations: ['INSERT', 'UPDATE']
    },
    'OrderContext': {
        reason: 'Legacy TPV State Management (Pending Kernel)',
        allowedTables: ['gm_orders', 'gm_order_items'],
        allowedOperations: ['INSERT', 'UPDATE', 'DELETE', 'UPSERT']
    },
    'MenuState': {
        reason: 'Legacy Menu Management (Pending Kernel)',
        allowedTables: ['gm_products', 'gm_menu_categories'],
        allowedOperations: ['INSERT', 'UPDATE']
    },
    'OnboardingCore': {
        reason: 'Legacy Onboarding Flow',
        allowedTables: ['gm_restaurant_members', 'gm_diagnostics', 'gm_restaurants', 'gm_menu_categories'],
        allowedOperations: ['INSERT', 'UPDATE']
    },
    'ProductContext': {
        reason: 'Legacy Product Creation',
        allowedTables: ['gm_products'],
        allowedOperations: ['INSERT']
    },
    'OrderProcessingService': {
        reason: 'Backend Processing (Legacy)',
        allowedTables: ['gm_orders'],
        allowedOperations: ['DELETE']
    },
    'WebOrderingService': {
        reason: 'Web Order Ingestion (Legacy)',
        allowedTables: ['gm_orders'],
        allowedOperations: ['DELETE']
    },
    'OrderContextReal': {
        reason: 'Real TPV Context (Pending Kernel)',
        allowedTables: ['gm_orders'],
        allowedOperations: ['UPDATE']
    }
};

export const isAuthorized = (
    callerTag: string,
    table: string,
    operation: AllowedOperation
): boolean => {
    const grant = EXCEPTION_REGISTRY[callerTag];
    if (!grant) return false;

    // @ts-ignore - String to type safe check
    return grant.allowedTables.includes(table) && grant.allowedOperations.includes(operation);
};
