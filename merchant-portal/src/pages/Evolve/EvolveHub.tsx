import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { useTenant } from '../../core/tenant/TenantContext';
import { supabase } from '../../core/supabase';

type TabId = 'vision' | 'store' | 'marketplace';

interface TabItem {
    id: TabId;
    label: string;
    icon: string;
    description: string;
}

const TABS: TabItem[] = [
    {
        id: 'vision',
        label: 'Visão',
        icon: '🔮',
        description: 'Roadmap, evolução e transparência do produto'
    },
    {
        id: 'marketplace',
        label: 'Marketplace',
        icon: '🧩',
        description: 'Integrações, Apps e Conectores (Ref 5)'
    },
    {
        id: 'store',
        label: 'Loja',
        icon: '🛍️',
        description: 'Equipamentos, kits TPV e acessórios'
    }
];

// ... (VISION_ITEMS and STORE_ITEMS remain)

// Define Marketplace items template (status will be dynamically calculated)
const MARKETPLACE_TEMPLATE = [
    {
        id: 'ubereats',
        title: 'Uber Eats',
        description: 'Integração direta de pedidos e menu',
        icon: '🛵',
        defaultAction: null
    },
    {
        id: 'glovo',
        title: 'Glovo',
        description: 'Gestão unificada de encomendas',
        icon: '🎒',
        defaultAction: null
    },
    {
        id: 'stripe',
        title: 'Stripe Payments',
        description: 'Processamento de pagamentos integrado',
        icon: '💳',
        defaultAction: '/app/settings/connectors'
    },
    {
        id: 'whatsapp',
        title: 'WhatsApp Bot',
        description: 'Notificações de pedidos e marketing',
        icon: '💬',
        defaultAction: null
    },
    {
        id: 'magalu',
        title: 'Magalu Parceiro',
        description: 'Venda seus produtos no marketplace Magalu',
        icon: '🛍️',
        defaultAction: null
    }
];

export function EvolveHub() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('vision');
    const { restaurant, refreshTenant } = useTenant();
    const [installingId, setInstallingId] = useState<string | null>(null);
    const theme = colors.modes.dashboard;

    // Parse installed apps from restaurant data
    const installedApps: string[] = Array.isArray(restaurant?.modules_unlocked)
        ? restaurant.modules_unlocked
        : [];

    // Dynamically build Marketplace items with status
    const marketplaceItems = MARKETPLACE_TEMPLATE.map(item => {
        const isInstalled = installedApps.includes(item.id);
        return {
            ...item,
            status: isInstalled ? 'installed' : 'planned',
            action: isInstalled ? item.defaultAction : null
        };
    });

    const items = activeTab === 'vision'
        ? VISION_ITEMS
        : activeTab === 'marketplace'
            ? marketplaceItems
            : STORE_ITEMS;

    const handleInstall = async (appId: string, title: string) => {
        if (!restaurant?.id) return;

        // Confirm installation (Mock interaction)
        if (!window.confirm(`Deseja instalar a integração "${title}"?`)) return;

        setInstallingId(appId);
        try {
            const newModules = [...installedApps, appId]; // Add app ID

            const { error } = await supabase
                .from('gm_restaurants')
                .update({ modules_unlocked: newModules })
                .eq('id', restaurant.id);

            if (error) throw error;

            // Refresh context to reflect new state
            await refreshTenant();
            alert(`${title} instalado com sucesso!`);
        } catch (err) {
            console.error('Failed to install app:', err);
            alert('Erro ao instalar app via Marketplace.');
        } finally {
            setInstallingId(null);
        }
    };

    const handleItemClick = (item: any) => {
        if (activeTab === 'marketplace') {
            if (item.status === 'installed') {
                if (item.action) navigate(item.action);
                else alert('Configurações desta integração em breve.');
            } else {
                handleInstall(item.id, item.title);
            }
            return;
        }

        if (item.action) {
            navigate(item.action);
        }
    };

    return (
        <div style={{
            padding: spacing[8],
            maxWidth: 1200,
            margin: '0 auto',
            minHeight: '100vh',
            background: theme.surface.base
        }}>
            {/* Header */}
            <div style={{ marginBottom: spacing[8] }}>
                <Text size="3xl" weight="black" color="primary" style={{ marginBottom: spacing[2] }}>
                    Evolve Hub
                </Text>
                <Text size="lg" color="secondary">
                    Transparência do produto e recursos para crescer
                </Text>
            </div>

            {/* Tab Selector */}
            <div style={{
                display: 'flex',
                gap: spacing[4],
                marginBottom: spacing[8],
                borderBottom: `1px solid ${theme.border.subtle}`,
                paddingBottom: spacing[4]
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            padding: `${spacing[3]} ${spacing[5]}`,
                            borderRadius: 12,
                            border: 'none',
                            cursor: 'pointer',
                            background: activeTab === tab.id
                                ? theme.action.base
                                : 'transparent',
                            color: activeTab === tab.id
                                ? '#fff'
                                : theme.text.secondary,
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            fontSize: 14,
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: 18 }}>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Description */}
            <div style={{ marginBottom: spacing[6] }}>
                <Text size="sm" color="tertiary">
                    {TABS.find(t => t.id === activeTab)?.description}
                </Text>
            </div>

            {/* Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: spacing[6]
            }}>
                {items.map(item => (
                    <Card
                        key={item.id}
                        surface="layer1"
                        padding="lg"
                        hoverable={true}
                        onClick={() => handleItemClick(item)}
                        style={{
                            cursor: 'pointer',
                            opacity: (item.status === 'planned' && activeTab !== 'marketplace') ? 0.6 : 1
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: spacing[4]
                        }}>
                            <div style={{
                                fontSize: 32,
                                lineHeight: 1
                            }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[2],
                                    marginBottom: spacing[2]
                                }}>
                                    <Text size="lg" weight="bold" color="primary">
                                        {item.title}
                                    </Text>
                                    {item.status === 'planned' && (
                                        <span style={{
                                            fontSize: 9,
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            background: 'rgba(255,255,255,0.1)',
                                            color: theme.text.tertiary,
                                            textTransform: 'uppercase',
                                            fontWeight: 700
                                        }}>
                                            BREVE
                                        </span>
                                    )}
                                    {item.status === 'coming-soon' && (
                                        <span style={{
                                            fontSize: 9,
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            background: 'rgba(50, 215, 75, 0.15)',
                                            color: '#32d74b',
                                            textTransform: 'uppercase',
                                            fontWeight: 700
                                        }}>
                                            PREVIEW
                                        </span>
                                    )}
                                    {item.status === 'installed' && (
                                        <span style={{
                                            fontSize: 9,
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            color: '#3b82f6',
                                            textTransform: 'uppercase',
                                            fontWeight: 700
                                        }}>
                                            INSTALADO
                                        </span>
                                    )}
                                </div>
                                <Text size="sm" color="secondary">
                                    {item.description}
                                </Text>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Footer Note */}
            <div style={{
                marginTop: spacing[12],
                padding: spacing[6],
                background: theme.surface.layer1,
                borderRadius: 12,
                border: `1px solid ${theme.border.subtle}`
            }}>
                <Text size="sm" color="secondary">
                    💡 <strong>ChefIApp Evolve</strong> — Aqui você acompanha a evolução do produto,
                    acessa recursos futuros e encontra equipamentos para expandir sua operação.
                </Text>
            </div>
        </div>
    );
}
