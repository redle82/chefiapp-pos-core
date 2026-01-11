import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '../tenant/TenantContext';

/**
 * RequireActivation Guard
 * 
 * 🔒 Operational Gate
 * 
 * Ensures that the "Activation Ritual" (Operation Mode, Device Role, etc.) 
 * has been completed before allowing access to the Command Center or Tools.
 * 
 * Logic:
 * 1. Checks local storage for 'chefiapp_operation_mode'.
 * 2. If missing, redirects to /activation.
 * 3. Supports '?skip_activation=true' bypass for devs.
 * 
 * Usage: Wrap /app/* routes in App.tsx
 */
export const RequireActivation = ({ children }: { children: JSX.Element }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { restaurant } = useTenant(); // Access Tenant Context
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const checkActivation = async () => {
            // 1. Dev Bypass
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('skip_activation')) {
                console.warn('[RequireActivation] 🚧 Skipping via URL param');
                setIsVerified(true);
                return;
            }

            // 2. Check Protocol (LocalStorage Fast Path)
            const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
            const localOpMode = getTabIsolated('chefiapp_operation_mode');
            if (localOpMode) {
                setIsVerified(true);
                return;
            }

            // 3. Fallback: Check Sovereign Truth (DB via Context)
            // If the user cleared cache but the restaurant is active/gamified, restore session.
            // Note: 'Gamified' is the default active state for now.
            if (restaurant?.operation_status === 'active' ||
                (restaurant as any)?.operation_mode === 'Gamified' ||
                (restaurant as any)?.operation_mode === 'Active') {

                console.log('[RequireActivation] 🔄 Restoring Session from Sovereign Truth');
                const { setTabIsolated } = await import('../storage/TabIsolatedStorage');
                setTabIsolated('chefiapp_operation_mode', 'active');
                setIsVerified(true);
                return;
            }

            console.log('[RequireActivation] 🛑 Access Denied: Operation Mode undefined. Redirecting to Ritual.');
            navigate('/activation', { replace: true });
        };

        if (restaurant) {
            checkActivation();
        }
    }, [navigate, location, restaurant]);

    if (!isVerified) {
        // Optional: Render nothing or a sovereign loader while checking
        return null;
    }

    return children;
};
