import React from 'react';
import { Outlet } from 'react-router-dom';
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
    // Keep Identity/Guardian hooks running
    const { identity } = useRestaurantIdentity();
    const { systemState } = useSystemGuardian();

    return (
        <>
            {/* Logic/Providers could go here if needed */}
            <Outlet />
        </>
    );
};
