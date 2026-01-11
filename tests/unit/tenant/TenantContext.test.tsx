/**
 * 🧪 TENANT CONTEXT — UNIT TESTS
 * 
 * Tests the multi-tenant context provider and hooks.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { TenantProvider, useTenant, useTenantGuard } from '../../../merchant-portal/src/core/tenant/TenantContext';

// Mock Supabase
const mockFrom = jest.fn();
const mockSupabase = {
    from: mockFrom,
};

jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: mockSupabase,
}));

// Mock useSupabaseAuth
const mockUseSupabaseAuth = jest.fn();
jest.mock('../../../merchant-portal/src/core/auth/useSupabaseAuth', () => ({
    useSupabaseAuth: () => mockUseSupabaseAuth(),
}));

describe('TenantContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        mockUseSupabaseAuth.mockReturnValue({
            session: null,
            loading: false,
        });
    });

    describe('TenantProvider - No Session', () => {
        it('should set state to empty when no session', async () => {
            mockUseSupabaseAuth.mockReturnValue({
                session: null,
                loading: false,
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            expect(result.current.tenantId).toBeNull();
            expect(result.current.restaurant).toBeNull();
            expect(result.current.memberships).toEqual([]);
            expect(result.current.isMultiTenant).toBe(false);
        });
    });

    describe('TenantProvider - With Session', () => {
        it('should resolve tenant from memberships', async () => {
            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
            ];

            const mockRestaurants = [
                { id: 'rest-1', name: 'Restaurant 1' },
            ];

            const mockFullRestaurant = {
                id: 'rest-1',
                name: 'Restaurant 1',
                operation_status: 'active',
            };

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            // Mock Supabase queries
            const mockSelect = jest.fn();
            const mockEq = jest.fn();
            const mockIn = jest.fn();
            const mockSingle = jest.fn();

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: mockRestaurants, error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockFullRestaurant, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            expect(result.current.tenantId).toBe('rest-1');
            expect(result.current.restaurant?.name).toBe('Restaurant 1');
            expect(result.current.memberships).toHaveLength(1);
            expect(result.current.isMultiTenant).toBe(false);
        });

        it('should handle multiple memberships (multi-tenant)', async () => {
            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
                { restaurant_id: 'rest-2', role: 'manager' },
            ];

            const mockRestaurants = [
                { id: 'rest-1', name: 'Restaurant 1' },
                { id: 'rest-2', name: 'Restaurant 2' },
            ];

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: mockRestaurants, error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockRestaurants[0], error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            expect(result.current.memberships).toHaveLength(2);
            expect(result.current.isMultiTenant).toBe(true);
        });

        it('should use cached tenant ID if available', async () => {
            localStorage.setItem('chefiapp_restaurant_id', 'rest-2');

            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
                { restaurant_id: 'rest-2', role: 'manager' },
            ];

            const mockRestaurants = [
                { id: 'rest-1', name: 'Restaurant 1' },
                { id: 'rest-2', name: 'Restaurant 2' },
            ];

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: mockRestaurants, error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockRestaurants[1], error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            expect(result.current.tenantId).toBe('rest-2');
        });
    });

    describe('switchTenant', () => {
        it('should switch to different tenant', async () => {
            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
                { restaurant_id: 'rest-2', role: 'manager' },
            ];

            const mockRestaurants = [
                { id: 'rest-1', name: 'Restaurant 1' },
                { id: 'rest-2', name: 'Restaurant 2' },
            ];

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: mockRestaurants, error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockRestaurants[1], error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            await act(async () => {
                await result.current.switchTenant('rest-2');
            });

            // Wait for async switch
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.tenantId).toBe('rest-2');
            expect(localStorage.getItem('chefiapp_restaurant_id')).toBe('rest-2');
        });

        it('should not switch to unauthorized tenant', async () => {
            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
            ];

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: [{ id: 'rest-1', name: 'Restaurant 1' }], error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: { id: 'rest-1', name: 'Restaurant 1' }, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            const initialTenantId = result.current.tenantId;

            await act(async () => {
                await result.current.switchTenant('rest-unauthorized');
            });

            // Should not have changed
            expect(result.current.tenantId).toBe(initialTenantId);
        });
    });

    describe('refreshTenant', () => {
        it('should refresh active tenant data', async () => {
            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
            ];

            const mockRestaurant = {
                id: 'rest-1',
                name: 'Restaurant 1',
                operation_status: 'active',
            };

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: [{ id: 'rest-1', name: 'Restaurant 1' }], error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockRestaurant, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            await act(async () => {
                await result.current.refreshTenant();
            });

            expect(result.current.restaurant).toBeDefined();
        });
    });

    describe('getCurrentTenantName', () => {
        it('should return tenant name from memberships', async () => {
            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
            ];

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: [{ id: 'rest-1', name: 'Restaurant 1' }], error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: { id: 'rest-1', name: 'Restaurant 1' }, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenant(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isLoading).toBe(false);

            const name = result.current.getCurrentTenantName();
            expect(name).toBe('Restaurant 1');
        });
    });

    describe('useTenant hook', () => {
        it('should throw error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useTenant());
            }).toThrow('Must be used within TenantProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('useTenantGuard hook', () => {
        it('should return isReady true when tenant is loaded', async () => {
            const mockSession = {
                user: { id: 'user-123' },
            };

            const mockMembers = [
                { restaurant_id: 'rest-1', role: 'owner' },
            ];

            mockUseSupabaseAuth.mockReturnValue({
                session: mockSession,
                loading: false,
            });

            mockFrom.mockImplementation((table: any) => {
                if (table === 'gm_restaurant_members') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({ data: mockMembers, error: null }),
                        }),
                    };
                }
                if (table === 'gm_restaurants') {
                    return {
                        select: () => ({
                            in: () => Promise.resolve({ data: [{ id: 'rest-1', name: 'Restaurant 1' }], error: null }),
                            eq: () => ({
                                single: () => Promise.resolve({ data: { id: 'rest-1', name: 'Restaurant 1' }, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenantGuard(), { wrapper });

            // Wait for async resolution
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            expect(result.current.isReady).toBe(true);

            expect(result.current.tenantId).toBe('rest-1');
        });

        it('should return isReady false when loading', () => {
            mockUseSupabaseAuth.mockReturnValue({
                session: { user: { id: 'user-123' } },
                loading: true,
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <TenantProvider>{children}</TenantProvider>
            );

            const { result } = renderHook(() => useTenantGuard(), { wrapper });

            expect(result.current.isReady).toBe(false);
        });
    });
});
