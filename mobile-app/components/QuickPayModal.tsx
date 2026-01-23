import { HapticFeedback } from '@/services/haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface QuickPayModalProps {
    visible: boolean;
    total: number;
    orderId: string;
    order?: { status: string; items: any[] }; // Bug #4 Fix: Receber order para validação
    onClose: () => void;
    onConfirm: (method: PaymentMethod, tip: number) => void;
    onSplitBill?: (itemIds: string[]) => void; // ERRO-009 Fix: Callback para dividir conta
}

export type PaymentMethod = 'cash' | 'card' | 'pix';

const PAYMENT_ICONS: Record<PaymentMethod, string> = {
    cash: 'cash-outline',
    card: 'card-outline',
    pix: 'qr-code-outline',
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    cash: 'Dinheiro',
    card: 'Cartão',
    pix: 'PIX',
};

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
    cash: '#32d74b',
    card: '#5856d6',
    pix: '#00b3a7',
};

import { useAppStaff } from '@/context/AppStaffContext'; // Added

export function QuickPayModal({ visible, total, orderId, order, onClose, onConfirm, onSplitBill }: QuickPayModalProps) {
    const { financialState } = useAppStaff(); // Added
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [tipPercent, setTipPercent] = useState(0);
    const [customTip, setCustomTip] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(0));
    // ERRO-004 Fix: Estado de processamento para prevenir duplo clique
    const [processing, setProcessing] = useState(false);
    // ERRO-004 Fix: Ref síncrono para evitar race condition
    const processingRef = useRef(false);
    // ERRO-004 Fix: Timestamp do último clique para debounce
    const lastClickRef = useRef<number>(0);
    // ERRO-009 Fix: Estado para dividir conta
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Bug #7 Fix: Validação de input para gorjeta
    const tipAmount = useMemo(() => {
        if (tipPercent > 0) {
            return (total * tipPercent) / 100;
        }
        if (customTip.trim()) {
            const parsed = parseFloat(customTip.replace(',', '.'));
            if (isNaN(parsed) || parsed < 0) {
                return 0;
            }
            // Limitar gorjeta a 50% do total (razoável)
            return Math.min(parsed, total * 0.5);
        }
        return 0;
    }, [tipPercent, customTip, total]);

    const grandTotal = total + tipAmount;

    const handleConfirm = async () => {
        // ERRO-004 Fix: Prevenir duplo clique - verificação síncrona com ref
        if (processingRef.current) return;

        // ERRO-004 Fix: Debounce de 500ms mínimo entre cliques
        const now = Date.now();
        if (now - lastClickRef.current < 500) {
            return;
        }
        lastClickRef.current = now;

        if (!selectedMethod) {
            Alert.alert('Erro', 'Selecione um método de pagamento');
            return;
        }

        // ERRO-004 Fix: Lock síncrono (ref) + assíncrono (state) antes de qualquer validação
        processingRef.current = true;
        setProcessing(true);

        // Bug #4 Fix: Validação obrigatória antes de permitir pagamento
        if (order) {
            try {
                const { canPayOrder } = await import('@/utils/orderValidation');
                const validation = canPayOrder(order as any);
                if (!validation.canPay) {
                    processingRef.current = false; // ERRO-004 Fix: Unlock ref
                    setProcessing(false); // Unlock se validação falhar
                    Alert.alert('Pagamento Bloqueado', validation.reason || 'Pedido não pode ser pago.');
                    return;
                }
            } catch (e) {
                console.error('[QuickPayModal] Error validating order:', e);
                processingRef.current = false; // ERRO-004 Fix: Unlock ref
                setProcessing(false); // Unlock se erro
                Alert.alert('Erro', 'Não foi possível validar o pedido.');
                return;
            }
        }

        // Phase 35: Financial Isolation Check
        if (selectedMethod === 'cash' && financialState === 'drawer_closed') {
            processingRef.current = false; // ERRO-004 Fix: Unlock ref
            setProcessing(false); // Unlock se caixa fechado
            Alert.alert(
                'Caixa Fechado',
                'Você precisa abrir seu cofre (caixa) antes de receber pagamentos em dinheiro.',
                [{ text: 'Entendi', style: 'default' }]
            );
            return;
        }

        // ERRO-004 Fix: Confirmação contextual obrigatória para valores > €100 ou múltiplos pagamentos recentes
        const needsConfirmation = grandTotal > 100;
        const confirmationTitle = needsConfirmation
            ? '⚠️ Confirmar Pagamento (Valor Alto)'
            : 'Confirmar Pagamento';
        const confirmationMessage = needsConfirmation
            ? `Valor total: €${grandTotal.toFixed(2)}\n${tipAmount > 0 ? `Gorjeta: €${tipAmount.toFixed(2)}\n` : ''}Método: ${PAYMENT_LABELS[selectedMethod]}\n\n⚠️ Valor acima de €100. Confirme o valor antes de processar.`
            : `Valor total: €${grandTotal.toFixed(2)}\n${tipAmount > 0 ? `Gorjeta: €${tipAmount.toFixed(2)}\n` : ''}Método: ${PAYMENT_LABELS[selectedMethod]}`;

        // ERRO-010 Fix: Confirmação final com valor destacado antes de processar
        Alert.alert(
            confirmationTitle,
            confirmationMessage,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                    onPress: () => {
                        processingRef.current = false; // ERRO-004 Fix: Unlock ref
                        setProcessing(false); // Unlock se cancelar
                    }
                },
                {
                    text: 'Confirmar',
                    style: needsConfirmation ? 'destructive' : 'default',
                    onPress: () => {
                        // ERRO-004 Fix: Manter lock durante processamento
                        // Show success animation
                        setShowSuccess(true);
                        HapticFeedback.success();

                        Animated.spring(scaleAnim, {
                            toValue: 1,
                            friction: 3,
                            tension: 40,
                            useNativeDriver: true,
                        }).start();

                        // After animation, confirm
                        setTimeout(() => {
                            onConfirm(selectedMethod, tipAmount);
                            setShowSuccess(false);
                            scaleAnim.setValue(0);
                            setSelectedMethod(null);
                            setTipPercent(0);
                            setCustomTip('');
                            processingRef.current = false; // ERRO-004 Fix: Unlock ref após processamento
                            setProcessing(false); // ERRO-004 Fix: Unlock após processamento
                        }, 1500);
                    }
                }
            ]
        );
    };

    const tipOptions = [0, 5, 10, 15];

    if (showSuccess) {
        return (
            <Modal visible={visible} animationType="fade" transparent>
                <View style={styles.successOverlay}>
                    <Animated.View style={[styles.successBox, { transform: [{ scale: scaleAnim }] }]}>
                        <Ionicons name="checkmark-circle" size={80} color="#32d74b" />
                        <Text style={styles.successText}>Pagamento Confirmado!</Text>
                        <Text style={styles.successAmount}>€{grandTotal.toFixed(2)}</Text>
                        <Text style={styles.successMethod}>{PAYMENT_LABELS[selectedMethod!]}</Text>
                    </Animated.View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Pagamento Rápido</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {/* Order Info */}
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderLabel}>Pedido #{orderId.slice(0, 6)}</Text>
                        <Text style={styles.orderTotal}>€{total.toFixed(2)}</Text>
                    </View>

                    {/* Payment Methods */}
                    <Text style={styles.sectionTitle}>Método de Pagamento</Text>
                    <View style={styles.methodsRow}>
                        {(['cash', 'card', 'pix'] as PaymentMethod[]).map((method) => (
                            <TouchableOpacity
                                key={method}
                                style={[
                                    styles.methodBtn,
                                    selectedMethod === method && {
                                        borderColor: PAYMENT_COLORS[method],
                                        backgroundColor: `${PAYMENT_COLORS[method]}20`,
                                    },
                                ]}
                                onPress={() => {
                                    setSelectedMethod(method);
                                    HapticFeedback.light();
                                }}
                            >
                                <Ionicons
                                    name={PAYMENT_ICONS[method] as any}
                                    size={28}
                                    color={selectedMethod === method ? PAYMENT_COLORS[method] : '#888'}
                                />
                                <Text style={[
                                    styles.methodLabel,
                                    selectedMethod === method && { color: PAYMENT_COLORS[method] }
                                ]}>
                                    {PAYMENT_LABELS[method]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tip Options (only for cash) */}
                    {selectedMethod === 'cash' && (
                        <>
                            <Text style={styles.sectionTitle}>Gorjeta (Opcional)</Text>
                            <View style={styles.tipRow}>
                                {tipOptions.map((percent) => (
                                    <TouchableOpacity
                                        key={percent}
                                        style={[
                                            styles.tipBtn,
                                            tipPercent === percent && styles.tipBtnActive,
                                        ]}
                                        onPress={() => {
                                            setTipPercent(percent);
                                            setCustomTip('');
                                        }}
                                    >
                                        <Text style={[
                                            styles.tipText,
                                            tipPercent === percent && styles.tipTextActive,
                                        ]}>
                                            {percent === 0 ? 'Sem' : `${percent}%`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={styles.customTipInput}
                                placeholder="Valor personalizado (€)"
                                placeholderTextColor="#666"
                                keyboardType="decimal-pad"
                                value={customTip}
                                onChangeText={(v) => {
                                    // Bug #7 Fix: Validar apenas números e vírgula/ponto
                                    const sanitized = v.replace(/[^0-9,.]/g, '');
                                    // Limitar a 2 casas decimais
                                    const parts = sanitized.split(/[,.]/);
                                    if (parts.length > 2) {
                                        return; // Não permitir múltiplos separadores
                                    }
                                    if (parts[1] && parts[1].length > 2) {
                                        return; // Limitar a 2 casas decimais
                                    }
                                    setCustomTip(sanitized);
                                    setTipPercent(0);
                                }}
                            />
                        </>
                    )}

                    {/* Grand Total */}
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>Total a Pagar</Text>
                        <Text style={styles.grandTotalValue}>€{grandTotal.toFixed(2)}</Text>
                    </View>

                    {/* ERRO-009 Fix: Botão dividir conta */}
                    {onSplitBill && order?.items && order.items.length > 1 && (
                        <TouchableOpacity
                            style={styles.splitBtn}
                            onPress={() => setShowSplitModal(true)}
                        >
                            <Ionicons name="cut-outline" size={20} color="#0a84ff" />
                            <Text style={styles.splitBtnText}>Dividir Conta</Text>
                        </TouchableOpacity>
                    )}

                    {/* Confirm Button */}
                    {/* ERRO-004 Fix: Desabilitar botão durante processamento */}
                    <TouchableOpacity
                        style={[
                            styles.confirmBtn,
                            selectedMethod && !processing && { backgroundColor: PAYMENT_COLORS[selectedMethod] },
                            processing && { backgroundColor: '#666', opacity: 0.6 }
                        ]}
                        onPress={handleConfirm}
                        disabled={!selectedMethod || processing}
                    >
                        {processing ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.confirmBtnText}>Processando...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.confirmBtnText}>Confirmar Pagamento</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Receipt Options */}
                    <View style={styles.receiptRow}>
                        <TouchableOpacity style={styles.receiptBtn}>
                            <Ionicons name="print-outline" size={20} color="#888" />
                            <Text style={styles.receiptText}>Imprimir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.receiptBtn}>
                            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                            <Text style={styles.receiptText}>WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.receiptBtn}>
                            <Ionicons name="mail-outline" size={20} color="#888" />
                            <Text style={styles.receiptText}>Email</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ERRO-009 Fix: Modal para dividir conta */}
            <Modal visible={showSplitModal} animationType="slide" transparent>
                <View style={styles.splitModalOverlay}>
                    <View style={styles.splitModalContainer}>
                        <View style={styles.splitModalHeader}>
                            <Text style={styles.splitModalTitle}>Dividir Conta</Text>
                            <TouchableOpacity onPress={() => {
                                setShowSplitModal(false);
                                setSelectedItems([]);
                            }}>
                                <Ionicons name="close" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.splitModalSubtitle}>Selecione os itens para dividir:</Text>

                        <ScrollView style={styles.splitItemsList}>
                            {order?.items.map((item: any) => {
                                const isSelected = selectedItems.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.splitItemRow,
                                            isSelected && styles.splitItemRowSelected
                                        ]}
                                        onPress={() => {
                                            if (isSelected) {
                                                setSelectedItems(selectedItems.filter(id => id !== item.id));
                                            } else {
                                                setSelectedItems([...selectedItems, item.id]);
                                            }
                                        }}
                                    >
                                        <Ionicons
                                            name={isSelected ? "checkbox" : "checkbox-outline"}
                                            size={24}
                                            color={isSelected ? "#0a84ff" : "#888"}
                                        />
                                        <View style={styles.splitItemInfo}>
                                            <Text style={styles.splitItemName}>{item.name}</Text>
                                            <Text style={styles.splitItemPrice}>
                                                €{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.splitModalFooter}>
                            <TouchableOpacity
                                style={[styles.splitConfirmBtn, selectedItems.length === 0 && styles.splitConfirmBtnDisabled]}
                                onPress={() => {
                                    if (selectedItems.length > 0 && onSplitBill) {
                                        onSplitBill(selectedItems);
                                        setShowSplitModal(false);
                                        setSelectedItems([]);
                                        onClose(); // Fechar QuickPayModal após dividir
                                    }
                                }}
                                disabled={selectedItems.length === 0}
                            >
                                <Text style={styles.splitConfirmBtnText}>
                                    Dividir {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    orderInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    orderLabel: {
        color: '#888',
        fontSize: 14,
    },
    orderTotal: {
        fontSize: 32, // ERRO-023 Fix: Valor total maior
        fontWeight: 'bold',
        color: '#d4a574', // ERRO-023 Fix: Cor destacada (dourado)
    },
    sectionTitle: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    methodsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    methodBtn: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    methodLabel: {
        color: '#888',
        fontSize: 12,
        marginTop: 8,
        fontWeight: '600',
    },
    tipRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    tipBtn: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
    },
    tipBtnActive: {
        backgroundColor: '#d4a574',
    },
    tipText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    tipTextActive: {
        color: '#000',
    },
    customTipInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    grandTotalLabel: {
        color: '#888',
        fontSize: 16,
    },
    grandTotalValue: {
        color: '#d4a574', // ERRO-023 Fix: Cor destacada (dourado)
        fontSize: 32, // ERRO-023 Fix: Valor total maior
        fontWeight: 'bold',
    },
    confirmBtn: {
        backgroundColor: '#666',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    receiptBtn: {
        alignItems: 'center',
        gap: 4,
    },
    receiptText: {
        color: '#888',
        fontSize: 11,
    },
    // Success screen
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successBox: {
        alignItems: 'center',
        padding: 40,
    },
    successText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
    },
    successAmount: {
        color: '#32d74b',
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 8,
    },
    successMethod: {
        color: '#888',
        fontSize: 16,
        marginTop: 8,
    },
    // ERRO-009 Fix: Estilos para dividir conta
    splitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#0a84ff',
    },
    splitBtnText: {
        color: '#0a84ff',
        fontSize: 14,
        fontWeight: '600',
    },
    splitModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    splitModalContainer: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    splitModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    splitModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    splitModalSubtitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 16,
    },
    splitItemsList: {
        maxHeight: 300,
        marginBottom: 16,
    },
    splitItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
    },
    splitItemRowSelected: {
        backgroundColor: '#0a84ff20',
        borderWidth: 1,
        borderColor: '#0a84ff',
    },
    splitItemInfo: {
        flex: 1,
    },
    splitItemName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    splitItemPrice: {
        color: '#888',
        fontSize: 14,
        marginTop: 4,
    },
    splitModalFooter: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    splitConfirmBtn: {
        backgroundColor: '#0a84ff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    splitConfirmBtnDisabled: {
        backgroundColor: '#666',
        opacity: 0.5,
    },
    splitConfirmBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
