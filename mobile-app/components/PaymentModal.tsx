import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/services/haptics';

export type PaymentMethod = 'CASH' | 'CARD' | 'PIX';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (method: PaymentMethod, amount: number) => void;
    totalAmount: number;
    tableId?: string;
}

export function PaymentModal({ visible, onClose, onConfirm, totalAmount, tableId }: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [amount, setAmount] = useState(totalAmount.toFixed(2));

    const handleConfirm = () => {
        if (!selectedMethod) return;
        HapticFeedback.success();
        onConfirm(selectedMethod, parseFloat(amount));
        onClose();
    };

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
        HapticFeedback.medium();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Pagamento Mesa {tableId || '?'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Total */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.label}>Valor Total</Text>
                        <Text style={styles.amountValue}>€{parseFloat(amount).toFixed(2)}</Text>
                    </View>

                    {/* Methods */}
                    <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
                    <View style={styles.methodsGrid}>
                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                selectedMethod === 'CASH' && styles.methodActive
                            ]}
                            onPress={() => handleMethodSelect('CASH')}
                        >
                            <Ionicons name="cash-outline" size={24} color="#FFF" />
                            <Text style={styles.methodText}>Dinheiro</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                selectedMethod === 'CARD' && styles.methodActive
                            ]}
                            onPress={() => handleMethodSelect('CARD')}
                        >
                            <Ionicons name="card-outline" size={24} color="#FFF" />
                            <Text style={styles.methodText}>Cartão</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                selectedMethod === 'PIX' && styles.methodActive
                            ]}
                            onPress={() => handleMethodSelect('PIX')}
                        >
                            <Ionicons name="qr-code-outline" size={24} color="#FFF" />
                            <Text style={styles.methodText}>Pix</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            !selectedMethod && styles.disabledButton
                        ]}
                        disabled={!selectedMethod}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.confirmText}>
                            Confirmar Pagamento
                        </Text>
                    </TouchableOpacity>
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
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    label: {
        color: '#888',
        fontSize: 14,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    amountValue: {
        color: '#32D74B',
        fontSize: 48,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    methodsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    methodButton: {
        flex: 1,
        backgroundColor: '#333',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    methodActive: {
        borderColor: '#32D74B',
        backgroundColor: '#0a2a0a',
    },
    methodText: {
        color: '#FFF',
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: '#32D74B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    confirmText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
