import React, { useState } from 'react';
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
import { Order, OrderItem } from '@/context/OrderContext';

interface SplitOrderModalProps {
    visible: boolean;
    order: Order | null;
    onClose: () => void;
    onConfirm: (itemIds: string[]) => void;
}

export function SplitOrderModal({ visible, order, onClose, onConfirm }: SplitOrderModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    if (!order) return null;

    const toggleSelection = (itemId: string) => {
        HapticFeedback.light();
        setSelectedIds(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const handleConfirm = () => {
        if (selectedIds.length === 0) {
            Alert.alert("Erro", "Selecione pelo menos um item para mover.");
            return;
        }
        if (selectedIds.length === order.items.length) {
            Alert.alert("Erro", "Não é possível mover todos os itens. Use 'Mudar Mesa' ao invés disso.");
            return; // Or allow it logic-wise, but strictly "Split" implies leaving something behind? 
            // Actually, moving all is just a transfer. Allow it? 
            // Let's block it for now to avoid empty orders.
        }

        Alert.alert(
            "Confirmar Divisão",
            `Mover ${selectedIds.length} itens para um NOVO pedido?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: () => {
                        onConfirm(selectedIds);
                        setSelectedIds([]); // Reset
                    }
                }
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Dividir Pedido</Text>
                            <Text style={styles.subtitle}>Selecione itens para mover para um novo pedido</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {/* Items List */}
                    <FlatList
                        data={order.items}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <TouchableOpacity
                                    style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                                    onPress={() => toggleSelection(item.id)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons
                                            name={isSelected ? "checkbox" : "square-outline"}
                                            size={24}
                                            color={isSelected ? "#d4a574" : "#666"}
                                        />
                                        <View>
                                            <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                    {item.notes && (
                                        <Text style={{ color: '#888', fontStyle: 'italic', fontSize: 12 }}>{item.notes}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />

                    {/* Footer Stats */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Movendo {selectedIds.length} itens
                        </Text>
                        <TouchableOpacity
                            style={[styles.confirmBtn, selectedIds.length === 0 && styles.btnDisabled]}
                            disabled={selectedIds.length === 0}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmBtnText}>Criar Novo Pedido</Text>
                            <Ionicons name="arrow-forward" size={20} color="#000" />
                        </TouchableOpacity>
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
        maxHeight: '80%',
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
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#2a2a2a',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemRowSelected: {
        borderColor: '#d4a574',
        backgroundColor: '#3a2a1a', // Slight gold tint
    },
    itemName: {
        color: '#ccc',
        fontSize: 16,
        fontWeight: '500',
    },
    itemNameSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    itemPrice: {
        color: '#888',
        fontSize: 14,
    },
    footer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        color: '#888',
        fontSize: 14,
    },
    confirmBtn: {
        backgroundColor: '#d4a574',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 8,
    },
    btnDisabled: {
        backgroundColor: '#444',
        opacity: 0.5,
    },
    confirmBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
