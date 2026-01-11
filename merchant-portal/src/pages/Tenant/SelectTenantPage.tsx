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
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';
import { 
    fetchUserMemberships, 
    switchTenant, 
    buildTenantPath,
    type TenantMembership 
} from '../../core/tenant/TenantResolver';

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
    const { session, loading: authLoading } = useSupabaseAuth();
    
    const [memberships, setMemberships] = useState<TenantMembership[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitching, setSwitching] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = useCallback(async (tenantId: string) => {
        if (!session?.user?.id || isSwitching) return;
        
        setSwitching(tenantId);
        setError(null);

        try {
            const success = await switchTenant(tenantId, session.user.id);
            
            if (success) {
                // Navigate to tenant-scoped dashboard
                navigate(buildTenantPath(tenantId, 'dashboard'), { replace: true });
            } else {
                setError('Você não tem acesso a este restaurante');
                setSwitching(null);
            }
        } catch (e) {
            setError('Erro ao selecionar restaurante');
            console.error('[SelectTenantPage] Switch error:', e);
            setSwitching(null);
        }
    }, [session?.user?.id, isSwitching, navigate]);

    useEffect(() => {
        async function loadMemberships() {
            if (authLoading) return;
            
            if (!session?.user?.id) {
                navigate('/login', { replace: true });
                return;
            }

            try {
                const data = await fetchUserMemberships(session.user.id);
                setMemberships(data);
                
                // If only one tenant, auto-select
                if (data.length === 1) {
                    handleSelect(data[0].restaurant_id);
                    return;
                }
                
                // If no tenants, go to onboarding
                if (data.length === 0) {
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
    }, [session, authLoading, navigate, handleSelect]);

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

                {/* Tenant List */}
                <div style={styles.list}>
                    {memberships.map((m) => {
                        const badge = getRoleBadge(m.role);
                        const isSelecting = isSwitching === m.restaurant_id;
                        
                        return (
                            <button
                                key={m.restaurant_id}
                                onClick={() => handleSelect(m.restaurant_id)}
                                disabled={!!isSwitching}
                                style={{
                                    ...styles.tenantButton,
                                    opacity: isSwitching && !isSelecting ? 0.5 : 1,
                                }}
                            >
                                <div style={styles.tenantInfo}>
                                    <div style={styles.tenantName}>
                                        {m.restaurant_name || 'Restaurante'}
                                    </div>
                                    <div style={styles.tenantId}>
                                        ID: {m.restaurant_id.slice(0, 8)}...
                                    </div>
                                </div>
                                
                                <div style={styles.tenantActions}>
                                    <span style={{
                                        ...styles.roleBadge,
                                        background: `${badge.color}22`,
                                        color: badge.color,
                                    }}>
                                        {badge.label}
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
        maxWidth: 440,
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
};

export default SelectTenantPage;
