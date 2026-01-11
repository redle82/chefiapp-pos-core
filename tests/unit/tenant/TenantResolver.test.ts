/**
 * TENANT RESOLVER — UNIT TESTS (Pure Functions Only)
 * 
 * Phase 2 — Multi-Tenant Resolution Logic
 * 
 * Tests pure functions without external dependencies:
 * - Path parsing (extractTenantFromPath, isLegacyRoute)
 * - Path building (buildTenantPath, getBasePathFromLegacy)
 * - Permission matrix validation
 * 
 * Note: Functions that depend on Supabase/localStorage require
 * integration tests in a browser environment.
 */

// ═══════════════════════════════════════════════════════════════
// INLINE IMPLEMENTATION OF PURE FUNCTIONS (Test-only)
// ═══════════════════════════════════════════════════════════════

// These are extracted from TenantResolver.ts for isolated testing
// without Vite/Supabase dependencies

type TenantRole = 'owner' | 'admin' | 'manager' | 'staff' | 'waiter' | 'kitchen';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLE_PERMISSIONS: Record<TenantRole, string[]> = {
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

function extractTenantFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/app\/([^\/]+)/);
    if (!match) return null;
    const segment = match[1];
    if (!UUID_REGEX.test(segment)) return null;
    return segment;
}

function isLegacyRoute(pathname: string): boolean {
    // Starts with /app but second segment is NOT a UUID
    if (!pathname.startsWith('/app')) return false;
    const tenantId = extractTenantFromPath(pathname);
    // If we extracted a tenant ID, it's NOT legacy
    if (tenantId) return false;
    // If it's a known exempt route, it's NOT legacy
    if (pathname.startsWith('/app/select-tenant') || pathname.startsWith('/app/access-denied')) {
        return false;
    }
    // Everything else under /app without tenant ID is legacy
    return true;
}

function buildTenantPath(tenantId: string, basePath: string): string {
    const cleanPath = basePath.startsWith('/') ? basePath.slice(1) : basePath;
    return `/app/${tenantId}/${cleanPath}`;
}

function getBasePathFromLegacy(legacyPath: string): string {
    // Remove /app/ prefix
    const withoutPrefix = legacyPath.replace(/^\/app\/?/, '');
    return withoutPrefix;
}

function hasPermission(role: TenantRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
}

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const ANOTHER_UUID = '123e4567-e89b-12d3-a456-426614174000';

// ═══════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════

