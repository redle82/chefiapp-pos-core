// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '../../ui/design-system/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/Button';
import { colors } from '../../ui/design-system/tokens/colors';
import { DashboardService, type LowStockItem } from '../../core/services/DashboardService';

interface LowStockWidgetProps {
    restaurantId: string;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({ restaurantId }) => {
    const [items, setItems] = useState<LowStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [restockingId, setRestockingId] = useState<string | null>(null);

    const fetchItems = () => {
        setLoading(true);
        DashboardService.getLowStockItems(restaurantId)
            .then(setItems)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (restaurantId) fetchItems();
    }, [restaurantId]);

    const handleRestock = async (itemId: string) => {
        setRestockingId(itemId);
        try {
            await DashboardService.restockItem(itemId, 10); // Quick restock 10 units
            // Optimistic update
            setItems(prev => prev.filter(i => i.id !== itemId || (i.stockLevel + 10) <= i.minStockLevel));
            // Or refetch
            fetchItems();
        } catch (error) {
            console.error(error);
        } finally {
            setRestockingId(null);
        }
    };

    if (loading && items.length === 0) {
        return (
            <Card style={{ padding: 24, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text size="sm" color="tertiary">Verificando estoque...</Text>
            </Card>
        );
    }

    if (items.length === 0) {
        return (
            <Card surface="layer1" padding="lg" style={{ height: '100%', minHeight: 180 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Radar de Estoque</Text>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.success.base }} />
                </div>
                <div style={{ height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.6 }}>
                    <Text size="2xl">✅</Text>
                    <Text size="sm" color="tertiary">Tudo em ordem</Text>
                </div>
            </Card>
        );
    }

    return (
        <Card surface="layer1" padding="lg" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Radar de Estoque</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.destructive.base, animation: 'pulse 2s infinite' }} />
                    <Text size="xs" color="destructive" weight="bold">{items.length} ITENS</Text>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                {items.map(item => {
                    const critical = item.stockLevel <= 0;
                    return (
                        <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: 12, borderRadius: 8, backgroundColor: colors.surface.layer2,
                            borderLeft: `3px solid ${critical ? colors.destructive.base : colors.warning.base}`
                        }}>
                            <div>
                                <Text size="sm" weight="bold" color="primary">{item.name}</Text>
                                <Text size="xs" color={critical ? 'destructive' : 'warning'}>
                                    Restam: {item.stockLevel} (Min: {item.minStockLevel})
                                </Text>
                            </div>
                            <Button
                                size="sm"
                                tone={critical ? 'destructive' : 'neutral'}
                                variant="outline"
                                disabled={restockingId === item.id}
                                onClick={() => handleRestock(item.id)}
                            >
                                {restockingId === item.id ? '...' : '+10'}
                            </Button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
            `}</style>
        </Card>
    );
};
