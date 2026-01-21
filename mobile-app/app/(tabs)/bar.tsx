import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder, Order } from '@/context/OrderContext';

export default function BarScreen() {
    const { orders, updateOrderStatus } = useOrder();

    // Bar Logic: Same as Kitchen for now. 
    // TODO: Filter only orders containing Drinks
    const activeOrders = orders.filter(o =>
        o.status === 'pending' || o.status === 'preparing'
    );

    const handleBump = (orderId: string) => {
        updateOrderStatus(orderId, 'ready');
        Alert.alert("Bebidas Prontas!", "Garçons foram notificados.");
    };

    const renderTicket = ({ item }: { item: Order }) => {
        return (
            <View style={styles.ticket}>
                <View style={styles.ticketHeader}>
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
                    <Text style={styles.bumpText}>PRONTO</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ShiftGate>
            <View style={styles.container}>
                <Text style={styles.screenTitle}>🍸 Bar Station</Text>
                <FlatList
                    data={activeOrders}
                    renderItem={renderTicket}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    numColumns={2}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Bar Livre! 🍸</Text>
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
        backgroundColor: '#000030', // Deep Blue for Bar
        padding: 10,
    },
    screenTitle: {
        color: '#00bfff',
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
        color: '#00bfff',
        fontSize: 18,
        fontWeight: '600',
    },
    ticket: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        margin: 6,
        overflow: 'hidden',
        minWidth: '45%',
        maxWidth: '48%',
        borderWidth: 2,
        borderColor: '#007aff',
    },
    ticketHeader: {
        backgroundColor: '#007aff',
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
        minHeight: 80,
        backgroundColor: '#e6f2ff', // light blue tint
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    qty: {
        fontWeight: '900',
        width: 24,
        fontSize: 16,
        color: '#004080',
    },
    itemName: {
        flex: 1,
        fontSize: 15,
        color: '#003366',
        fontWeight: '500',
    },
    bumpButton: {
        backgroundColor: '#00bfff',
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bumpText: {
        color: '#002633',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
});
