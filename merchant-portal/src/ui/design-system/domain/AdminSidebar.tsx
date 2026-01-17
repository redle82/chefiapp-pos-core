import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';
import { supabase } from '../../../core/supabase';
import { OSSignature } from '../sovereign/OSSignature';
import { removeTabIsolated } from '../../../core/storage/TabIsolatedStorage';

interface AdminSidebarProps {
    activePath: string;
    onNavigate: (path: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePath, onNavigate }) => {
    const navigate = useNavigate();
    const theme = colors.modes.dashboard;

    // Track expanded groups. EVOLVE is collapsed by default (meta-produto + comercial).
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Comando': true,
        'Operar': true,
        'Analisar': true,
        'Governar': true,
        'Conectar': true,
        'Evolve': false // Collapsed by default
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        removeTabIsolated('chefiapp_restaurant_id');
        removeTabIsolated('chefiapp_demo_mode');
        navigate('/start');
    };

    const GROUPS = [
        {
            title: 'Comando',
            items: [
                { label: 'Comando Central', id: '/app/dashboard', icon: '⚡️' },
                { label: 'Ajustes do Núcleo', id: '/app/settings', icon: '⚙️' },
            ]
        },
        {
            title: 'Operar',
            items: [
                { label: 'TPV (Caixa)', id: '/app/tpv', icon: '🖥️' },
                { label: 'KDS (Cozinha)', id: '/app/kds', icon: '👨‍🍳' },
                { label: 'Cardápio', id: '/app/menu', icon: '🍔' },
                { label: 'Pedidos', id: '/app/orders', icon: '📃' },
                { label: 'Operação Hub', id: '/app/operational-hub', icon: '📦', status: 'experimental' },
                { label: 'Reservas', id: '/app/reservations', icon: '📅', status: 'planned' },
            ]
        },
        {
            title: 'Analisar',
            items: [
                { label: 'Fecho Diário', id: '/app/reports/daily-closing', icon: '📊' },
                { label: 'Finanças', id: '/app/reports/finance', icon: '💰' },
                { label: 'Clientes (CRM)', id: '/app/crm', icon: '👥' },
                { label: 'Fidelidade', id: '/app/loyalty', icon: '🎁' },
            ]
        },
        {
            title: 'Governar',
            items: [
                { label: 'Equipa', id: '/app/team', icon: '👥' },
                { label: 'Controlo de Acesso', id: '/app/govern-manage', icon: '🔐' },
                { label: 'Página Web', id: '/app/web/preview', icon: '🌐' },
                { label: 'Segurança Alimentar', id: '/app/govern', icon: '🧼', status: 'locked' },
            ]
        },
        {
            title: 'Conectar',
            items: [
                { label: 'Conectores', id: '/app/settings/connectors', icon: '🔌', status: 'experimental' },
                { label: 'Reputação Hub', id: '/app/reputation-hub', icon: '⭐', status: 'locked' },
            ]
        },
        {
            title: 'Evolve',
            collapsible: true, // Meta-produto + Comercial unificados
            items: [
                { label: 'Evolve Hub', id: '/app/evolve', icon: '🔮' },
            ]
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: spacing[4] }}>
            {/* Brand */}
            <div style={{ marginBottom: spacing[8], paddingLeft: spacing[2] }}>
                <OSSignature state="ember" size="md" />
            </div>

            {/* Navigation */}
            <nav style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[6],
                overflowY: 'auto',
                flex: 1,
                paddingRight: spacing[2],
                marginRight: `-${spacing[2]}`
            }}>
                {GROUPS.map(group => (
                    <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                        {/* Group Header - Clickable for toggle */}
                        <div
                            onClick={() => toggleGroup(group.title)}
                            style={{
                                paddingLeft: spacing[4],
                                marginBottom: spacing[1],
                                opacity: expandedGroups[group.title] ? 0.8 : 0.4,
                                textTransform: 'uppercase',
                                fontSize: 10,
                                letterSpacing: '0.1em',
                                fontWeight: 700,
                                color: theme.text.secondary,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span>{group.title}</span>
                            {/* Chevron / Indicator */}
                            {group.title === 'Evoluir' && (
                                <span style={{ fontSize: 10 }}>
                                    {expandedGroups[group.title] ? '▼' : '▶'}
                                </span>
                            )}
                        </div>

                        {/* Items Container - Conditional Render */}
                        {expandedGroups[group.title] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                                {group.items.map(item => {
                                    const isActive = activePath === item.id || activePath.startsWith(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => onNavigate(item.id)}
                                            style={{
                                                padding: `${spacing[2]} ${spacing[4]}`,
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                backgroundColor: isActive ? theme.surface.layer2 : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: spacing[3],
                                                color: isActive ? theme.text.primary : theme.text.secondary,
                                                transition: 'all 0.2s',
                                                border: `1px solid ${isActive ? theme.border.strong : 'transparent'}`,
                                                opacity: item.status === 'locked' ? 0.5 : 1
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                                                <span style={{ fontSize: 16 }}>{item.icon}</span>
                                                <span style={{ fontWeight: isActive ? 700 : 500, fontSize: 13 }}>{item.label}</span>
                                            </div>
                                            {item.status && item.status !== 'active' && (
                                                <div style={{
                                                    fontSize: 8,
                                                    padding: '2px 4px',
                                                    borderRadius: 4,
                                                    background: item.status === 'experimental' ? 'rgba(50, 215, 75, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: item.status === 'experimental' ? '#32d74b' : 'inherit',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 800
                                                }}>
                                                    {item.status === 'experimental' ? 'BETA' : item.status === 'planned' ? 'BREVE' : 'OFF'}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div style={{ marginTop: 'auto', padding: spacing[4], borderTop: `1px solid ${theme.border.subtle}` }}>
                <Button
                    variant="ghost"
                    tone="destructive"
                    onClick={handleLogout}
                    style={{ width: '100%', marginBottom: spacing[3] }}
                >
                    🚪 Encerrar Turno
                </Button>
                <Text size="xs" color="tertiary">v2.1.0 (Architecture of Modes)</Text>
            </div>
        </div>
    );
};
