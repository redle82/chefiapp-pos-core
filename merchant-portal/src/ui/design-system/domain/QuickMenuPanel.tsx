import React from 'react';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { colors } from '../tokens/colors';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
}

interface QuickMenuPanelProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    loading?: boolean;
}

export const QuickMenuPanel: React.FC<QuickMenuPanelProps> = ({ items, onAddItem, loading = false }) => {
    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${colors.border.subtle}` }}>
                <Text size="lg" weight="bold" color="primary">Menu Rápido</Text>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loading ? (
                    <Text size="sm" color="tertiary">Carregando menu...</Text>
                ) : items.length === 0 ? (
                    <Text size="sm" color="tertiary">Nenhum item no menu. Adicione itens em Configurações → Menu.</Text>
                ) : (
                    Object.entries(groupedItems).map(([category, categoryItems]) => (
                        <div key={category}>
                            <div style={{ marginBottom: 8 }}>
                                <Text size="xs" weight="bold" color="tertiary">
                                    {category.toUpperCase()}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {categoryItems.map(item => (
                                    <Card
                                        key={item.id}
                                        surface="layer2"
                                        padding="sm"
                                        hoverable
                                        onClick={() => onAddItem(item)}
                                        data-testid={`product-card-${item.id}`}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text size="sm" weight="bold">{item.name}</Text>
                                            <Text size="sm" color="secondary" weight="bold">€{item.price.toFixed(2)}</Text>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
