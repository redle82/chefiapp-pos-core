import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/services/haptics';

interface SplitBillModalProps {
    visible: boolean;
    total: number;
    onClose: () => void;
    onConfirm: (payments: number[]) => void;
}

export function SplitBillModal({ visible, total, onClose, onConfirm }: SplitBillModalProps) {
    const [splitCount, setSplitCount] = useState(2);
    const [customAmounts, setCustomAmounts] = useState<string[]>([]);
    const [mode, setMode] = useState<'equal' | 'custom'>('equal');

    const perPerson = total / splitCount;
    const remaining = mode === 'custom'
        ? total - customAmounts.reduce((sum, a) => sum + (parseFloat(a) || 0), 0)
        : 0;

    useEffect(() => {
        if (mode === 'custom') {
            setCustomAmounts(Array(splitCount).fill(''));
        }
    }, [splitCount, mode]);

    const handleConfirm = () => {
        if (mode === 'equal') {
            const payments = Array(splitCount).fill(perPerson);
            HapticFeedback.success();
            onConfirm(payments);
        } else {
            if (Math.abs(remaining) > 0.01) {
                Alert.alert('Erro', 'Os valores não somam o total da conta');
                return;
            }
            const payments = customAmounts.map(a => parseFloat(a) || 0);
            HapticFeedback.success();
            onConfirm(payments);
        }
    };

    const updateCustomAmount = (index: number, value: string) => {
        const newAmounts = [...customAmounts];
        newAmounts[index] = value;
        setCustomAmounts(newAmounts);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Dividir Conta</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {/* Total */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total da Conta</Text>
                        <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
                    </View>

                    {/* Mode Toggle */}
                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'equal' && styles.modeBtnActive]}
                            onPress={() => setMode('equal')}
                        >
                            <Text style={[styles.modeBtnText, mode === 'equal' && styles.modeBtnTextActive]}>
                                Dividir Igual
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'custom' && styles.modeBtnActive]}
                            onPress={() => setMode('custom')}
                        >
                            <Text style={[styles.modeBtnText, mode === 'custom' && styles.modeBtnTextActive]}>
                                Valores Manuais
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Split Count */}
                    <View style={styles.countRow}>
                        <Text style={styles.countLabel}>Número de Pessoas</Text>
                        <View style={styles.countControls}>
                            <TouchableOpacity
                                style={styles.countBtn}
                                onPress={() => setSplitCount(Math.max(2, splitCount - 1))}
                            >
                                <Ionicons name="remove" size={20} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.countValue}>{splitCount}</Text>
                            <TouchableOpacity
                                style={styles.countBtn}
                                onPress={() => setSplitCount(Math.min(10, splitCount + 1))}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Equal Split Display */}
                    {mode === 'equal' && (
                        <View style={styles.resultBox}>
                            <Text style={styles.resultLabel}>Cada pessoa paga</Text>
                            <Text style={styles.resultValue}>€{perPerson.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* Custom Amounts */}
                    {mode === 'custom' && (
                        <View style={styles.customAmounts}>
                            {customAmounts.map((amount, idx) => (
                                <View key={idx} style={styles.customRow}>
                                    <Text style={styles.customLabel}>Pessoa {idx + 1}</Text>
                                    <TextInput
                                        style={styles.customInput}
                                        value={amount}
                                        onChangeText={(v) => updateCustomAmount(idx, v)}
                                        keyboardType="decimal-pad"
                                        placeholder="0.00"
                                        placeholderTextColor="#666"
                                    />
                                </View>
                            ))}
                            <View style={styles.remainingRow}>
                                <Text style={styles.remainingLabel}>Restante</Text>
                                <Text style={[
                                    styles.remainingValue,
                                    Math.abs(remaining) < 0.01 ? styles.remainingOk : styles.remainingBad
                                ]}>
                                    €{remaining.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Actions */}
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                        <Ionicons name="checkmark-circle" size={20} color="#000" />
                        <Text style={styles.confirmBtnText}>Confirmar Divisão</Text>
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
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    totalLabel: {
        color: '#888',
        fontSize: 14,
    },
    totalValue: {
        color: '#32d74b',
        fontSize: 24,
        fontWeight: 'bold',
    },
    modeToggle: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#2a2a2a',
    },
    modeBtnActive: {
        backgroundColor: '#d4a574',
    },
    modeBtnText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    modeBtnTextActive: {
        color: '#000',
    },
    countRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    countLabel: {
        color: '#fff',
        fontSize: 16,
    },
    countControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    countBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        minWidth: 30,
        textAlign: 'center',
    },
    resultBox: {
        backgroundColor: '#2a2a2a',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    resultLabel: {
        color: '#888',
        fontSize: 14,
        marginBottom: 8,
    },
    resultValue: {
        color: '#d4a574',
        fontSize: 32,
        fontWeight: 'bold',
    },
    customAmounts: {
        gap: 8,
        marginBottom: 20,
    },
    customRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 12,
        borderRadius: 8,
    },
    customLabel: {
        color: '#fff',
        fontSize: 14,
    },
    customInput: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
        minWidth: 80,
        padding: 4,
    },
    remainingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
        marginTop: 8,
    },
    remainingLabel: {
        color: '#888',
        fontSize: 14,
    },
    remainingValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    remainingOk: {
        color: '#32d74b',
    },
    remainingBad: {
        color: '#ff453a',
    },
    confirmBtn: {
        backgroundColor: '#d4a574',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
    },
    confirmBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
