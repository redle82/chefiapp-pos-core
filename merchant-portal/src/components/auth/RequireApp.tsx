import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../core/auth/useAuth';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

/**
 * RequireApp - App Gate (Nível 2)
 * 
 * Garante:
 * 1. Sessão válida (via RequireSession implícito ou explícito)
 * 2. Tenant selecionado (via localStorage)
 * 
 * Se falhar sessão -> /login
 * Se falhar tenant -> /bootstrap
 * 
 * Uso: /dashboard, /settings, /onboarding, /tpv
 */
export function RequireApp({ children }: { children: JSX.Element }) {
    const { session, loading } = useAuth();
    const location = useLocation();

    // 1. Loading Check
    if (loading) {
        return null; // Let parent or RequireSession handle loading UI if composed, or duplicate spinner here for safety.
    }

    // 2. Auth Check
    const isDemo = getTabIsolated('chefiapp_demo_mode') === 'true';
    if (!session && !isDemo) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Tenant Check
    const tenantId = getTabIsolated('chefiapp_restaurant_id');
    if (!tenantId) {
        // Se tem sessão mas não tem tenant -> BOOTSTRAP
        return <Navigate to="/bootstrap" replace />;
    }

    return children;
}
