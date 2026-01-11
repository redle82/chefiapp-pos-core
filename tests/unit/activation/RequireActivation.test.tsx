/**
 * 🧪 REQUIRE ACTIVATION — UNIT TESTS
 * 
 * Tests the activation guard component.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequireActivation } from '../../../merchant-portal/src/core/activation/RequireActivation';
import { TenantProvider } from '../../../merchant-portal/src/core/tenant/TenantContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom') as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/app/dashboard' }),
    };
});

// Mock TenantContext
const mockUseTenant = jest.fn();
jest.mock('../../../merchant-portal/src/core/tenant/TenantContext', () => {
    const actual = jest.requireActual('../../../merchant-portal/src/core/tenant/TenantContext') as any;
    return {
        ...actual,
        useTenant: () => mockUseTenant(),
    };
});

describe('RequireActivation', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        localStorage.clear();
        mockUseTenant.mockReturnValue({
            restaurant: null,
        });
    });

    it('should render children when operation_mode is set in localStorage', () => {
        localStorage.setItem('chefiapp_operation_mode', 'active');
        
        const { container } = render(
            <MemoryRouter>
                <RequireActivation>
                    <div>Protected Content</div>
                </RequireActivation>
            </MemoryRouter>
        );
        
        expect(container.textContent).toContain('Protected Content');
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect to /activation when operation_mode is missing', async () => {
        mockUseTenant.mockReturnValue({
            restaurant: null,
        });
        
        render(
            <MemoryRouter>
                <RequireActivation>
                    <div>Protected Content</div>
                </RequireActivation>
            </MemoryRouter>
        );
        
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/activation', { replace: true });
        });
    });

    it('should allow bypass with skip_activation query param', () => {
        // Mock window.location.search
        Object.defineProperty(window, 'location', {
            value: {
                search: '?skip_activation=true',
            },
            writable: true,
        });
        
        const { container } = render(
            <MemoryRouter>
                <RequireActivation>
                    <div>Protected Content</div>
                </RequireActivation>
            </MemoryRouter>
        );
        
        expect(container.textContent).toContain('Protected Content');
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should restore session from restaurant operation_status active', async () => {
        mockUseTenant.mockReturnValue({
            restaurant: {
                operation_status: 'active',
            },
        });
        
        const { container } = render(
            <MemoryRouter>
                <RequireActivation>
                    <div>Protected Content</div>
                </RequireActivation>
            </MemoryRouter>
        );
        
        await waitFor(() => {
            expect(localStorage.getItem('chefiapp_operation_mode')).toBe('active');
            expect(container.textContent).toContain('Protected Content');
        });
    });

    it('should restore session from restaurant operation_mode Gamified', async () => {
        mockUseTenant.mockReturnValue({
            restaurant: {
                operation_mode: 'Gamified',
            },
        });
        
        const { container } = render(
            <MemoryRouter>
                <RequireActivation>
                    <div>Protected Content</div>
                </RequireActivation>
            </MemoryRouter>
        );
        
        await waitFor(() => {
            expect(localStorage.getItem('chefiapp_operation_mode')).toBe('active');
            expect(container.textContent).toContain('Protected Content');
        });
    });

    it('should restore session from restaurant operation_mode Active', async () => {
        mockUseTenant.mockReturnValue({
            restaurant: {
                operation_mode: 'Active',
            },
        });
        
        const { container } = render(
            <MemoryRouter>
                <RequireActivation>
                    <div>Protected Content</div>
                </RequireActivation>
            </MemoryRouter>
        );
        
        await waitFor(() => {
            expect(localStorage.getItem('chefiapp_operation_mode')).toBe('active');
            expect(container.textContent).toContain('Protected Content');
        });
    });

    it('should not render children while checking', () => {
        mockUseTenant.mockReturnValue({
            restaurant: null,
        });
        
        const { container } = render(
            <MemoryRouter>
                <RequireActivation>
                    <div>Protected Content</div>
                </RequireActivation>
            </MemoryRouter>
        );
        
        // Initially should be empty while checking
        expect(container.textContent).toBe('');
    });
});
