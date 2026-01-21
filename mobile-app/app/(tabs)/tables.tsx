import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder } from '@/context/OrderContext';

// Mock Tables Configuration
const TABLES = Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), label: `Mesa ${i + 1}` }));

export default function TablesScreen() {
    const router = useRouter();
    const { orders, setActiveTable } = useOrder();

    const handleSelectTable = (tableId: string) => {
        setActiveTable(tableId);
        // Navigate to Menu (Cardápio) to start/continue order
        router.push('/(tabs)/index' as any);
    };

    const renderTable = ({ item }: { item: { id: string; label: string } }) => {
        // Check if table has active orders
        // In this MVP, a table is "Occupied" if it has any undelivered orders
        const tableOrders = orders.filter(o => o.table === item.id && o.status !== 'delivered');
        const isOccupied = tableOrders.length > 0;

        // Status color
        const statusColor = isOccupied ? '#ff453a' : '#32d74b'; // Red (Busy) / Green (Free)
        const statusLabel = isOccupied ? `Ocupada (${tableOrders.length})` : 'Livre';

        return (
            <TouchableOpacity
                style={[styles.tableCard, { borderColor: statusColor }]}
                onPress={() => handleSelectTable(item.id)}
            >
                <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                <Text style={styles.tableLabel}>{item.label}</Text>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <ShiftGate>
            <View style={styles.container}>
                <Text style={styles.screenTitle}>🗺️ Mapa de Mesas</Text>
                <FlatList
                    data={TABLES}
                    renderItem={renderTable}
                    keyExtractor={item => item.id}
                    numColumns={3}
                    contentContainerStyle={styles.listContainer}
                />
            </View>
        </ShiftGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        padding: 10,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginVertical: 15,
    },
    listContainer: {
        paddingBottom: 20,
    },
    tableCard: {
        flex: 1,
        backgroundColor: '#1c1c1e',
        margin: 8,
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        minHeight: 120,
    },
    tableLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
