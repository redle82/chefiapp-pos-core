// @ts-nocheck
import React from 'react';
import { colors } from '../../../ui/design-system/tokens/colors';
import { Text } from '../../../ui/design-system/primitives/Text';

interface MobileBottomNavProps {
    onNavigate: (tab: string) => void;
    activeTab: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onNavigate, activeTab }) => {
    const tabs = [
        { id: 'tables', label: 'Salão', icon: '🍽️' },
        { id: 'order', label: 'Comanda', icon: '📝' }, // Nova Comanda
        { id: 'menu', label: 'Menu', icon: '📜' },
        { id: 'exit', label: 'Sair', icon: '🚪' }
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
            height: 64, // Touch friendly height
            backgroundColor: colors.surface.layer2,
            borderTop: `1px solid ${colors.border.subtle}`,
            paddingBottom: 'env(safe-area-inset-bottom)', // iPhone home bar safety
        }}>
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            opacity: isActive ? 1 : 0.5,
                            transition: 'opacity 0.2s',
                            padding: 0
                        }}
                    >
                        <Text size="xl">{tab.icon}</Text>
                        <Text size="xs" color={isActive ? 'primary' : 'tertiary'} weight={isActive ? 'bold' : 'regular'}>
                            {tab.label}
                        </Text>
                    </button>
                );
            })}
        </div>
    );
};
