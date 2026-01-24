import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/services/haptics';
import { Order } from '@/context/OrderContext';

interface TableSelectorModalProps {
    visible: boolean;
    currentTableId: number;
    activeOrders: Order[];
    onClose: () => void;
    onSelectTable: (tableId: number, isOccupied: boolean) => void;
}

export function TableSelectorModal({ visible, currentTableId, activeOrders, onClose, onSelectTable }: TableSelectorModalProps) {
    if (!visible) return null;

    // Generate tables 1-20 (Hardcoded for now as per app standard, or fetch from config if available)
    // Assuming 20 tables for MVP.
    const tables = Array.from({ length: 20 }, (_, i) => i + 1);

    const getTableStatus = (tableId: number) => {
        const order = activeOrders.find(o => parseInt(o.table, 10) === tableId && ['pending', 'preparing', 'ready', 'delivered'].includes(o.status));
        return !!order;
    };

    const handlePress = (tableId: number) => {
        if (tableId === currentTableId) return;
        const occupied = getTableStatus(tableId);
        HapticFeedback.light();
        onSelectTable(tableId, occupied);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Selecionar Mesa</Text>
                            <Text style={styles.subtitle}>Para onde deseja mover este pedido?</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {/* Grid */}
                    <FlatList
                        data={tables}
                        keyExtractor={(item) => item.toString()}
                        numColumns={4}
                        contentContainerStyle={styles.gridContainer}
                        columnWrapperStyle={styles.gridWrapper}
                        renderItem={({ item: tableId }) => {
                            const isCurrent = tableId === currentTableId;
                            const isOccupied = getTableStatus(tableId);

                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.tableItem,
                                        isCurrent && styles.tableCurrent,
                                        !isCurrent && isOccupied && styles.tableOccupied,
                                        !isCurrent && !isOccupied && styles.tableFree
                                    ]}
                                    disabled={isCurrent}
                                    onPress={() => handlePress(tableId)}
                                >
                                    <Text style={[
                                        styles.tableText,
                                        isCurrent && styles.textCurrent,
                                        !isCurrent && isOccupied && styles.textOccupied,
                                        !isCurrent && !isOccupied && styles.textFree
                                    ]}>
                                        {tableId}
                                    </Text>
                                    <Text style={styles.statusText}>
                                        {isCurrent ? 'Atual' : isOccupied ? 'Ocupada' : 'Livre'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />

                    {/* Legend */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: '#32d74b' }]} />
                            <Text style={styles.legendText}>Livre (Mover)</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: '#ff9f0a' }]} />
                            <Text style={styles.legendText}>Ocupada (Juntar)</Text>
                        </View>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#1c1c1e',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    gridContainer: {
        paddingBottom: 20,
    },
    gridWrapper: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tableItem: {
        width: '22%', // 4 per row
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
    },
    tableCurrent: {
        borderColor: '#666',
        backgroundColor: '#333',
        opacity: 0.5,
    },
    tableOccupied: {
        borderColor: '#ff9f0a',
        backgroundColor: 'rgba(255, 159, 10, 0.1)',
    },
    tableFree: {
        borderColor: '#32d74b',
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
    },
    tableText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    textCurrent: { color: '#888' },
    textOccupied: { color: '#ff9f0a' },
    textFree: { color: '#32d74b' },
    statusText: {
        fontSize: 10,
        marginTop: 4,
        color: '#888',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        color: '#ccc',
        fontSize: 12,
    },
});
