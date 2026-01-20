import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTenant } from '../tenant/TenantContext'; // Assuming this exists or similar
import { Logger } from '../logger';
import { AuditService } from '../logger/AuditService';

/**
 * 🔱 OperationGate (Opus 6.0)
 * 
 * Sovereignty Level: PHASE 3 (Operation)
 * Responsibility: Enforce operational state (Active, Paused, Suspended).
 * 
 * Rules:
 * 1. If status is 'active', allow explicit pass.
 * 2. If status is 'paused', redirect to /app/paused (unless already there or targeting /app/settings).
 * 3. If status is 'suspended', HARD BLOCK to /app/suspended.
 */
export const OperationGate: React.FC = () => {
    const { restaurant } = useTenant();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // DEV BYPASS: Skip operation checks for TPV/KDS in development mode
        if (import.meta.env.DEV) {
            const path = location.pathname;
            if (path.includes('/tpv') || path.includes('/kds') || path.includes('/waiter')) {
                console.warn('[OperationGate] 🚧 DEV BYPASS: Skipping operation checks for', path);
                return;
            }
        }

        if (!restaurant) return; // FlowGate handles missing tenant

        const status = restaurant.operation_status || 'active'; // Default to active if missing
        const path = location.pathname;

        // 🟢 ACTIVE: Business as usual
        if (status === 'active') {
            // Check if user is stuck on paused/suspended screens unexpectedly
            if (path === '/app/paused' || path === '/app/suspended') {
                Logger.info('OperationGate: Correcting Route (Active)', { from: path, to: '/app/dashboard' });
                navigate('/app/dashboard');
            }
            return;
        }

        // 🟡 PAUSED: Limited Access
        if (status === 'paused') {
            // Allow checking settings to unpause
            if (path.startsWith('/app/settings')) return;
            // Allow the paused screen itself
            if (path === '/app/paused') return;

            Logger.info('OperationGate: System Paused', { path });
            // Audit the block
            AuditService.log({
                action: 'navigation_blocked',
                entity: 'route',
                entityId: path,
                metadata: { reason: 'paused', tenantId: restaurant.id }
            });
            navigate('/app/paused');
            return;
        }

        // 🔴 SUSPENDED: Hard Lock
        if (status === 'suspended') {
            if (path === '/app/suspended') return;

            Logger.critical('OperationGate: System Suspended', null, { path, tenantId: restaurant.id });
            // Audit the critical block
            AuditService.log({
                action: 'navigation_blocked_critical',
                entity: 'route',
                entityId: path,
                metadata: { reason: 'suspended', tenantId: restaurant.id }
            });
            navigate('/app/suspended');
            return;
        }

    }, [restaurant, location.pathname, navigate]);

    // Render children (Outlet) - Logic is handled by side-effect (redirection)
    // We strictly render the outlet, trusting the effect to bounce us if needed.
    // This allows protecting nested routes without conditional rendering flickering.
    return <Outlet />;
};
