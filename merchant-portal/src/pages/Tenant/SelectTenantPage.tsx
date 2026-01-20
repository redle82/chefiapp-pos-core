/**
 * 🏢 SelectTenantPage — Tenant Selection Screen (Phase 2)
 * 
 * Exibida quando usuário tem múltiplos restaurantes e precisa escolher qual operar.
 * 
 * Fluxo:
 * 1. FlowGate detecta múltiplos tenants sem ativo
 * 2. Redireciona para /app/select-tenant
 * 3. Usuário escolhe tenant
 * 4. switchTenant() é chamado
 * 5. Redireciona para /app/:tenantId/dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import {
    fetchUserMemberships,
    switchTenant,
    setActiveTenant,
    isTenantSealed,
    type TenantMembership
} from '../../core/tenant/TenantResolver';
import { useTenant } from '../../core/tenant/TenantContext';
import { FinanceEngine, type FinanceSnapshot } from '../../core/reports/FinanceEngine';

// Role badge colors
const ROLE_BADGES: Record<string, { label: string; color: string }> = {
    owner: { label: 'Proprietário', color: '#32d74b' },
    admin: { label: 'Admin', color: '#0a84ff' },
    manager: { label: 'Gerente', color: '#5e5ce6' },
    staff: { label: 'Staff', color: '#ff9f0a' },
    waiter: { label: 'Garçom', color: '#bf5af2' },
    kitchen: { label: 'Cozinha', color: '#ff453a' },
};

export function SelectTenantPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { switchTenant: switchTenantContext } = useTenant();
    const [userId, setUserId] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [memberships, setMemberships] = useState<TenantMembership[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitching, setSwitching] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [snapshots, setSnapshots] = useState<Record<string, FinanceSnapshot>>({});

    const handleSelect = useCallback(async (tenantId: string) => {
        if (!userId || isSwitching) return;

        setSwitching(tenantId);
        setError(null);

        try {
            // Step 1: Validate and seal tenant using TenantResolver (writes to TabIsolatedStorage)
            const success = await switchTenant(tenantId, userId);

            if (!success) {
                setError('Você não tem acesso a este restaurante');
                setSwitching(null);
                return;
            }

            // Step 2: Ensure tenant is sealed (double-check)
            setActiveTenant(tenantId, 'ACTIVE');

            // Step 3: Update TenantContext state (triggers re-render with new tenantId)
            // This ensures AppDomainWrapper receives the new tenantId immediately
            await switchTenantContext(tenantId);

            // Step 4: Verify tenant is sealed and session exists before navigating
            // Small delay to ensure state propagation
            await new Promise(resolve => setTimeout(resolve, 50));

            if (!isTenantSealed()) {
                console.error('[SelectTenantPage] Tenant not sealed after switch');
                setError('Erro ao selar restaurante. Tente novamente.');
                setSwitching(null);
                return;
            }

            // Step 5: Verify session is still available (prevent redirect to login)
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            if (!verifySession) {
                console.error('[SelectTenantPage] Session lost after tenant switch');
                setError('Sessão perdida. Por favor, faça login novamente.');
                setSwitching(null);
                // Redirect to auth but preserve tenant selection for next login
                navigate('/auth', { replace: true });
                return;
            }

            // Step 6: Navigate to original destination or dashboard
            // Preserve the route the user was trying to access before tenant selection
            const savedRoute = sessionStorage.getItem('chefiapp_return_to');
            const returnTo = (location.state as { from?: string })?.from ||
                savedRoute ||
                '/app/dashboard';

            // Clear stored return path
            if (savedRoute) {
                sessionStorage.removeItem('chefiapp_return_to');
                console.log('[SelectTenantPage] Restoring saved route:', savedRoute);
            }

            // Navigate using React Router (preserves session, no hard reload)
            // The tenant is already sealed and session is valid, so FlowGate will allow access
            console.log('[SelectTenantPage] Navigating to:', returnTo);
            navigate(returnTo, { replace: true });

        } catch (e) {
            setError('Erro ao selecionar restaurante');
            console.error('[SelectTenantPage] Switch error:', e);
            setSwitching(null);
        }
    }, [userId, isSwitching, navigate, switchTenantContext]);

    useEffect(() => {
        let mounted = true;

        async function resolveSession() {
            setAuthLoading(true);
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (!mounted) return;

            if (sessionError || !data.session?.user?.id) {
                setUserId(null);
                setAuthLoading(false);
                // DEV_STABLE_MODE: Redirect to /auth instead of /login (consistent with App.tsx routes)
                navigate('/auth', { replace: true });
                return;
            }

            setUserId(data.session.user.id);
            setAuthLoading(false);
        }

        resolveSession();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    useEffect(() => {
        async function loadMemberships() {
            if (authLoading || !userId) return;

            try {
                const data = await fetchUserMemberships(userId);
                // Deduplicate by restaurant_id to prevent React key warnings
                const uniqueMemberships = data.filter((m, index, self) =>
                    index === self.findIndex((t) => t.restaurant_id === m.restaurant_id)
                );
                setMemberships(uniqueMemberships);

                // If only one tenant, auto-select
                if (uniqueMemberships.length === 1) {
                    handleSelect(uniqueMemberships[0].restaurant_id);
                    return;
                }

                // If no tenants, go to onboarding
                if (uniqueMemberships.length === 0) {
                    navigate('/onboarding/identity', { replace: true });
                    return;
                }
            } catch (e) {
                setError('Erro ao carregar restaurantes');
                console.error('[SelectTenantPage] Error:', e);
            } finally {
                setIsLoading(false);
            }
        }

        loadMemberships();
    }, [userId, authLoading, navigate, handleSelect]);

    // Fetch snapshots for all memberships
    useEffect(() => {
        if (memberships.length === 0) return;

        async function fetchStats() {
            const snaps: Record<string, FinanceSnapshot> = {};

            // Parallel fetch
            const promises = memberships.map(async (m) => {
                try {
                    const data = await FinanceEngine.getDailySnapshot(m.restaurant_id);
                    snaps[m.restaurant_id] = data;
                } catch (err) {
                    console.warn(`[SelectTenantPage] Failed to load stats for ${m.restaurant_id}`, err);
                }
            });

            await Promise.allSettled(promises);
            setSnapshots(prev => ({ ...prev, ...snaps }));
        }

        fetchStats();
    }, [memberships]);

    const getRoleBadge = (role: string) => {
        return ROLE_BADGES[role] || { label: role, color: '#8e8e93' };
    };

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.spinner} />
                    <p style={styles.loadingText}>Carregando restaurantes...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logoContainer}>
                        <span style={styles.logo}>🍳</span>
                    </div>
                    <h1 style={styles.title}>ChefIApp POS</h1>
                    <p style={styles.subtitle}>Selecione o restaurante para operar</p>
                </div>

                {/* Error */}
                {error && (
                    <div style={styles.error}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Tenant Grid */}
                <div style={styles.grid}>
                    {memberships.map((m) => {
                        const badge = getRoleBadge(m.role);
                        const isSelecting = isSwitching === m.restaurant_id;
                        const snap = snapshots[m.restaurant_id];

                        return (
                            <button
                                key={m.restaurant_id}
                                onClick={() => handleSelect(m.restaurant_id)}
                                disabled={!!isSwitching}
                                style={{
                                    ...styles.tenantCard,
                                    opacity: isSwitching && !isSelecting ? 0.5 : 1,
                                    borderColor: isSelecting ? '#32d74b' : 'rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                {/* Header: Name & Role */}
                                <div style={styles.cardHeader}>
                                    <div style={styles.cardTitleBlock}>
                                        <div style={styles.tenantName}>{m.restaurant_name || 'Restaurante'}</div>
                                        <div style={styles.tenantId}>ID: {m.restaurant_id.slice(0, 8)}</div>
                                    </div>
                                    <span style={{
                                        ...styles.roleBadge,
                                        background: `${badge.color}22`,
                                        color: badge.color,
                                    }}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Stats Body */}
                                <div style={styles.cardBody}>
                                    {snap ? (
                                        <div style={styles.statsRow}>
                                            <div style={styles.statItem}>
                                                <div style={styles.statLabel}>Vendas Hoje</div>
                                                <div style={styles.statValue}>
                                                    R$ {snap.totalRevenue.toFixed(2)}
                                                </div>
                                            </div>
                                            <div style={styles.statItem}>
                                                <div style={styles.statLabel}>Pedidos</div>
                                                <div style={styles.statValue}>{snap.totalOrders}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={styles.loadingStats}>
                                            <div style={styles.miniSpinner} />
                                            <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                                                Sincronizando dados...
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Footer */}
                                <div style={styles.cardFooter}>
                                    <span style={styles.enterText}>
                                        {isSelecting ? 'Acessando...' : 'Acessar Painel'}
                                    </span>
                                    {isSelecting ? (
                                        <div style={styles.miniSpinner} />
                                    ) : (
                                        <span style={styles.arrow}>→</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <p style={styles.footerText}>
                        Não encontra seu restaurante?{' '}
                        <button
                            onClick={() => navigate('/onboarding/identity')}
                            style={styles.footerLink}
                        >
                            Criar novo
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0b0b0c 0%, #1a1a1c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 800,
    },
    header: {
        textAlign: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'rgba(50, 215, 75, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    logo: {
        fontSize: 32,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 600,
        margin: '0 0 8px',
    },
    subtitle: {
        color: '#8e8e93',
        fontSize: 14,
        margin: 0,
    },
    card: {
        background: '#1c1c1e',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
    },
    spinner: {
        width: 40,
        height: 40,
        border: '3px solid #333',
        borderTopColor: '#32d74b',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 16px',
    },
    miniSpinner: {
        width: 16,
        height: 16,
        border: '2px solid #333',
        borderTopColor: '#32d74b',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
        color: '#8e8e93',
        fontSize: 14,
    },
    error: {
        background: 'rgba(255, 69, 58, 0.15)',
        border: '1px solid rgba(255, 69, 58, 0.3)',
        borderRadius: 8,
        padding: '12px 16px',
        color: '#ff453a',
        fontSize: 13,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    tenantButton: {
        width: '100%',
        padding: '16px 20px',
        background: '#1c1c1e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s',
        textAlign: 'left',
    },
    tenantInfo: {
        flex: 1,
    },
    tenantName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 500,
        marginBottom: 4,
    },
    tenantId: {
        color: '#8e8e93',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    tenantActions: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    roleBadge: {
        fontSize: 11,
        padding: '4px 8px',
        borderRadius: 6,
        fontWeight: 500,
    },
    arrow: {
        color: '#8e8e93',
        fontSize: 18,
    },
    footer: {
        textAlign: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#8e8e93',
        fontSize: 13,
    },
    footerLink: {
        background: 'none',
        border: 'none',
        color: '#32d74b',
        cursor: 'pointer',
        fontSize: 13,
        textDecoration: 'underline',
    },
    // New Styles for Empire Dashboard
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
        width: '100%',
    },
    tenantCard: {
        background: '#1c1c1e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 20,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 0.2s',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitleBlock: {
        flex: 1,
    },
    cardBody: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
    },
    statsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
    },
    statLabel: {
        fontSize: 11,
        color: '#8e8e93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 600,
        color: '#fff',
    },
    loadingStats: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },
    enterText: {
        fontSize: 13,
        color: '#32d74b',
        fontWeight: 500,
    },
};

export default SelectTenantPage;
