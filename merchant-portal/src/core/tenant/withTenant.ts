/**
 * 🛡️ withTenant — Tenant Isolation Wrapper (Phase 4)
 * 
 * SOVEREIGNTY: Este wrapper GARANTE que toda query seja tenant-scoped.
 * 
 * Uso:
 * ```typescript
 * // ❌ PROIBIDO (query sem tenant)
 * const { data } = await supabase
 *     .from('orders')
 *     .select('*');
 * 
 * // ✅ CORRETO (query com tenant)
 * const { data } = await withTenant(
 *     supabase.from('orders').select('*'),
 *     tenantId
 * );
 * ```
 * 
 * ⚠️ REGRAS IMUTÁVEIS:
 * - TODA query em tabelas de negócio DEVE usar withTenant()
 * - Exceções: tabelas globais (profiles, system_config)
 * - ESLint rule "tenant/require-isolation" valida uso
 */

// ============================================================================
// TYPES
// ============================================================================

// Use generic type for query builder
type QueryBuilder<T> = {
    eq: (column: string, value: string) => QueryBuilder<T>;
    then: <R>(onFulfilled?: (value: T) => R) => Promise<R>;
};

// ============================================================================
// WRAPPER
// ============================================================================

/**
 * Add tenant isolation to a Supabase query
 * 
 * @param query - Supabase query builder
 * @param tenantId - Current tenant ID
 * @param column - Column name for tenant filter (default: 'restaurant_id')
 * @returns Query with tenant filter applied
 * 
 * @example
 * ```typescript
 * const { tenantId } = useTenant();
 * 
 * // Simple usage
 * const { data: orders } = await withTenant(
 *     supabase.from('orders').select('*'),
 *     tenantId
 * );
 * 
 * // With additional filters
 * const { data: activeOrders } = await withTenant(
 *     supabase.from('orders').select('*').eq('status', 'active'),
 *     tenantId
 * );
 * 
 * // Custom column name
 * const { data: logs } = await withTenant(
 *     supabase.from('audit_logs').select('*'),
 *     tenantId,
 *     'tenant_id'
 * );
 * ```
 */
export function withTenant<T>(
    query: QueryBuilder<T>,
    tenantId: string | null,
    column: string = 'restaurant_id'
): QueryBuilder<T> {
    if (!tenantId) {
        console.error('[withTenant] ❌ CRITICAL: Query attempted without tenantId');
        // In development, throw error to catch early
        if (import.meta.env.DEV) {
            throw new Error('[withTenant] Query attempted without tenantId. This is a security violation.');
        }
        // In production, add impossible filter to return no data
        return query.eq(column, '00000000-0000-0000-0000-000000000000') as QueryBuilder<T>;
    }

    return query.eq(column, tenantId) as QueryBuilder<T>;
}

// ============================================================================
// TYPED HELPERS
// ============================================================================

/**
 * Create a tenant-scoped insert helper
 */
export function withTenantInsert<T extends Record<string, unknown>>(
    data: T | T[],
    tenantId: string | null,
    column: string = 'restaurant_id'
): (T & Record<string, string>)[] {
    if (!tenantId) {
        console.error('[withTenantInsert] ❌ CRITICAL: Insert attempted without tenantId');
        if (import.meta.env.DEV) {
            throw new Error('[withTenantInsert] Insert attempted without tenantId. This is a security violation.');
        }
        return [];
    }

    const items = Array.isArray(data) ? data : [data];
    return items.map(item => ({
        ...item,
        [column]: tenantId
    })) as (T & Record<string, string>)[];
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Assert tenant ID is present (for guards)
 */
export function assertTenant(tenantId: string | null, context: string): asserts tenantId is string {
    if (!tenantId) {
        throw new Error(`[assertTenant] Missing tenantId in context: ${context}`);
    }
}

/**
 * Check if a table requires tenant isolation
 * 
 * Tables that DO NOT require tenant isolation:
 * - profiles (user-level)
 * - system_config (global)
 * - audit_logs (cross-tenant for admins)
 */
export function requiresTenantIsolation(tableName: string): boolean {
    const GLOBAL_TABLES = [
        'profiles',
        'system_config',
        'feature_flags',
        'app_versions',
    ];
    
    return !GLOBAL_TABLES.includes(tableName);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default withTenant;
