/**
 * 🧪 WITH TENANT — UNIT TESTS
 * 
 * Tests the tenant isolation wrapper.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    withTenant,
    withTenantInsert,
    assertTenant,
    requiresTenantIsolation,
} from '../../../merchant-portal/src/core/tenant/withTenant';

// Mock import.meta.env
const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
    process.env.NODE_ENV = 'test';
});

describe('withTenant', () => {
    it('should add tenant filter to query', () => {
        const mockQuery = {
            eq: jest.fn().mockReturnThis(),
        };
        const tenantId = 'tenant-123';
        
        const result = withTenant(mockQuery as any, tenantId);
        
        expect(mockQuery.eq).toHaveBeenCalledWith('restaurant_id', tenantId);
        expect(result).toBe(mockQuery);
    });

    it('should use custom column name', () => {
        const mockQuery = {
            eq: jest.fn().mockReturnThis(),
        };
        const tenantId = 'tenant-123';
        
        withTenant(mockQuery as any, tenantId, 'custom_tenant_id');
        
        expect(mockQuery.eq).toHaveBeenCalledWith('custom_tenant_id', tenantId);
    });

    it('should throw error in development when tenantId is null', () => {
        process.env.NODE_ENV = 'development';
        const mockQuery = {
            eq: jest.fn().mockReturnThis(),
        };
        
        expect(() => {
            withTenant(mockQuery as any, null);
        }).toThrow('security violation');
    });

    it('should add impossible filter in production when tenantId is null', () => {
        process.env.NODE_ENV = 'production';
        const mockQuery = {
            eq: jest.fn().mockReturnThis(),
        };
        
        withTenant(mockQuery as any, null);
        
        expect(mockQuery.eq).toHaveBeenCalledWith(
            'restaurant_id',
            '00000000-0000-0000-0000-000000000000'
        );
    });
});

describe('withTenantInsert', () => {
    it('should add tenant_id to single item', () => {
        const data = { name: 'Test', value: 123 };
        const tenantId = 'tenant-123';
        
        const result = withTenantInsert(data, tenantId);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'Test',
            value: 123,
            restaurant_id: 'tenant-123',
        });
    });

    it('should add tenant_id to array of items', () => {
        const data = [
            { name: 'Test1', value: 1 },
            { name: 'Test2', value: 2 },
        ];
        const tenantId = 'tenant-123';
        
        const result = withTenantInsert(data, tenantId);
        
        expect(result).toHaveLength(2);
        expect(result[0].restaurant_id).toBe('tenant-123');
        expect(result[1].restaurant_id).toBe('tenant-123');
    });

    it('should use custom column name', () => {
        const data = { name: 'Test' };
        const tenantId = 'tenant-123';
        
        const result = withTenantInsert(data, tenantId, 'custom_tenant_id');
        
        expect(result[0].custom_tenant_id).toBe('tenant-123');
        expect(result[0].restaurant_id).toBeUndefined();
    });

    it('should throw error in development when tenantId is null', () => {
        process.env.NODE_ENV = 'development';
        const data = { name: 'Test' };
        
        expect(() => {
            withTenantInsert(data, null);
        }).toThrow('security violation');
    });

    it('should return empty array in production when tenantId is null', () => {
        process.env.NODE_ENV = 'production';
        const data = { name: 'Test' };
        
        const result = withTenantInsert(data, null);
        
        expect(result).toEqual([]);
    });
});

describe('assertTenant', () => {
    it('should not throw when tenantId is present', () => {
        expect(() => {
            assertTenant('tenant-123', 'test context');
        }).not.toThrow();
    });

    it('should throw when tenantId is null', () => {
        expect(() => {
            assertTenant(null, 'test context');
        }).toThrow('Missing tenantId');
    });

    it('should include context in error message', () => {
        expect(() => {
            assertTenant(null, 'test context');
        }).toThrow('test context');
    });
});

describe('requiresTenantIsolation', () => {
    it('should return true for business tables', () => {
        expect(requiresTenantIsolation('orders')).toBe(true);
        expect(requiresTenantIsolation('menu_items')).toBe(true);
        expect(requiresTenantIsolation('staff')).toBe(true);
    });

    it('should return false for global tables', () => {
        expect(requiresTenantIsolation('profiles')).toBe(false);
        expect(requiresTenantIsolation('system_config')).toBe(false);
        expect(requiresTenantIsolation('feature_flags')).toBe(false);
        expect(requiresTenantIsolation('app_versions')).toBe(false);
    });
});
