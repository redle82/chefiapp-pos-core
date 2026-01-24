
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/services/haptics';

export type PaymentMethod = 'cash' | 'card' | 'pix';

interface FastPaySheetProps {
    visible: boolean;
    total: number;
    onClose: () => void;
    onPay: (method: PaymentMethod) => void;
}

const PAYMENT_OPTIONS: { id: PaymentMethod, label: string, icon: keyof typeof Ionicons.glyphMap, color: string }[] = [
    { id: 'cash', label: 'Dinheiro', icon: 'cash-outline', color: '#32d74b' },
    { id: 'card', label: 'Cartão', icon: 'card-outline', color: '#5856d6' },
    { id: 'pix', label: 'PIX', icon: 'qr-code-outline', color: '#00b3a7' },
];

export function FastPaySheet({ visible, total, onClose, onPay }: FastPaySheetProps) {
    if (!visible) return null;

    const handlePress = (method: PaymentMethod) => {
        HapticFeedback.success();
        onPay(method);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Cobrar €{total.toFixed(2)}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.grid}>
                        {PAYMENT_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.card, { borderColor: opt.color }]}
                                onPress={() => handlePress(opt.id)}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: `${opt.color}20` }]}>
                                    <Ionicons name={opt.icon} size={32} color={opt.color} />
                                </View>
                                <Text style={[styles.label, { color: opt.color }]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
    },
    card: {
        flex: 1,
        aspectRatio: 1, // Square cards
        backgroundColor: '#252525',
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
