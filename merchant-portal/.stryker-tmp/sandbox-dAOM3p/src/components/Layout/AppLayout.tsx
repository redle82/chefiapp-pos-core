// @ts-nocheck
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { useSystemGuardian } from '../../core/guardian/SystemGuardianContext';

/**
 * 🏗️ APP LAYOUT (Logic Wrapper)
 * 
 * Previously: Rendered the visual shell.
 * NOW: Pure Logic Wrapper.
 * 
 * Visuals are delegated to:
 * - AdminLayout (Dashboard, Menu, Team)
 * - OperationalLayout (TPV, KDS)
 */
export const AppLayout = () => {
    const location = useLocation();

    // Keep Guardian hook running (safe for all routes)
    const { systemState: _systemState } = useSystemGuardian();

    /**
     * 🔒 TENANT GATE EXEMPTION
     * /app/select-tenant e /app/access-denied precisam renderizar sem depender de identidade default.
     * (Multi-tenant não tem "restaurant default"; identidade deve ser resolvida APÓS seleção.)
     */
    const isTenantGateRoute =
        location.pathname.startsWith('/app/select-tenant') ||
        location.pathname.startsWith('/app/access-denied');

    return (
        <>
            {/* Logic/Providers could go here if needed */}
            {!isTenantGateRoute && <IdentityRunner />}
            <Outlet />
        </>
    );
};

function IdentityRunner() {
    // Keep Identity hook running for operational/admin routes only
    useRestaurantIdentity();
    return null;
}
