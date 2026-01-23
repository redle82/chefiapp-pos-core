/**
 * useRouteGuard - Hook para proteger rotas baseado em permissões
 * 
 * Bug #3 Fix: Previne acesso direto a rotas sem permissão
 */

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAppStaff } from '@/context/AppStaffContext';
import { Permission } from '@/context/ContextPolicy';

interface UseRouteGuardOptions {
    requiredPermission?: Permission;
    allowedRoles?: string[];
    redirectTo?: string;
}

export function useRouteGuard(options: UseRouteGuardOptions = {}) {
    const { requiredPermission, allowedRoles, redirectTo = '/(tabs)/staff' } = options;
    const { canAccess, activeRole } = useAppStaff();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        // Verificar permissão se especificada
        if (requiredPermission && !canAccess(requiredPermission)) {
            console.warn(`[RouteGuard] Access denied: Missing permission ${requiredPermission}`);
            router.replace(redirectTo as any);
            return;
        }

        // Verificar roles permitidos se especificados
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
            console.warn(`[RouteGuard] Access denied: Role ${activeRole} not allowed`);
            router.replace(redirectTo as any);
            return;
        }
    }, [requiredPermission, allowedRoles, canAccess, activeRole, router, redirectTo]);

    // Retornar se tem acesso (para uso condicional em componentes)
    const hasAccess = () => {
        if (requiredPermission && !canAccess(requiredPermission)) {
            return false;
        }
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
            return false;
        }
        return true;
    };

    return { hasAccess: hasAccess() };
}
