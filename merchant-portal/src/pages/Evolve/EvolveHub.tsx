import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';

type TabId = 'vision' | 'store';

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
        id: 'store',
        label: 'Loja',
        icon: '🛍️',
        description: 'Equipamentos, kits TPV e acessórios'
    }
];

// Vision section items
const VISION_ITEMS = [
    {
        id: 'roadmap',
        title: 'Roadmap',
        description: 'Funcionalidades planeadas e em desenvolvimento',
        icon: '🚀',
        status: 'coming-soon' as const,
        action: '/app/coming-soon?module=product_roadmap'
    },
    {
        id: 'status',
        title: 'Status MVP',
        description: 'Estado atual das funcionalidades core',
        icon: '🏗️',
        status: 'coming-soon' as const,
        action: '/app/coming-soon?module=product_status'
    },
    {
        id: 'changelog',
        title: 'Changelog',
        description: 'Histórico de atualizações e melhorias',
        icon: '📝',
        status: 'planned' as const,
        action: null
    }
];

// Store section items
const STORE_ITEMS = [
    {
        id: 'tpv-kits',
        title: 'Kits TPV',
        description: 'Equipamentos completos para ponto de venda',
        icon: '🖥️',
        status: 'planned' as const,
        action: '/app/store/tpv-kits'
    },
    {
        id: 'printers',
        title: 'Impressoras',
        description: 'Impressoras térmicas e de etiquetas',
        icon: '🖨️',
        status: 'planned' as const,
        action: null
    },
    {
        id: 'accessories',
        title: 'Acessórios',
        description: 'Gavetas, leitores de código, suportes',
        icon: '🔌',
        status: 'planned' as const,
        action: null
    }
];

export function EvolveHub() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('vision');
    const theme = colors.modes.dashboard;

    const items = activeTab === 'vision' ? VISION_ITEMS : STORE_ITEMS;

    const handleItemClick = (action: string | null) => {
        if (action) {
            navigate(action);
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
                        hoverable={!!item.action}
                        onClick={() => handleItemClick(item.action)}
                        style={{
                            cursor: item.action ? 'pointer' : 'default',
                            opacity: item.status === 'planned' ? 0.6 : 1
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
