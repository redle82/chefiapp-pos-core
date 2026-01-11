import React, { useEffect } from 'react';
import { StaffProvider } from './context/StaffContext';
import AppStaff from './AppStaff';
import { OrderProvider } from '../TPV/context/OrderContextReal';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { Text } from '../../ui/design-system/primitives/Text';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

// 🛰️ SATÉLITE DE STAFF
// Agora conectado ao Auth + Identidade do Restaurante
export default function StaffModule() {
    const { user, loading: authLoading } = useSupabaseAuth();
    const { identity } = useRestaurantIdentity();

    // 🔒 ARQUITETURA LOCKED: Staff-style browser tab title for isolated tool context
    // Ver: E2E_SOVEREIGN_NAVIGATION_VALIDATION.md
    useEffect(() => {
        document.title = 'ChefIApp POS — Staff';
        return () => { document.title = 'ChefIApp POS'; };
    }, []);

    const loading = authLoading || identity.loading;

    if (loading) {
        return (
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Text size="md" weight="bold">Ligando Staff...</Text>
                <Text size="sm" color="tertiary">Validando sessão e restaurante.</Text>
            </div>
        );
    }

    const restaurantId = identity.id || getTabIsolated('chefiapp_restaurant_id');

    return (
        <OrderProvider>
            <StaffProvider
                restaurantId={restaurantId || undefined}
                userId={user?.id || null}
            >
                <AppStaff />
            </StaffProvider>
        </OrderProvider>
    );
}