describe('TenantResolver — Path Parsing', () => {

    describe('extractTenantFromPath', () => {
        test('extracts UUID from /app/:tenantId/... path', () => {
            expect(extractTenantFromPath(`/app/${VALID_UUID}/dashboard`)).toBe(VALID_UUID);
            expect(extractTenantFromPath(`/app/${VALID_UUID}/tpv`)).toBe(VALID_UUID);
            expect(extractTenantFromPath(`/app/${VALID_UUID}/menu`)).toBe(VALID_UUID);
        });

        test('extracts UUID from /app/:tenantId root', () => {
            expect(extractTenantFromPath(`/app/${VALID_UUID}`)).toBe(VALID_UUID);
            expect(extractTenantFromPath(`/app/${VALID_UUID}/`)).toBe(VALID_UUID);
        });

        test('returns null for legacy routes without tenant', () => {
            expect(extractTenantFromPath('/app/dashboard')).toBeNull();
            expect(extractTenantFromPath('/app/tpv')).toBeNull();
            expect(extractTenantFromPath('/app/menu')).toBeNull();
            expect(extractTenantFromPath('/app/orders')).toBeNull();
        });

        test('returns null for non-app routes', () => {
            expect(extractTenantFromPath('/login')).toBeNull();
            expect(extractTenantFromPath('/onboarding/identity')).toBeNull();
            expect(extractTenantFromPath('/public/menu/test')).toBeNull();
            expect(extractTenantFromPath('/')).toBeNull();
        });

        test('returns null for invalid UUID format', () => {
            expect(extractTenantFromPath('/app/not-a-uuid/dashboard')).toBeNull();
            expect(extractTenantFromPath('/app/12345/dashboard')).toBeNull();
            expect(extractTenantFromPath('/app/select-tenant')).toBeNull();
        });

        test('handles edge cases', () => {
            expect(extractTenantFromPath('')).toBeNull();
            expect(extractTenantFromPath('/app')).toBeNull();
            expect(extractTenantFromPath('/app/')).toBeNull();
        });
    });

    describe('isLegacyRoute', () => {
        test('identifies legacy routes without tenant prefix', () => {
            expect(isLegacyRoute('/app/dashboard')).toBe(true);
            expect(isLegacyRoute('/app/tpv')).toBe(true);
            expect(isLegacyRoute('/app/kds')).toBe(true);
            expect(isLegacyRoute('/app/menu')).toBe(true);
            expect(isLegacyRoute('/app/orders')).toBe(true);
            expect(isLegacyRoute('/app/settings')).toBe(true);
        });

        test('recognizes new tenant-scoped routes as NOT legacy', () => {
            expect(isLegacyRoute(`/app/${VALID_UUID}/dashboard`)).toBe(false);
            expect(isLegacyRoute(`/app/${VALID_UUID}/tpv`)).toBe(false);
        });

        test('handles special routes correctly', () => {
            // These should NOT be migrated (exempt from tenant resolution)
            expect(isLegacyRoute('/app/select-tenant')).toBe(false);
            expect(isLegacyRoute('/app/access-denied')).toBe(false);
        });

        test('handles edge cases', () => {
            expect(isLegacyRoute('/app')).toBe(true); // Index redirects to dashboard
            expect(isLegacyRoute('/app/')).toBe(true);
            expect(isLegacyRoute('/login')).toBe(false);
            expect(isLegacyRoute('/')).toBe(false);
        });
    });

    describe('buildTenantPath', () => {
        test('builds correct tenant-scoped path', () => {
            expect(buildTenantPath(VALID_UUID, 'dashboard')).toBe(`/app/${VALID_UUID}/dashboard`);
            expect(buildTenantPath(VALID_UUID, 'tpv')).toBe(`/app/${VALID_UUID}/tpv`);
            expect(buildTenantPath(VALID_UUID, 'menu')).toBe(`/app/${VALID_UUID}/menu`);
        });

        test('handles paths with leading slash', () => {
            expect(buildTenantPath(VALID_UUID, '/dashboard')).toBe(`/app/${VALID_UUID}/dashboard`);
            expect(buildTenantPath(VALID_UUID, '/settings')).toBe(`/app/${VALID_UUID}/settings`);
        });

        test('handles nested paths', () => {
            expect(buildTenantPath(VALID_UUID, 'settings/connectors')).toBe(`/app/${VALID_UUID}/settings/connectors`);
            expect(buildTenantPath(VALID_UUID, 'reports/daily-closing')).toBe(`/app/${VALID_UUID}/reports/daily-closing`);
        });

        test('handles empty basePath', () => {
            expect(buildTenantPath(VALID_UUID, '')).toBe(`/app/${VALID_UUID}/`);
        });
    });

    describe('getBasePathFromLegacy', () => {
        test('extracts base path from legacy route', () => {
            expect(getBasePathFromLegacy('/app/dashboard')).toBe('dashboard');
            expect(getBasePathFromLegacy('/app/tpv')).toBe('tpv');
            expect(getBasePathFromLegacy('/app/menu')).toBe('menu');
        });

        test('handles nested legacy routes', () => {
            expect(getBasePathFromLegacy('/app/settings/connectors')).toBe('settings/connectors');
            expect(getBasePathFromLegacy('/app/reports/daily-closing')).toBe('reports/daily-closing');
        });

        test('handles /app index route', () => {
            expect(getBasePathFromLegacy('/app')).toBe('');
            expect(getBasePathFromLegacy('/app/')).toBe('');
        });
    });
});

describe('TenantResolver — Permission Matrix', () => {

    describe('ROLE_PERMISSIONS', () => {
        const allRoles: TenantRole[] = ['owner', 'admin', 'manager', 'staff', 'waiter', 'kitchen'];

        test('defines permissions for all roles', () => {
            for (const role of allRoles) {
                expect(ROLE_PERMISSIONS[role]).toBeDefined();
                expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
            }
        });

        test('owner has all permissions', () => {
            const ownerPerms = ROLE_PERMISSIONS['owner'];
            expect(ownerPerms).toContain('*'); // Wildcard = all permissions
        });

        test('admin has management permissions', () => {
            const adminPerms = ROLE_PERMISSIONS['admin'];
            expect(adminPerms).toContain('dashboard:view');
            expect(adminPerms).toContain('menu:edit');
            expect(adminPerms).toContain('reports:view');
        });

        test('kitchen has limited KDS permissions', () => {
            const kitchenPerms = ROLE_PERMISSIONS['kitchen'];
            expect(kitchenPerms).toContain('kds:view');
            expect(kitchenPerms).toContain('kds:manage');
            expect(kitchenPerms).not.toContain('settings:edit');
            expect(kitchenPerms).not.toContain('billing:view');
        });

        test('waiter has order-focused permissions', () => {
            const waiterPerms = ROLE_PERMISSIONS['waiter'];
            expect(waiterPerms).toContain('tpv:view');
            expect(waiterPerms).toContain('orders:create');
            expect(waiterPerms).not.toContain('menu:edit');
            expect(waiterPerms).not.toContain('settings:edit');
        });

        test('staff has basic operational permissions', () => {
            const staffPerms = ROLE_PERMISSIONS['staff'];
            expect(staffPerms).toContain('tpv:view');
            expect(staffPerms).toContain('orders:view');
            expect(staffPerms).not.toContain('billing:view');
        });
    });

    describe('hasPermission', () => {
        test('owner has any permission via wildcard', () => {
            expect(hasPermission('owner', 'dashboard:view')).toBe(true);
            expect(hasPermission('owner', 'settings:edit')).toBe(true);
            expect(hasPermission('owner', 'billing:manage')).toBe(true);
            expect(hasPermission('owner', 'random:permission')).toBe(true);
        });

        test('admin has explicit permissions', () => {
            expect(hasPermission('admin', 'dashboard:view')).toBe(true);
            expect(hasPermission('admin', 'menu:edit')).toBe(true);
            expect(hasPermission('admin', 'billing:view')).toBe(true);
        });

        test('kitchen denied non-KDS permissions', () => {
            expect(hasPermission('kitchen', 'kds:view')).toBe(true);
            expect(hasPermission('kitchen', 'menu:edit')).toBe(false);
            expect(hasPermission('kitchen', 'billing:view')).toBe(false);
        });

        test('waiter denied management permissions', () => {
            expect(hasPermission('waiter', 'tpv:view')).toBe(true);
            expect(hasPermission('waiter', 'settings:edit')).toBe(false);
            expect(hasPermission('waiter', 'team:manage')).toBe(false);
        });

        test('unknown permission returns false for non-owners', () => {
            expect(hasPermission('admin', 'unknown:permission')).toBe(false);
            expect(hasPermission('staff', 'unknown:permission')).toBe(false);
        });

        test('handles edge cases gracefully', () => {
            expect(hasPermission('owner', '')).toBe(true); // Wildcard covers all
            expect(hasPermission('staff', '')).toBe(false); // Empty permission not granted
        });
    });
});

