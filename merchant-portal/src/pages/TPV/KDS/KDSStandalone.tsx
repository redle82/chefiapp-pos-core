/**
 * KDSStandalone — Kitchen Display System (Standalone Mode)
 * 
 * OBJETIVO: Rodar em tablet/TV da cozinha SEM login, SEM sidebar, SEM auth.
 * ROTA: /kds/:restaurantId
 * 
 * ARQUITETURA:
 * - KDSLayout: Container escuro full-screen
 * - OrderProvider: Gerencia pedidos + realtime + polling defensivo
 * - KitchenDisplay: UI dos tickets + feedback offline
 * 
 * HARDENING:
 * - Se offline, banner vermelho + ações bloqueadas
 * - Polling defensivo de 30s como fallback para realtime
 * - Refetch automático na reconexão
 * 
 * 🔴 RISK: restaurantId vem da URL e é salvo em localStorage.
 *          Qualquer um com a URL pode ver os pedidos.
 *          TODO: Implementar token de acesso para KDS se necessário.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrderProvider } from '../context/OrderContextReal';
import { KernelProvider } from '../../../core/kernel/KernelContext';
import { OfflineOrderProvider } from '../context/OfflineOrderContext';
import KitchenDisplay from './KitchenDisplay';
import { KDSLayout } from './KDSLayout';
import { setTabIsolated } from '../../../core/storage/TabIsolatedStorage';

const KDSStandalone = () => {
    const { restaurantId } = useParams<{ restaurantId: string }>();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            // SEEDING: Inject ID into storage so OrderProvider works naturally
            // This replicates the effect of logging in and selecting a restaurant
            // but scoped just for this session/tab.
            console.log('[KDS Standalone] Seeding Restaurant ID:', restaurantId);
            setTabIsolated('chefiapp_restaurant_id', restaurantId);
            setReady(true);
        }
    }, [restaurantId]);

    if (!restaurantId) {
        return <div style={{ padding: 40, color: 'white' }}>Erro: ID do Restaurante não fornecido na URL.</div>;
    }

    if (!ready) {
        return <div style={{ background: '#000', height: '100vh' }} />; // Flash prevention
    }

    return (
        <KDSLayout>
            <KernelProvider tenantId={restaurantId}>
                <OfflineOrderProvider>
                    <OrderProvider restaurantId={restaurantId}>
                        <KitchenDisplay />
                    </OrderProvider>
                </OfflineOrderProvider>
            </KernelProvider>
        </KDSLayout>
    );
};

export default KDSStandalone;
