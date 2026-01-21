import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert
} from 'react-native';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder, Order } from '@/context/OrderContext';

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
    const { orders, updateOrderStatus } = useOrder();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const handleAction = (action: string) => {
        if (!selectedOrder) return;

        switch (action) {
            case 'delivery':
                updateOrderStatus(selectedOrder.id, 'delivered');
                Alert.alert("Pedido Entregue", "O pedido foi marcado como entregue.");
                break;
            case 'cancel':
                // In a real app, this would delete or set status to 'cancelled'
                Alert.alert("Cancelar", "Funcionalidade de cancelamento total em breve (Requer permissão de Gerente).");
                break;
            case 'print':
                Alert.alert("Imprimir", "Enviando para impressora térmica...");
                break;
        }
        setSelectedOrder(null);
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
            <View style={styles.orderHeader}>
                <Text style={styles.tableName}>Mesa {item.table}</Text>
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
        <ShiftGate>
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

                {/* Details / Actions Modal */}
                <Modal
                    visible={!!selectedOrder}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setSelectedOrder(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Ações do Pedido</Text>
                            {selectedOrder && (
                                <View style={styles.modalInfo}>
                                    <Text style={styles.infoText}>Mesa: {selectedOrder.table}</Text>
                                    <Text style={styles.infoText}>Estado: {STATUS_LABELS[selectedOrder.status]}</Text>
                                    <Text style={styles.infoText}>Total: €{selectedOrder.total.toFixed(2)}</Text>
                                </View>
                            )}

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.printBtn]}
                                    onPress={() => handleAction('print')}
                                >
                                    <Text style={styles.btnText}>🖨️ Imprimir Ticket</Text>
                                </TouchableOpacity>

                                {selectedOrder?.status === 'ready' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.deliveryBtn]}
                                        onPress={() => handleAction('delivery')}
                                    >
                                        <Text style={styles.btnText}>✅ Marcar Entregue</Text>
                                    </TouchableOpacity>
                                )}

                                {selectedOrder?.status === 'pending' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.cancelBtn]}
                                        onPress={() => handleAction('cancel')}
                                    >
                                        <Text style={styles.btnText}>🚫 Cancelar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedOrder(null)}
                            >
                                <Text style={styles.closeButtonText}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </ShiftGate>
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
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalInfo: {
        marginBottom: 20,
        alignItems: 'center',
    },
    infoText: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 8,
    },
    actionButtons: {
        width: '100%',
        gap: 12,
        marginBottom: 20,
    },
    actionBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    printBtn: {
        backgroundColor: '#333',
    },
    deliveryBtn: {
        backgroundColor: '#32d74b',
    },
    cancelBtn: {
        backgroundColor: '#ff453a',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 10,
    },
    closeButtonText: {
        color: '#888',
        fontSize: 16,
    },
});
