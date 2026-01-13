import React, { useMemo } from 'react';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
}

interface OrderItem {
    id: string;
    productId?: string;
    quantity: number;
}

interface QuickMenuPanelProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    loading?: boolean;
    activeOrderItems?: OrderItem[]; // Para mostrar quantidades já adicionadas
}

export const QuickMenuPanel: React.FC<QuickMenuPanelProps> = ({ 
    items, 
    onAddItem, 
    loading = false,
    activeOrderItems = []
}) => {
    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Calcular quantidade de cada item no pedido ativo
    const itemQuantities = useMemo(() => {
        const quantities: Record<string, number> = {};
        activeOrderItems.forEach(orderItem => {
            const productId = orderItem.productId || orderItem.id;
            quantities[productId] = (quantities[productId] || 0) + orderItem.quantity;
        });
        return quantities;
    }, [activeOrderItems]);

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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: spacing[2] }}>
                                {categoryItems.map(item => {
                                    const quantity = itemQuantities[item.id] || 0;
                                    const hasQuantity = quantity > 0;
                                    
                                    return (
                                        <Card
                                            key={item.id}
                                            surface={hasQuantity ? "layer1" : "layer2"}
                                            padding="md"
                                            hoverable
                                            onClick={() => onAddItem(item)}
                                            data-testid={`product-card-${item.id}`}
                                            style={{
                                                cursor: 'pointer',
                                                border: hasQuantity ? `2px solid ${colors.action.base}` : undefined,
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                                                {/* Nome e Badge de Quantidade */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <Text 
                                                        size="sm" 
                                                        weight="bold" 
                                                        style={{ flex: 1, lineHeight: 1.2 }}
                                                    >
                                                        {item.name}
                                                    </Text>
                                                    {hasQuantity && (
                                                        <div style={{ marginLeft: spacing[1] }}>
                                                            <Badge
                                                                status="ready"
                                                                label={quantity.toString()}
                                                                variant="solid"
                                                                size="sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Preço */}
                                                <Text size="xs" color="secondary" weight="semibold">
                                                    €{item.price.toFixed(2)}
                                                </Text>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
