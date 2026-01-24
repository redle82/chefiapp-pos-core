/**
 * FastPayButton - SEMANA 1: FAST PAY
 * 
 * OBJETIVO: 2 toques para cobrar tudo
 * - Auto-seleção do método mais usado
 * - Eliminar modais intermediários
 * - Confirmar = fechar mesa
 * - Tempo médio < 5s
 */

import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrder } from '@/context/OrderContext';
import { HapticFeedback } from '@/services/haptics';
import { useAppStaff } from '@/context/AppStaffContext';
import { canPayOrder } from '@/utils/orderValidation';

type PaymentMethod = 'cash' | 'card' | 'pix';

interface FastPayButtonProps {
    orderId: string;
    total: number;
    tableId: string;
    onSuccess?: () => void;
}

// Auto-detecta método mais usado (simplificado: cash como padrão, pode melhorar depois)
const getDefaultMethod = (): PaymentMethod => {
    // TODO: Buscar do histórico de pagamentos do restaurante/usuário
    // Por enquanto, cash é o mais comum em restaurantes
    return 'cash';
};

export function FastPayButton({ orderId, total, tableId, onSuccess }: FastPayButtonProps) {
    const { quickPay, updateOrderStatus, orders } = useOrder();
    const { financialState } = useAppStaff();
    const [processing, setProcessing] = useState(false);
    // ERRO-004 Fix: Ref síncrono para evitar race condition
    const processingRef = useRef(false);
    // ERRO-004 Fix: Timestamp do último clique para debounce
    const lastClickRef = useRef<number>(0);

    const handleFastPay = async () => {
        // ERRO-004 Fix: Prevenir duplo clique - verificação síncrona com ref
        if (processingRef.current) return;
        
        // ERRO-004 Fix: Debounce de 500ms mínimo entre cliques
        const now = Date.now();
        if (now - lastClickRef.current < 500) {
            return;
        }
        lastClickRef.current = now;

        // Bug #4 Fix: Validação obrigatória antes de permitir pagamento
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const validation = canPayOrder(order);
            if (!validation.canPay) {
                Alert.alert('Pagamento Bloqueado', validation.reason || 'Pedido não pode ser pago.');
                return;
            }
        }

        const defaultMethod = getDefaultMethod();

        // Validação rápida: caixa fechado para cash
        if (defaultMethod === 'cash' && financialState === 'drawer_closed') {
            Alert.alert(
                'Caixa Fechado',
                'Abra o cofre antes de receber dinheiro.',
                [{ text: 'OK' }]
            );
            return;
        }

        // ERRO-004 Fix: Lock síncrono (ref) + assíncrono (state) antes de mostrar alerta
        processingRef.current = true;
        setProcessing(true);

        // ERRO-004 Fix: Confirmação contextual obrigatória para valores > €100
        const needsConfirmation = total > 100;
        const confirmationTitle = needsConfirmation 
            ? '⚠️ Cobrar Tudo (Valor Alto)'
            : 'Cobrar Tudo';
        const confirmationMessage = needsConfirmation
            ? `€${total.toFixed(2)} - ${defaultMethod === 'cash' ? 'Dinheiro' : defaultMethod === 'card' ? 'Cartão' : 'PIX'}\n\n⚠️ Valor acima de €100. Confirme antes de processar.`
            : `€${total.toFixed(2)} - ${defaultMethod === 'cash' ? 'Dinheiro' : defaultMethod === 'card' ? 'Cartão' : 'PIX'}`;

        // Confirmação única e direta
        Alert.alert(
            confirmationTitle,
            confirmationMessage,
            [
                { 
                    text: 'Cancelar', 
                    style: 'cancel',
                    onPress: () => {
                        processingRef.current = false; // ERRO-004 Fix: Unlock ref
                        setProcessing(false); // ERRO-004 Fix: Unlock se cancelar
                    }
                },
                {
                    text: 'Confirmar',
                    style: needsConfirmation ? 'destructive' : 'default',
                    onPress: async () => {
                        // ERRO-004 Fix: Já está locked, processar
                        HapticFeedback.success();

                        try {
                            // Processar pagamento (já fecha mesa automaticamente)
                            const success = await quickPay(orderId, defaultMethod);
                            
                            if (success) {
                                // Fechar mesa: marcar todos os pedidos da mesa como paid
                                // O quickPay já faz isso, mas garantimos aqui
                                await updateOrderStatus(orderId, 'paid');
                                
                                HapticFeedback.success();
                                onSuccess?.();
                            } else {
                                Alert.alert('Erro', 'Falha ao processar pagamento.');
                            }
                        } catch (error) {
                            console.error('[FastPay] Error:', error);
                            Alert.alert('Erro', 'Falha ao processar pagamento.');
                        } finally {
                            processingRef.current = false; // ERRO-004 Fix: Unlock ref
                            setProcessing(false); // ERRO-004 Fix: Unlock após processamento
                        }
                    }
                }
            ]
        );
    };

    return (
        <TouchableOpacity
            style={[styles.button, processing && styles.buttonProcessing]}
            onPress={handleFastPay}
            disabled={processing}
        >
            {processing ? (
                <ActivityIndicator color="#000" size="small" />
            ) : (
                <>
                    <Ionicons name="flash" size={20} color="#000" />
                    <Text style={styles.buttonText}>Cobrar Tudo</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#32d74b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 140,
    },
    buttonProcessing: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
