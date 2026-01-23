import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Order, OrderItem } from '@/context/OrderContext';
import { KitchenOrderCard } from './KitchenOrderCard';
import { useAppStaff, Station } from '@/context/AppStaffContext';

interface ProductionBoardProps {
    orders: Order[];
    now: Date;
    onBump: (orderId: string, currentStatus: Order['status']) => void;
    onRecall: (orderId: string) => void;
    station?: Station;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const IS_TABLET = SCREEN_WIDTH > 700;

export const ProductionBoard: React.FC<ProductionBoardProps> = ({ orders, now, onBump, onRecall, station }) => {
    const { getStationForCategory } = useAppStaff();

    // 1. Group Orders by Status
    const lanes = useMemo(() => {
        const newOrders = orders.filter(o => o.status === 'pending');
        const prepOrders = orders.filter(o => o.status === 'preparing');
        const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'delivered')
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5); // Only show last 5 in Done column to save space
        return { newOrders, prepOrders, readyOrders };
    }, [orders]);

    // 2. Helper to group items for the card
    const groupItems = (items: OrderItem[]) => {
        const grouped: Record<string, { count: number, name: string }> = {};
        items.forEach(i => {
            // Smart Routing (Phase 2.2)
            if (station) {
                const itemStation = getStationForCategory(i.category);
                // If item has a station, it must match.
                // If item has NO station, we default to Kitchen (if this is Kitchen).
                const isMatch = itemStation?.id === station.id || (!itemStation && station.name === 'Cozinha'); // Fallback logic
                if (!isMatch) return;
            } else {
                // Legacy fallback: filter out drinks and others if no station filter provided
                if (i.category === 'drink' || i.category === 'other') return;
            }

            const key = i.name;
            if (!grouped[key]) grouped[key] = { count: 0, name: i.name };
            grouped[key].count++;
        });
        return Object.values(grouped);
    };

    const renderColumn = (title: string, color: string, data: Order[], isDoneCol = false) => (
        <View style={[styles.column, { width: IS_TABLET ? '33%' : (isDoneCol ? '100%' : '50%') }]}>
            <View style={[styles.columnHeader, { borderTopColor: color }]}>
                <Text style={[styles.columnTitle, { color }]}>{title} ({data.length})</Text>
            </View>
            <ScrollView style={styles.columnScroll} contentContainerStyle={{ paddingBottom: 20 }}>
                {data.map(order => (
                    <KitchenOrderCard
                        key={order.id}
                        order={order}
                        now={now}
                        items={groupItems(order.items)}
                        onBump={() => isDoneCol ? onRecall(order.id) : onBump(order.id, order.status)}
                        onLongPress={() => { }}
                    />
                ))}
            </ScrollView>
        </View>
    );

    // If Grid (Tablet), show 3 columns. If Mobile, show 2 columns (New/Prep) and maybe a clear button for Done.
    // Spec: "Abandonamos a grid infinita. Usamos colunas fixas."
    // For MVP Mobile: Let's stack New and Prep side-by-side if they fit, or just render "The Line" (Prep) mainly.
    // Let's stick to a generic Row layout that wraps.

    return (
        <View style={styles.board}>
            {/* Swimlanes */}
            <View style={styles.laneContainer}>
                {renderColumn('A FAZER', '#FFCC00', lanes.newOrders)}
                {renderColumn('PREPARANDO', '#0A84FF', lanes.prepOrders)}
                {IS_TABLET && renderColumn('PRONTO / HISTÓRICO', '#32D74B', lanes.readyOrders, true)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    board: {
        flex: 1,
        backgroundColor: '#000',
    },
    laneContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 4
    },
    column: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#222',
        paddingHorizontal: 4,
        backgroundColor: '#111' // Slight distinction
    },
    columnHeader: {
        paddingVertical: 12,
        borderTopWidth: 4,
        marginBottom: 8,
        backgroundColor: '#1c1c1e',
        alignItems: 'center'
    },
    columnTitle: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1
    },
    columnScroll: {
        flex: 1
    }
});
