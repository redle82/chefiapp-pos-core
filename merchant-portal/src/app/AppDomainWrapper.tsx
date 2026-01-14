import { ReactNode, useRef, useEffect, useState } from 'react';
import { OrderProvider } from '../pages/TPV/context/OrderContextReal';
import { TableProvider } from '../pages/TPV/context/TableContext';
import { useTenant } from '../core/tenant/TenantContext';
import { LoadingState } from '../ui/design-system/components/LoadingState';
import { hasActiveOperationalState, getOperationalStateBlockReason } from '../core/gate/OperationalStateGuard';
import { Logger } from '../core/logger/Logger';

interface Props {
    children: ReactNode;
}

/**
 * AppDomainWrapper
 * 
 * 🏛️ SOVEREIGN DOMAIN WRAPPER
 * 
 * This component bridges the Gate layer (TenantContext) with the Domain layer
 * (OrderContext, TableContext). It MUST be rendered inside TenantProvider.
 * 
 * LAW: Domain modules receive tenantId from Gate, they do NOT query storage.
 * 
 * P0.2 GUARD: Blocks tenant switch if there's active operational state.
 * Uses centralized OperationalStateGuard for consistency.
 * 
 * Hierarchy:
 * - TenantProvider (Gate - provides tenantId)
 *   - AppDomainWrapper (this component)
 *     - OrderProvider (Domain - receives tenantId)
 *       - TableProvider (Domain - receives tenantId)
 */
export function AppDomainWrapper({ children }: Props) {
    const { tenantId, isLoading } = useTenant();
    const previousTenantRef = useRef<string | null>(null);
    const [tenantSwitchBlocked, setTenantSwitchBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState<string | null>(null);

    // =========================================================================
    // P0.2 GUARD: Block tenant switch with active operational state
    // Risk: R-023 (🔴 Critical → ✅ FIXED)
    // Uses centralized OperationalStateGuard
    // =========================================================================
    useEffect(() => {
        // Skip if first mount or still loading
        if (isLoading || !tenantId) return;

        const previousTenant = previousTenantRef.current;

        // Detect tenant change
        if (previousTenant && previousTenant !== tenantId) {
            // Check for active operational state using centralized guard
            if (hasActiveOperationalState()) {
                const reason = getOperationalStateBlockReason();

                Logger.warn('TENANT_SWITCH_BLOCKED', {
                    previousTenant,
                    attemptedTenant: tenantId,
                    reason: reason || 'Active operational state',
                });

                setBlockReason(reason);
                setTenantSwitchBlocked(true);

                console.error(
                    `[P0.2 GUARD] Tenant switch blocked: ${previousTenant} → ${tenantId}. ` +
                    `Reason: ${reason}`
                );
                return;
            }

            Logger.info('TENANT_SWITCH_ALLOWED', {
                previousTenant,
                newTenant: tenantId,
                reason: 'No active operational state'
            });
        }

        // Update ref for next check
        previousTenantRef.current = tenantId;
        setTenantSwitchBlocked(false);
        setBlockReason(null);
    }, [tenantId, isLoading]);

    // P0.2: Block render if tenant switch was blocked
    if (tenantSwitchBlocked) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0b0b0c',
                color: '#ff4444'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                        ⚠️ Troca de restaurante bloqueada
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '1rem' }}>
                        Existe um pedido ativo ou operações pendentes.
                        Finalize ou cancele antes de trocar.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: '#333',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Recarregar Página
                    </button>
                </div>
            </div>
        );
    }

    // GATE ENFORCEMENT: Wait for tenant to be resolved
    if (isLoading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0b0b0c'
            }}>
                <LoadingState
                    variant="spinner"
                    spinnerSize="lg"
                    message="Resolvendo contexto operacional..."
                />
            </div>
        );
    }

    // GATE ENFORCEMENT: No tenant = no domain access
    if (!tenantId) {
        // This should not happen if FlowGate is working correctly
        console.error('[AppDomainWrapper] No tenantId available - Gate may have failed');
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0b0b0c',
                color: '#ff4444'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p>⚠️ Contexto operacional não disponível</p>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>
                        Tente recarregar a página ou selecionar um restaurante.
                    </p>
                </div>
            </div>
        );
    }

    // SOVEREIGN INJECTION: Pass tenantId to Domain providers
    return (
        <OrderProvider restaurantId={tenantId}>
            <TableProvider restaurantId={tenantId}>
                {children}
            </TableProvider>
        </OrderProvider>
    );
}