describe('TenantResolver — Integration Scenarios', () => {
    
    describe('Legacy Route Migration', () => {
        test('full migration flow: legacy -> tenant-scoped', () => {
            const legacyPath = '/app/dashboard';
            const tenantId = VALID_UUID;

            // Step 1: Detect legacy
            expect(isLegacyRoute(legacyPath)).toBe(true);

            // Step 2: Extract base path
            const basePath = getBasePathFromLegacy(legacyPath);
            expect(basePath).toBe('dashboard');

            // Step 3: Build new path
            const newPath = buildTenantPath(tenantId, basePath);
            expect(newPath).toBe(`/app/${tenantId}/dashboard`);

            // Step 4: New path is NOT legacy
            expect(isLegacyRoute(newPath)).toBe(false);
        });

        test('nested route migration', () => {
            const legacyPath = '/app/settings/connectors';
            const tenantId = ANOTHER_UUID;

            expect(isLegacyRoute(legacyPath)).toBe(true);
            
            const basePath = getBasePathFromLegacy(legacyPath);
            const newPath = buildTenantPath(tenantId, basePath);
            
            expect(newPath).toBe(`/app/${tenantId}/settings/connectors`);
        });
    });

    describe('Real-World Permission Scenarios', () => {
        test('kitchen staff can only access KDS', () => {
            const role: TenantRole = 'kitchen';
            
            // Can access
            expect(hasPermission(role, 'kds:view')).toBe(true);
            expect(hasPermission(role, 'kds:manage')).toBe(true);
            
            // Cannot access
            expect(hasPermission(role, 'dashboard:view')).toBe(false);
            expect(hasPermission(role, 'menu:edit')).toBe(false);
            expect(hasPermission(role, 'settings:edit')).toBe(false);
            expect(hasPermission(role, 'billing:view')).toBe(false);
        });

        test('waiter can use TPV but not manage menu', () => {
            const role: TenantRole = 'waiter';
            
            // Can access
            expect(hasPermission(role, 'tpv:view')).toBe(true);
            expect(hasPermission(role, 'orders:create')).toBe(true);
            expect(hasPermission(role, 'orders:view')).toBe(true);
            
            // Cannot access
            expect(hasPermission(role, 'menu:edit')).toBe(false);
            expect(hasPermission(role, 'reports:view')).toBe(false);
        });

        test('manager has operational control but no billing', () => {
            const role: TenantRole = 'manager';
            
            // Can access
            expect(hasPermission(role, 'dashboard:view')).toBe(true);
            expect(hasPermission(role, 'menu:view')).toBe(true);
            expect(hasPermission(role, 'menu:edit')).toBe(true);
            expect(hasPermission(role, 'reports:view')).toBe(true);
            
            // Cannot access
            expect(hasPermission(role, 'billing:view')).toBe(false);
            expect(hasPermission(role, 'billing:manage')).toBe(false);
        });
    });
});

describe('TenantResolver — Fail-Closed Behavior', () => {
    
    test('invalid paths return null tenant', () => {
        expect(extractTenantFromPath('/invalid/path')).toBeNull();
        expect(extractTenantFromPath('/app/invalid-uuid/dashboard')).toBeNull();
    });

    test('non-existent role returns no permissions', () => {
        // TypeScript would catch this, but runtime should be safe
        const unknownRole = 'hacker' as TenantRole;
        const permissions = ROLE_PERMISSIONS[unknownRole];
        expect(permissions).toBeUndefined();
    });
});
