/**
 * 🔍 TenantResolver — Core Tenant Resolution Logic (Phase 2)
 * 
 * SOVEREIGNTY: Este módulo é a ÚNICA autoridade para resolução de tenant.
 * 
 * Responsabilidades:
 * 1. Resolver o tenant padrão do usuário
 * 2. Validar acesso a tenant específico
 * 3. Gerenciar tenant ativo (localStorage)
 * 4. Permitir switch entre tenants
 * 
 * ⚠️ REGRAS IMUTÁVEIS:
 * - FlowGate é o único consumidor autorizado
 * - Fail-closed: Sem acesso válido = rejeição
 * - Logs obrigatórios para auditoria
 */

import { supabase } from '../supabase';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../storage/TabIsolatedStorage';

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTIVE_TENANT_KEY = 'chefiapp_active_tenant';
const TENANT_STATUS_KEY = 'chefiapp_tenant_status';

// ============================================================================
// TYPES
// ============================================================================

export type TenantRole = 'owner' | 'admin' | 'manager' | 'staff' | 'waiter' | 'kitchen';

export type TenantStatus = 'UNSELECTED' | 'SELECTING' | 'ACTIVE';

export interface TenantMembership {
    restaurant_id: string;
    restaurant_name?: string;
    role: TenantRole;
}

export interface TenantContext {
    tenantId: string;
    role: TenantRole;
    permissions: string[];
}

export interface TenantResolutionResult {
    type: 'RESOLVED' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'NO_TENANTS' | 'NEEDS_SELECTION';
    tenantId: string | null;
    reason: string;
    context?: TenantContext;
}

// ============================================================================
// PERMISSION MATRIX
// ============================================================================

