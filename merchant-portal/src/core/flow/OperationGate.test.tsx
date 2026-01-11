import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { OperationGate } from './OperationGate';
import { AuditService } from '../logger/AuditService';

// Mock dependencies
vi.mock('../logger/Logger', () => ({
    Logger: {
        info: vi.fn(),
        warn: vi.fn(),
        critical: vi.fn(),
    }
}));

vi.mock('../logger/AuditService', () => ({
    AuditService: {
        log: vi.fn(),
    }
}));

// Mock TenantContext
const mockUseTenant = vi.fn();
vi.mock('../tenant/TenantContext', () => ({
    useTenant: () => mockUseTenant()
}));

// Mock Components for Routing Targets
const Dashboard = () => <div>Dashboard Content</div>;
const PausedScreen = () => <div>System Paused</div>;
const SuspendedScreen = () => <div>System Suspended</div>;
const Settings = () => <div>Settings Content</div>;

describe('OperationGate Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderGate = (initialPath: string) => {
        return render(
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route element={<OperationGate />}>
                        <Route path="/app/dashboard" element={<Dashboard />} />
                        <Route path="/app/settings" element={<Settings />} />
                    </Route>
                    <Route path="/app/paused" element={<PausedScreen />} />
                    <Route path="/app/suspended" element={<SuspendedScreen />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('should render content when status is ACTIVE', () => {
        mockUseTenant.mockReturnValue({
            restaurant: { id: 'r1', operation_status: 'active' }
        });

        renderGate('/app/dashboard');
        expect(screen.getByText('Dashboard Content')).toBeTruthy();
        expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should redirect to /app/paused when status is PAUSED', async () => {
        mockUseTenant.mockReturnValue({
            restaurant: { id: 'r1', operation_status: 'paused' }
        });

        renderGate('/app/dashboard');

        expect(screen.queryByText('Dashboard Content')).toBeNull();
        await waitFor(() => expect(screen.getByText('System Paused')).toBeTruthy());

        expect(AuditService.log).toHaveBeenCalledWith(expect.objectContaining({
            action: 'navigation_blocked',
            entityId: '/app/dashboard'
        }));
    });

    it('should allow /app/settings even when PAUSED', () => {
        mockUseTenant.mockReturnValue({
            restaurant: { id: 'r1', operation_status: 'paused' }
        });

        renderGate('/app/settings');
        expect(screen.getByText('Settings Content')).toBeTruthy();
        expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should redirect to /app/suspended when status is SUSPENDED (Hard Lock)', async () => {
        mockUseTenant.mockReturnValue({
            restaurant: { id: 'r1', operation_status: 'suspended' }
        });

        renderGate('/app/dashboard');

        expect(screen.queryByText('Dashboard Content')).toBeNull();
        await waitFor(() => expect(screen.getByText('System Suspended')).toBeTruthy());

        expect(AuditService.log).toHaveBeenCalledWith(expect.objectContaining({
            action: 'navigation_blocked_critical',
            entityId: '/app/dashboard'
        }));
    });

    it('should redirect active user AWAY from paused screen', async () => {
        mockUseTenant.mockReturnValue({
            restaurant: { id: 'r1', operation_status: 'active' }
        });

        // Simulating user manually typing /app/paused
        render(
            <MemoryRouter initialEntries={['/app/paused']}>
                <Routes>
                    <Route element={<OperationGate />}>
                        <Route path="/app/dashboard" element={<Dashboard />} />
                        {/* Paused is NOT inside the gate usually for rendering, usually it IS protected, but here we test the Gate logic itself if it wraps it. 
                             Wait, if the route is outside the gate (like in my render helper), the Gate logic won't trigger if we go directly there unless the Gate wraps it.
                             
                             In the real app, OperationGate wraps /app. 
                             So /app/paused MUST be inside the gate technically, or outside?
                             Usually special status screens are protected by Auth but maybe handled differently.
                             However, OperationGate.tsx specifically checks:
                             if (path === '/app/paused' || path === '/app/suspended') ...
                             
                             So let's structure the test router to wrap EVERYTHING with OperationGate to simulate /app/* wrapping.
                         */}
                        <Route path="/app/paused" element={<PausedScreen />} />
                        <Route path="/app/suspended" element={<SuspendedScreen />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Expectation: Redirect to /app/dashboard
        await waitFor(() => expect(screen.getByText('Dashboard Content')).toBeTruthy());
        expect(screen.queryByText('System Paused')).toBeNull();
    });

});
