import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

interface Order {
    id: string;
    table: string;
    items: { name: string; quantity: number }[];
    total: number;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
    createdAt: Date;
}

const STATUS_COLORS = {
    pending: '#ff9500',
    preparing: '#5856d6',
    ready: '#32d74b',
    delivered: '#666',
};

const STATUS_LABELS = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
};

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        // Mock orders - will connect to real-time later
        const mockOrders: Order[] = [
            {
                id: '1',
                table: 'Mesa 5',
                items: [
                    { name: 'Francesinha', quantity: 2 },
                    { name: 'Imperial', quantity: 2 },
                ],
                total: 30.00,
                status: 'preparing',
                createdAt: new Date(),
            },
            {
                id: '2',
                table: 'Mesa 3',
                items: [
                    { name: 'Bitoque', quantity: 1 },
                    { name: 'Café', quantity: 1 },
                ],
                total: 10.70,
                status: 'pending',
                createdAt: new Date(),
            },
            {
                id: '3',
                table: 'Mesa 8',
                items: [
                    { name: 'Bacalhau à Brás', quantity: 3 },
                ],
                total: 42.00,
                status: 'ready',
                createdAt: new Date(),
            },
        ];
        setOrders(mockOrders);
    }, []);

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.tableName}>{item.table}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                    <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
                </View>
            </View>

            <View style={styles.itemsList}>
                {item.items.map((orderItem, idx) => (
                    <Text key={idx} style={styles.itemText}>
                        {orderItem.quantity}x {orderItem.name}
                    </Text>
                ))}
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>€{item.total.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum pedido ativo</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    list: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tableName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    itemsList: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    itemText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 4,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: '#888',
        fontSize: 14,
    },
    totalValue: {
        color: '#32d74b',
        fontSize: 20,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
});
