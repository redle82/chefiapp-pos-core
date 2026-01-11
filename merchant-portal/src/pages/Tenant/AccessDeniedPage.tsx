/**
 * 🚫 AccessDeniedPage — 403 Forbidden Screen (Phase 2)
 * 
 * Exibida quando usuário tenta acessar tenant sem permissão.
 * 
 * Fluxo:
 * 1. FlowGate detecta tentativa de acesso a tenant não autorizado
 * 2. Redireciona para /app/access-denied
 * 3. Usuário pode voltar para seleção de tenant ou fazer logout
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../core/supabase';

export function AccessDeniedPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const attemptedTenantId = searchParams.get('tenant');
    const reason = searchParams.get('reason') || 'Você não tem permissão para acessar este restaurante.';

    const handleGoToSelection = () => {
        navigate('/app/select-tenant', { replace: true });
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/auth', { replace: true });
        } catch (e) {
            console.error('[AccessDeniedPage] Logout error:', e);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                {/* Icon */}
                <div style={styles.iconContainer}>
                    <span style={styles.icon}>🚫</span>
                </div>

                {/* Title */}
                <h1 style={styles.title}>Acesso Negado</h1>
                
                {/* Message */}
                <p style={styles.message}>{reason}</p>

                {/* Debug Info (dev only) */}
                {import.meta.env.DEV && attemptedTenantId && (
                    <div style={styles.debugInfo}>
                        <div style={styles.debugLabel}>Tenant ID tentado:</div>
                        <code style={styles.debugCode}>{attemptedTenantId}</code>
                    </div>
                )}

                {/* Actions */}
                <div style={styles.actions}>
                    <button
                        onClick={handleGoToSelection}
                        style={styles.primaryButton}
                    >
                        Escolher outro restaurante
                    </button>

                    <button
                        onClick={handleLogout}
                        style={styles.secondaryButton}
                    >
                        Sair da conta
                    </button>
                </div>

                {/* Help text */}
                <p style={styles.helpText}>
                    Se você acredita que isso é um erro, entre em contato com o administrador do restaurante.
                </p>
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
        maxWidth: 400,
        textAlign: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255, 69, 58, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
    },
    icon: {
        fontSize: 40,
    },
    title: {
        color: '#ff453a',
        fontSize: 24,
        fontWeight: 600,
        margin: '0 0 12px',
    },
    message: {
        color: '#8e8e93',
        fontSize: 14,
        lineHeight: 1.6,
        margin: '0 0 24px',
    },
    debugInfo: {
        background: '#1c1c1e',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        textAlign: 'left',
    },
    debugLabel: {
        color: '#8e8e93',
        fontSize: 11,
        marginBottom: 4,
    },
    debugCode: {
        color: '#ff9f0a',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    primaryButton: {
        width: '100%',
        padding: '14px 24px',
        background: '#32d74b',
        border: 'none',
        borderRadius: 10,
        color: '#000',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
    },
    secondaryButton: {
        width: '100%',
        padding: '14px 24px',
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        color: '#fff',
        fontSize: 15,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    helpText: {
        color: '#636366',
        fontSize: 12,
        marginTop: 24,
        lineHeight: 1.5,
    },
};

export default AccessDeniedPage;
