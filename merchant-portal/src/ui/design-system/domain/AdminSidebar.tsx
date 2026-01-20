import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';
import { supabase } from '../../../core/supabase';
import { OSSignature } from '../sovereign/OSSignature';
import { removeTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { useContextEngine } from '../../../core/context';

interface AdminSidebarProps {
    activePath: string;
    onNavigate: (path: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePath, onNavigate }) => {
    const navigate = useNavigate();
    const { role, visibleModules, switchView, isViewMode, originalRole } = useContextEngine();
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

    const handleItemClick = (item: SidebarItem) => {
        if (item.type === 'launcher') {
            // TPV Installation Contract: Launch in isolated context
            if (item.id === '/app/tpv') {
                // TPV Configuration: Standalone window feel
                window.open(item.id, 'ChefIApp_TPV', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
            } else if (item.id === '/app/kds') {
                // KDS Configuration: Fullscreen feel
                window.open(item.id, 'ChefIApp_KDS');
            } else {
                window.open(item.id, '_blank');
            }
        } else {
            // Standard SPA Navigation
            onNavigate(item.id);
        }
    };

    interface SidebarItem {
        label: string;
        id: string;
        icon: string;
        type?: 'launcher';
        status?: 'experimental' | 'locked' | 'planned' | 'active';
        show?: boolean;
    }

    interface SidebarGroup {
        title: string;
        visible?: boolean;
        collapsible?: boolean;
        items: SidebarItem[];
    }

    const GROUPS: SidebarGroup[] = [
        {
            title: 'Comando',
            visible: role === 'owner' || role === 'manager',
            items: [
                { label: 'Comando Central', id: '/app/dashboard', icon: '⚡️' },
                { label: 'Ajustes do Núcleo', id: '/app/settings', icon: '⚙️' },
            ]
        },
        {
            title: 'Operar',
            visible: true, // Always visible, but items filtered
            items: [
                { label: 'TPV (Caixa)', id: '/app/tpv', icon: '🖥️', show: true }, // Always visible, SPA nav
                { label: 'KDS (Cozinha)', id: '/app/kds', icon: '👨‍🍳', type: 'launcher', show: visibleModules.kitchen },
                { label: 'Cardápio', id: '/app/menu', icon: '🍔', show: visibleModules.menu },
                { label: 'Pedidos', id: '/app/orders', icon: '📃', show: visibleModules.orders },
                { label: 'Operação Hub', id: '/app/operational-hub', icon: '📦', status: 'experimental', show: visibleModules.settings },
                { label: 'Inventário', id: '/app/inventory', icon: '🧺', status: 'experimental', show: visibleModules.settings },
                { label: 'Mesas', id: '/app/tables', icon: '🪑', show: visibleModules.tables }, // Added explicit tables item
                { label: 'Reservas', id: '/app/reservations', icon: '📅', status: 'planned', show: visibleModules.settings },
            ]
        },
        {
            title: 'Analisar',
            visible: visibleModules.reports || visibleModules.finance,
            items: [
                { label: 'Fecho Diário', id: '/app/reports/daily-closing', icon: '📊', show: visibleModules.reports },
                { label: 'Finanças', id: '/app/reports/finance', icon: '💰', show: visibleModules.finance },
                { label: 'Clientes (CRM)', id: '/app/crm', icon: '👥', show: visibleModules.reports },
                { label: 'Fidelidade', id: '/app/loyalty', icon: '🎁', show: visibleModules.reports },
            ]
        },
        {
            title: 'Governar',
            visible: visibleModules.settings,
            items: [
                { label: 'Equipa', id: '/app/team', icon: '👥', show: visibleModules.settings },
                { label: 'Controlo de Acesso', id: '/app/govern-manage', icon: '🔐', show: visibleModules.settings },
                { label: 'Auditoria', id: '/app/audit', icon: '📋', show: visibleModules.settings },
                { label: 'Página Web', id: '/app/web/preview', icon: '🌐', show: visibleModules.settings },
                { label: 'Segurança Alimentar', id: '/app/govern', icon: '🧼', status: 'locked', show: visibleModules.settings },
            ]
        },
        {
            title: 'Conectar',
            visible: visibleModules.settings,
            items: [
                { label: 'Conectores', id: '/app/settings/connectors', icon: '🔌', status: 'experimental', show: visibleModules.settings },
                { label: 'Reputação Hub', id: '/app/reputation-hub', icon: '⭐', status: 'locked', show: visibleModules.settings },
            ]
        },
        {
            title: 'Evolve',
            collapsible: true, // Meta-produto + Comercial unificados
            visible: role === 'owner',
            items: [
                { label: 'Evolve Hub', id: '/app/evolve', icon: '🔮', show: true },
            ]
        }
    ];

    // Filter Groups
    const filteredGroups = GROUPS.filter(g => g.visible).map(g => ({
        ...g,
        items: g.items.filter(i => i.show !== false)
    })).filter(g => g.items.length > 0);

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
                {filteredGroups.map(group => (
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
                            {group.title === 'Evolve' && (
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
                                            onClick={() => handleItemClick(item)}
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
                    tone="neutral"
                    onClick={() => navigate('/app/select-tenant')}
                    style={{ width: '100%', marginBottom: spacing[2], justifyContent: 'flex-start', color: theme.text.secondary }}
                >
                    🏢 Trocar Restaurante
                </Button>
                <Button
                    variant="ghost"
                    tone="destructive"
                    onClick={handleLogout}
                    style={{ width: '100%', marginBottom: spacing[3], justifyContent: 'flex-start' }}
                >
                    🚪 Encerrar Turno
                </Button>

                {/* View Switcher only for pure Owner */}
                {originalRole === 'owner' && (
                    <div style={{ marginTop: spacing[2], paddingTop: spacing[2], borderTop: `1px dashed ${theme.border.subtle}` }}>
                        <Text size="xs" color="tertiary" style={{ marginBottom: spacing[2] }}>MODO DE VISÃO:</Text>
                        <select
                            value={isViewMode ? role : 'owner'}
                            onChange={(e) => switchView(e.target.value === 'owner' ? null : e.target.value as any)}
                            style={{
                                width: '100%',
                                background: theme.surface.layer2,
                                color: theme.text.primary,
                                border: `1px solid ${theme.border.subtle}`,
                                borderRadius: 4,
                                padding: 4,
                                fontSize: 12
                            }}
                        >
                            <option value="owner">👑 Dono (Padrão)</option>
                            <option value="manager">🧑‍💼 Gerente</option>
                            <option value="waiter">🧍 Garçom</option>
                            <option value="kitchen">👨‍🍳 Cozinheiro</option>
                        </select>
                    </div>
                )}

                <Text size="xs" color="tertiary" style={{ marginTop: spacing[3] }}>
                    {role.toUpperCase()} • v2.2 (Context Engine)
                </Text>
            </div>
        </div>
    );
};
