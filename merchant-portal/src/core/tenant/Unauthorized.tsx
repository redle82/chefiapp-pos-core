/**
 * 🚫 Unauthorized Page — Access Denied (Phase 4)
 * 
 * Exibida quando usuário tenta acessar tenant sem permissão.
 */

import { useNavigate } from 'react-router-dom';

interface UnauthorizedProps {
    /** Which tenant was attempted */
    attemptedTenantId?: string;
    /** Custom message */
    message?: string;
}

export function Unauthorized({ attemptedTenantId, message }: UnauthorizedProps) {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0b0b0c',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: 400,
            }}>
                {/* Icon */}
                <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,69,58,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <span style={{ fontSize: 36 }}>🚫</span>
                </div>

                {/* Title */}
                <h1 style={{
                    color: '#ff453a',
                    fontSize: 24,
                    fontWeight: 600,
                    marginBottom: 12,
                }}>
                    Acesso Negado
                </h1>

                {/* Message */}
                <p style={{
                    color: '#8e8e93',
                    fontSize: 14,
                    lineHeight: 1.6,
                    marginBottom: 32,
                }}>
                    {message || 'Você não tem permissão para acessar este restaurante.'}
                </p>

                {/* Debug info (dev only) */}
                {import.meta.env.DEV && attemptedTenantId && (
                    <div style={{
                        background: '#1c1c1e',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 24,
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: '#8e8e93',
                        textAlign: 'left',
                    }}>
                        <div>Tenant ID: {attemptedTenantId}</div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                        onClick={() => navigate('/app')}
                        style={{
                            padding: '12px 24px',
                            background: '#32d74b',
                            border: 'none',
                            borderRadius: 8,
                            color: '#000',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Ir para meus restaurantes
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8,
                            color: '#fff',
                            fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Unauthorized;
