// @ts-nocheck
import { useState } from 'react';
import { useTenant, type TenantMembership } from './TenantContext';

/**
 * 🏢 TenantSelector — Multi-Restaurant Selector UI (Phase 4)
 * 
 * UI para usuários que operam múltiplos restaurantes.
 * 
 * Exibição:
 * - Se isMultiTenant=false: Não renderiza nada
 * - Se isMultiTenant=true: Dropdown com lista de restaurantes
 */

interface TenantSelectorProps {
    /** Compact mode for header */
    compact?: boolean;
    /** Custom class name */
    className?: string;
}

export function TenantSelector({ compact = false, className = '' }: TenantSelectorProps) {
    const { 
        tenantId, 
        memberships, 
        isMultiTenant, 
        switchTenant, 
        getCurrentTenantName,
        isLoading 
    } = useTenant();
    
    const [isOpen, setIsOpen] = useState(false);

    // Don't render if single tenant
    if (!isMultiTenant || isLoading) {
        return null;
    }

    const currentName = getCurrentTenantName() || 'Selecionar restaurante';

    const getRoleBadge = (role: TenantMembership['role']) => {
        const badges: Record<string, { label: string; color: string }> = {
            owner: { label: 'Dono', color: '#32d74b' },
            manager: { label: 'Gerente', color: '#0a84ff' },
            staff: { label: 'Staff', color: '#ff9f0a' },
            waiter: { label: 'Garçom', color: '#bf5af2' },
            kitchen: { label: 'Cozinha', color: '#ff453a' },
        };
        return badges[role] || { label: role, color: '#8e8e93' };
    };

    const handleSelect = (restaurantId: string) => {
        switchTenant(restaurantId);
        setIsOpen(false);
    };

    if (compact) {
        return (
            <div className={`tenant-selector-compact ${className}`} style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: '#fff',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: '#32d74b' 
                    }} />
                    <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentName}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
                </button>

                {isOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 4,
                            background: '#1c1c1e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            minWidth: 220,
                            zIndex: 1000,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                    >
                        {memberships.map((m) => {
                            const badge = getRoleBadge(m.role);
                            const isActive = m.restaurant_id === tenantId;
                            
                            return (
                                <button
                                    key={m.restaurant_id}
                                    onClick={() => handleSelect(m.restaurant_id)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: isActive ? 'rgba(50,215,75,0.15)' : 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        color: '#fff',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span style={{ fontSize: 13 }}>{m.restaurant_name}</span>
                                    <span 
                                        style={{ 
                                            fontSize: 10, 
                                            padding: '2px 6px', 
                                            borderRadius: 4,
                                            background: `${badge.color}22`,
                                            color: badge.color,
                                        }}
                                    >
                                        {badge.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Full mode (for dedicated page)
    return (
        <div className={`tenant-selector ${className}`} style={{ padding: 20 }}>
            <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 18 }}>
                Seus Restaurantes
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {memberships.map((m) => {
                    const badge = getRoleBadge(m.role);
                    const isActive = m.restaurant_id === tenantId;
                    
                    return (
                        <button
                            key={m.restaurant_id}
                            onClick={() => handleSelect(m.restaurant_id)}
                            style={{
                                padding: '16px 20px',
                                background: isActive ? 'rgba(50,215,75,0.15)' : '#1c1c1e',
                                border: isActive ? '2px solid #32d74b' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                color: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 500 }}>{m.restaurant_name}</div>
                                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 4 }}>
                                    ID: {m.restaurant_id.slice(0, 8)}...
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span 
                                    style={{ 
                                        fontSize: 11, 
                                        padding: '4px 8px', 
                                        borderRadius: 6,
                                        background: `${badge.color}22`,
                                        color: badge.color,
                                        fontWeight: 500,
                                    }}
                                >
                                    {badge.label}
                                </span>
                                
                                {isActive && (
                                    <span style={{ color: '#32d74b', fontSize: 16 }}>✓</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// STANDALONE PAGE
// ============================================================================

/**
 * Full-page tenant selector (for /tenant-selector route).
 * Nunca ecrã vazio: loading ou single-tenant mostram estado visual.
 */
export function TenantSelectorPage() {
    const { isMultiTenant, isLoading } = useTenant();

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
                width: '100%',
                maxWidth: 400,
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{
                        color: '#fff',
                        fontSize: 24,
                        fontWeight: 600,
                        marginBottom: 8
                    }}>
                        ChefIApp POS
                    </h1>
                    <p style={{ color: '#8e8e93', fontSize: 14 }}>
                        Selecione o restaurante para operar
                    </p>
                </div>

                {isLoading ? (
                    <div style={{
                        padding: 24,
                        textAlign: 'center',
                        color: '#8e8e93',
                        fontSize: 14,
                    }}>
                        A carregar…
                    </div>
                ) : !isMultiTenant ? (
                    <div style={{
                        padding: 24,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#8e8e93',
                        fontSize: 14,
                        textAlign: 'center',
                    }}>
                        Um único restaurante associado à sua conta. Pode continuar para o dashboard.
                    </div>
                ) : (
                    <TenantSelector />
                )}
            </div>
        </div>
    );
}

export default TenantSelector;