export const ROLE_PERMISSIONS: Record<TenantRole, string[]> = {
    owner: ['*'], // Full access (wildcard)
    admin: [
        'dashboard:view',
        'menu:view', 'menu:edit',
        'tpv:view', 'tpv:operate',
        'kds:view', 'kds:manage',
        'orders:view', 'orders:create', 'orders:manage',
        'team:view', 'team:manage',
        'reports:view',
        'settings:view', 'settings:edit',
        'billing:view',
    ],
    manager: [
        'dashboard:view',
        'menu:view', 'menu:edit',
        'tpv:view', 'tpv:operate',
        'kds:view',
        'orders:view', 'orders:create', 'orders:manage',
        'team:view',
        'reports:view',
        'settings:view',
    ],
    staff: [
        'tpv:view', 'tpv:operate',
        'orders:view', 'orders:create',
    ],
    waiter: [
        'tpv:view', 'tpv:operate',
        'orders:view', 'orders:create',
        'kds:view',
    ],
    kitchen: [
        'kds:view', 'kds:manage',
        'orders:view',
    ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: TenantRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    // Wildcard check (owner has all)
    if (permissions.includes('*')) return true;

    // Explicit permission check
    return permissions.includes(permission);
}

function getPermissionsForRole(role: TenantRole): string[] {
    return ROLE_PERMISSIONS[role] || [];
}

// ============================================================================
// LOGGING
// ============================================================================

function logTenantEvent(event: string, data: Record<string, unknown>) {
    console.info(`[TenantResolver] ${event}`, {
        timestamp: new Date().toISOString(),
        ...data
    });
}

// ============================================================================
// API LAYER
// ============================================================================

/**
 * Fetch user's tenant memberships from DB
 */
export async function fetchUserMemberships(userId: string): Promise<TenantMembership[]> {
    // MOCK: Bypass for demo-user
    if (userId === 'demo-user') {
        console.info('[TenantResolver] Retrieving mock memberships for demo-user');
        return [{
            restaurant_id: 'mock-tenant-id',
            restaurant_name: 'Demo Restaurant (GoldMonkey)',
            role: 'owner',
        }];
    }

    const { data: members, error } = await supabase
        .from('gm_restaurant_members')
        .select('restaurant_id, role')
        .eq('user_id', userId);

    if (error) {
        console.error('[TenantResolver] Failed to fetch memberships:', error);
        return [];
    }

    if (!members || members.length === 0) {
        return [];
    }

    // Fetch restaurant names
    const restaurantIds = members.map(m => m.restaurant_id);
    const { data: restaurants } = await supabase
        .from('gm_restaurants')
        .select('id, name')
        .in('id', restaurantIds);

    return members.map(m => ({
        restaurant_id: m.restaurant_id,
        restaurant_name: restaurants?.find(r => r.id === m.restaurant_id)?.name || 'Restaurante',
        role: m.role as TenantRole,
    }));
}

// ============================================================================
// CORE RESOLVER
// ============================================================================

/**
 * Resolve tenant for a user
 * 
 * Priority:
 * 1. URL tenantId (if provided and valid)
 * 2. Active tenant from localStorage (if valid)
 * 3. First membership (if single tenant)
 * 4. NEEDS_SELECTION (if multiple tenants)
 */
export async function resolve(
    userId: string,
    urlTenantId?: string | null
): Promise<TenantResolutionResult> {
    const memberships = await fetchUserMemberships(userId);

    // Case 1: No memberships = onboarding needed
    if (memberships.length === 0) {
        logTenantEvent('tenant_resolved', {
            userId,
            result: 'NO_TENANTS',
            reason: 'User has no tenant memberships'
        });
        return {
            type: 'NO_TENANTS',
            tenantId: null,
            reason: 'User has no tenant memberships'
        };
    }

    // Case 2: URL has tenant ID = Validate access
    if (urlTenantId) {
        const membership = memberships.find(m => m.restaurant_id === urlTenantId);

        if (membership) {
            const context: TenantContext = {
                tenantId: urlTenantId,
                role: membership.role,
                permissions: getPermissionsForRole(membership.role),
            };

            // Sync to localStorage
            setActiveTenant(urlTenantId);

            logTenantEvent('tenant_resolved', {
                userId,
                tenantId: urlTenantId,
                source: 'url',
                role: membership.role
            });

            return {
                type: 'RESOLVED',
                tenantId: urlTenantId,
                reason: 'Tenant resolved from URL',
                context
            };
        }

        logTenantEvent('tenant_access_denied', {
            userId,
            attemptedTenantId: urlTenantId,
            reason: 'User does not have access'
        });

        return {
            type: 'UNAUTHORIZED',
            tenantId: null,
            reason: `User does not have access to tenant: ${urlTenantId}`
        };
    }

    // Case 3: Check cached active tenant (SOVEREIGN CHECK)
    const cachedTenantId = getActiveTenant();
    const cachedStatus = getTenantStatus();

    // SOVEREIGNTY: If status is ACTIVE, strictly respect it.
    if (cachedTenantId && cachedStatus === 'ACTIVE') {
        const membership = memberships.find(m => m.restaurant_id === cachedTenantId);

        if (membership) {
            const context: TenantContext = {
                tenantId: cachedTenantId,
                role: membership.role,
                permissions: getPermissionsForRole(membership.role),
            };

            logTenantEvent('tenant_resolved', {
                userId,
                tenantId: cachedTenantId,
                source: 'sovereign_cache',
                role: membership.role
            });

            return {
                type: 'RESOLVED',
                tenantId: cachedTenantId,
                reason: 'Tenant resolved (Sovereign Active)',
                context
            };
        }

        // Cached tenant is invalid (user lost access?), clear it
        console.warn('[TenantResolver] Active tenant found but user lost access', cachedTenantId);
        clearActiveTenant();
    }

    // Case 4: Single tenant = auto-select
    if (memberships.length === 1) {
        const membership = memberships[0];
        const context: TenantContext = {
            tenantId: membership.restaurant_id,
            role: membership.role,
            permissions: getPermissionsForRole(membership.role),
        };

        setActiveTenant(membership.restaurant_id);

        logTenantEvent('tenant_resolved', {
            userId,
            tenantId: membership.restaurant_id,
            source: 'auto_single',
            role: membership.role
        });

        return {
            type: 'RESOLVED',
            tenantId: membership.restaurant_id,
            reason: 'Auto-selected single tenant',
            context
        };
    }

    // Case 5: Multiple tenants, no active = needs selection
    logTenantEvent('tenant_resolved', {
        userId,
        result: 'NEEDS_SELECTION',
        tenantCount: memberships.length
    });

    return {
        type: 'NEEDS_SELECTION',
        tenantId: null,
        reason: 'User has multiple tenants, selection required'
    };
}

/**
 * Validate if user has access to a specific tenant
 */
export async function validateAccess(
    tenantId: string,
    userId: string
): Promise<boolean> {
    const memberships = await fetchUserMemberships(userId);
    const hasAccess = memberships.some(m => m.restaurant_id === tenantId);

    if (!hasAccess) {
        logTenantEvent('tenant_access_denied', { userId, tenantId });
    }

    return hasAccess;
}

// ============================================================================
// LOCAL STORAGE MANAGEMENT
// ============================================================================

// ============================================================================
// LOCAL STORAGE MANAGEMENT (Tab-Isolated)
// ============================================================================

/**
 * Get active tenant status
 */
export function getTenantStatus(): TenantStatus {
    try {
        const status = getTabIsolated(TENANT_STATUS_KEY);
        return (status as TenantStatus) || 'UNSELECTED';
    } catch {
        return 'UNSELECTED';
    }
}

/**
 * Get active tenant from TabIsolatedStorage
 */
export function getActiveTenant(): string | null {
    try {
        return getTabIsolated(ACTIVE_TENANT_KEY);
    } catch {
        return null;
    }
}

/**
 * Tenant is considered "sealed" iff:
 * - chefiapp_active_tenant exists
 * - chefiapp_tenant_status === 'ACTIVE'
 *
 * This is the single formal prerequisite for allowing /app/* and booting the Kernel.
 * Pure read-only helper (no side effects).
 */
export function isTenantSealed(): boolean {
    const id = getActiveTenant();
    return !!id && getTenantStatus() === 'ACTIVE';
}

/**
 * Check if a specific tenant ID is sealed (active tenant matches and status is ACTIVE).
 * Used by Kernel to validate tenant before boot.
 */
export function isTenantSealedFor(tenantId: string | null | undefined): boolean {
    if (!tenantId) return false;
    return getActiveTenant() === tenantId && getTenantStatus() === 'ACTIVE';
}

/**
 * Set active tenant in TabIsolatedStorage (Seals Status as ACTIVE by default)
 */
export function setActiveTenant(tenantId: string, status: TenantStatus = 'ACTIVE'): void {
    try {
        setTabIsolated(ACTIVE_TENANT_KEY, tenantId);
        setTabIsolated(TENANT_STATUS_KEY, status);
        // Also sync legacy key for backwards compatibility
        setTabIsolated('chefiapp_restaurant_id', tenantId);

        console.info(`[TenantResolver] 🔒 Tenant Sealed: ${tenantId} [${status}]`);
    } catch (e) {
        console.error('[TenantResolver] Failed to set active tenant:', e);
    }
}

/**
 * Clear active tenant from TabIsolatedStorage
 */
export function clearActiveTenant(): void {
    try {
        removeTabIsolated(ACTIVE_TENANT_KEY);
        removeTabIsolated(TENANT_STATUS_KEY);
        removeTabIsolated('chefiapp_restaurant_id');
        console.info('[TenantResolver] 🔓 Tenant Unsealed');
    } catch {
        // Ignore
    }
}

/**
 * Switch to a different tenant
 */
export async function switchTenant(
    tenantId: string,
    userId: string
): Promise<boolean> {
    const hasAccess = await validateAccess(tenantId, userId);

    if (!hasAccess) {
        logTenantEvent('tenant_access_denied', {
            userId,
            tenantId,
            action: 'switch'
        });
        return false;
    }

    setActiveTenant(tenantId, 'ACTIVE');

    logTenantEvent('tenant_switched', {
        userId,
        newTenantId: tenantId
    });

    return true;
}

// ============================================================================
// PURE FUNCTIONS (For deterministic testing)
// ============================================================================

/**
 * Pure tenant resolution (no side effects)
 * Used for testing and by TenantContext
 */
export function resolveTenant(
    urlTenantId: string | null | undefined,
    memberships: TenantMembership[],
    cachedTenantId?: string | null
): TenantResolutionResult {

    // Case 1: No memberships = No tenants
    if (!memberships || memberships.length === 0) {
        return {
            type: 'NO_TENANTS',
            tenantId: null,
            reason: 'User has no tenant memberships'
        };
    }

    // Case 2: URL has tenant ID = Validate access
    if (urlTenantId) {
        const membership = memberships.find(m => m.restaurant_id === urlTenantId);

        if (membership) {
            return {
                type: 'RESOLVED',
                tenantId: urlTenantId,
                reason: 'Tenant resolved from URL',
                context: {
                    tenantId: urlTenantId,
                    role: membership.role,
                    permissions: getPermissionsForRole(membership.role),
                }
            };
        }

        return {
            type: 'UNAUTHORIZED',
            tenantId: null,
            reason: `User does not have access to tenant: ${urlTenantId}`
        };
    }

    // Case 3: Check cached tenant
    if (cachedTenantId) {
        const membership = memberships.find(m => m.restaurant_id === cachedTenantId);

        if (membership) {
            return {
                type: 'RESOLVED',
                tenantId: cachedTenantId,
                reason: 'Tenant resolved from cache',
                context: {
                    tenantId: cachedTenantId,
                    role: membership.role,
                    permissions: getPermissionsForRole(membership.role),
                }
            };
        }
    }

    // Case 4: Single tenant = auto-select
    if (memberships.length === 1) {
        const membership = memberships[0];
        return {
            type: 'RESOLVED',
            tenantId: membership.restaurant_id,
            reason: 'Auto-selected single tenant',
            context: {
                tenantId: membership.restaurant_id,
                role: membership.role,
                permissions: getPermissionsForRole(membership.role),
            }
        };
    }

    // Case 5: Multiple tenants = needs selection
    return {
        type: 'NEEDS_SELECTION',
        tenantId: null,
        reason: 'User has multiple tenants, selection required'
    };
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validate if user has access to a specific tenant (pure)
 */
export function validateTenantAccess(
    tenantId: string,
    memberships: TenantMembership[]
): boolean {
    return memberships.some(m => m.restaurant_id === tenantId);
}

/**
 * Get user's role for a specific tenant
 */
export function getTenantRole(
    tenantId: string,
    memberships: TenantMembership[]
): TenantRole | null {
    const membership = memberships.find(m => m.restaurant_id === tenantId);
    return membership?.role || null;
}

/**
 * Check if user is owner of tenant
 */
export function isTenantOwner(
    tenantId: string,
    memberships: TenantMembership[]
): boolean {
    return memberships.some(m => m.restaurant_id === tenantId && m.role === 'owner');
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Extract tenant ID from URL path
 * 
 * Supported patterns:
 * - /app/:tenantId/dashboard
 * - /app/:tenantId/tpv
 * - /app/:tenantId/*
 */
export function extractTenantFromPath(pathname: string): string | null {
    // Pattern: /app/:tenantId/* where tenantId is UUID
    const match = pathname.match(/^\/app\/([a-f0-9-]{36})\/?/);
    return match ? match[1] : null;
}

/**
 * Check if path is a legacy route (without tenant ID)
 */
export function isLegacyRoute(pathname: string): boolean {
    // Legacy routes: /app, /app/dashboard, /app/tpv, etc. without tenant UUID
    const legacyPatterns = [
        /^\/app\/?$/,
        /^\/app\/(dashboard|tpv|kds|menu|orders|staff|settings|reports|team|store|web|local-boss|govern|reservations|reputation-hub|operational-hub|portioning|coming-soon)/,
    ];

    // If it has a tenant ID, it's not legacy
    if (extractTenantFromPath(pathname)) {
        return false;
    }

    return legacyPatterns.some(p => p.test(pathname));
}

/**
 * Build tenant-scoped path
 */
export function buildTenantPath(tenantId: string, subPath: string): string {
    const cleanSubPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    return `/app/${tenantId}/${cleanSubPath}`;
}

/**
 * Get base path from legacy route
 */
export function getBasePathFromLegacy(pathname: string): string {
    // /app/dashboard -> dashboard
    // /app/tpv -> tpv
    const match = pathname.match(/^\/app\/(.+)$/);
    return match ? match[1] : 'dashboard';
}

/**
 * Remove tenant from path (get base path)
 */
export function getBasePathFromTenantPath(pathname: string): string {
    // /app/:tenantId/dashboard -> dashboard
    const match = pathname.match(/^\/app\/[a-f0-9-]{36}\/(.+)$/);
    return match ? match[1] : 'dashboard';
}
