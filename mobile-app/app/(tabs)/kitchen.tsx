import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder, Order } from '@/context/OrderContext';

export default function KitchenScreen() {
    const { orders, updateOrderStatus } = useOrder();

    // KDS Logic:
    // 1. Show only 'pending' or 'preparing'
    // 2. Hide completed orders (ready/delivered)
    const activeOrders = orders.filter(o =>
        o.status === 'pending' || o.status === 'preparing'
    );

    const handleBump = (orderId: string) => {
        updateOrderStatus(orderId, 'ready');
        Alert.alert("Pedido Pronto!", "Garçons foram notificados.");
    };

    const renderTicket = ({ item }: { item: Order }) => {
        // Determine header color based on status/time (simplified)
        const headerColor = item.status === 'pending' ? '#ff9500' : '#5856d6';

        return (
            <View style={styles.ticket}>
                <View style={[styles.ticketHeader, { backgroundColor: headerColor }]}>
                    <Text style={styles.ticketTitle}>Mesa {item.table}</Text>
                    <Text style={styles.ticketTime}>
                        {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View style={styles.ticketBody}>
                    {item.items.map((i, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.qty}>{i.quantity}</Text>
                            <Text style={styles.itemName}>{i.name}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.bumpButton}
                    onPress={() => handleBump(item.id)}
                >
                    <Text style={styles.bumpText}>BUMP (PRONTO)</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ShiftGate>
            <View style={styles.container}>
                <Text style={styles.screenTitle}>👨‍🍳 Cozinha - Fila de Pedidos</Text>
                <FlatList
                    data={activeOrders}
                    renderItem={renderTicket}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    numColumns={2} // Grid Layout for Tickets
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Cozinha Livre! 👨‍🍳</Text>
                        </View>
                    }
                />
            </View>
        </ShiftGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c1e',
        padding: 10,
    },
    screenTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#666',
        fontSize: 18,
        fontWeight: '600',
    },
    // Ticket Styles
    ticket: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        margin: 6,
        overflow: 'hidden', // for header radius
        minWidth: '45%', // ensure 2 columns
        maxWidth: '48%',
    },
    ticketHeader: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ticketTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    ticketTime: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    ticketBody: {
        padding: 10,
        minHeight: 100,
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    qty: {
        fontWeight: '900',
        width: 24,
        fontSize: 16,
        color: '#000',
    },
    itemName: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    bumpButton: {
        backgroundColor: '#32d74b',
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bumpText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
});
