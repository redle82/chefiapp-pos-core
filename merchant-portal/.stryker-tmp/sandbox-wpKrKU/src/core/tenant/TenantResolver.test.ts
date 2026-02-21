/**
 * Unit: TenantResolver — resolução de tenant (funções puras)
 * Contrato: TENANT_SELECTION_CONTRACT
 * Cenários: NO_TENANTS, RESOLVED (1 tenant, URL, cache), NEEDS_SELECTION, UNAUTHORIZED
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveTenant,
  validateTenantAccess,
  hasPermission,
  type TenantMembership,
  type TenantRole,
} from './TenantResolver';

describe('TenantResolver (resolveTenant)', () => {
  const membership1: TenantMembership = {
    restaurant_id: 'r1',
    restaurant_name: 'Rest 1',
    role: 'owner',
  };
  const membership2: TenantMembership = {
    restaurant_id: 'r2',
    restaurant_name: 'Rest 2',
    role: 'manager',
  };

  it('returns NO_TENANTS when memberships is empty', () => {
    const result = resolveTenant(null, []);
    expect(result.type).toBe('NO_TENANTS');
    expect(result.tenantId).toBeNull();
  });

  it('returns NO_TENANTS when memberships length is 0', () => {
    const result = resolveTenant(null, []);
    expect(result.type).toBe('NO_TENANTS');
  });

  it('returns RESOLVED with single tenant (auto-select)', () => {
    const result = resolveTenant(null, [membership1]);
    expect(result.type).toBe('RESOLVED');
    expect(result.tenantId).toBe('r1');
    expect(result.context?.role).toBe('owner');
  });

  it('returns NEEDS_SELECTION when multiple tenants and no cache', () => {
    const result = resolveTenant(null, [membership1, membership2]);
    expect(result.type).toBe('NEEDS_SELECTION');
    expect(result.tenantId).toBeNull();
  });

  it('returns RESOLVED when urlTenantId is provided and user has access', () => {
    const result = resolveTenant('r1', [membership1, membership2]);
    expect(result.type).toBe('RESOLVED');
    expect(result.tenantId).toBe('r1');
  });

  it('returns UNAUTHORIZED when urlTenantId is provided but user has no access', () => {
    const result = resolveTenant('r3', [membership1, membership2]);
    expect(result.type).toBe('UNAUTHORIZED');
    expect(result.tenantId).toBeNull();
  });

  it('returns RESOLVED when cachedTenantId is valid', () => {
    const result = resolveTenant(null, [membership1, membership2], 'r2');
    expect(result.type).toBe('RESOLVED');
    expect(result.tenantId).toBe('r2');
  });

  it('returns NEEDS_SELECTION when cachedTenantId is invalid (user lost access)', () => {
    const result = resolveTenant(null, [membership1, membership2], 'r3');
    expect(result.type).toBe('NEEDS_SELECTION');
  });
});

describe('TenantResolver (validateTenantAccess)', () => {
  const memberships: TenantMembership[] = [
    { restaurant_id: 'r1', restaurant_name: 'R1', role: 'owner' },
  ];

  it('returns true when user has membership for tenant', () => {
    expect(validateTenantAccess('r1', memberships)).toBe(true);
  });

  it('returns false when user has no membership for tenant', () => {
    expect(validateTenantAccess('r2', memberships)).toBe(false);
  });
});

describe('TenantResolver (hasPermission)', () => {
  it('owner has all permissions (wildcard)', () => {
    expect(hasPermission('owner', 'tpv:operate')).toBe(true);
    expect(hasPermission('owner', 'any:permission')).toBe(true);
  });

  it('manager has dashboard and menu', () => {
    expect(hasPermission('manager', 'dashboard:view')).toBe(true);
    expect(hasPermission('manager', 'menu:edit')).toBe(true);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('staff' as TenantRole, 'billing:view')).toBe(false);
  });
});
