/**
 * 🏢 Tenant Module — Multi-Tenant Data Isolation (Phase 2 + 4)
 * 
 * Este módulo implementa isolamento de dados por tenant (restaurante).
 * 
 * Exports:
 * - TenantProvider, useTenant, useTenantGuard — Context & Hooks
 * - TenantResolver functions — Resolution logic + API
 * - withTenant, withTenantInsert — Query wrappers
 * - TenantSelector, TenantSelectorPage — UI Components
 * - Unauthorized — Access denied page
 * 
 * Phase 2: TenantResolver core logic (resolve, validateAccess, switchTenant)
 * Phase 4: Data-layer isolation (withTenant, TenantContext)
 */

// Context & Hooks
export { 
    TenantProvider, 
    useTenant, 
    useTenantGuard,
    type TenantMembership,
    type TenantState,
    type TenantContextValue,
} from './TenantContext';

// Resolver (Core Logic + API)
export {
    // Phase 2: Core API Functions
    resolve,
    validateAccess,
    switchTenant,
    getActiveTenant,
    setActiveTenant,
    clearActiveTenant,
    fetchUserMemberships,
    hasPermission,

    // Phase 2: Pure Path Functions
    extractTenantFromPath,
    isLegacyRoute,
    buildTenantPath,
    getBasePathFromLegacy,

    // Phase 2: Permission Matrix
    ROLE_PERMISSIONS,

    // Types
    type TenantContext,
    type TenantRole,
    type TenantResolutionResult,
} from './TenantResolver';

// Query Wrappers
export {
    withTenant,
    withTenantInsert,
    assertTenant,
    requiresTenantIsolation,
} from './withTenant';

// UI Components
export { 
    TenantSelector, 
    TenantSelectorPage,
} from './TenantSelector';

export { Unauthorized } from './Unauthorized';
