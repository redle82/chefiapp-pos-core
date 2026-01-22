import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Modal, Alert } from 'react-native';
import { useAppStaff } from '@/context/AppStaffContext';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { HapticFeedback } from '@/services/haptics';
import { FinancialVault } from '@/components/FinancialVault';
import { BottomActionBar } from '@/components/BottomActionBar';
import { NowActionCard } from '@/components/NowActionCard';
import { useNowEngine } from '@/hooks/useNowEngine';
import { QuickPayModal, PaymentMethod } from '@/components/QuickPayModal';
import { Ionicons } from '@expo/vector-icons';
import { logError, addBreadcrumb } from '@/services/logging';
import { useRouter } from 'expo-router';

export default function StaffScreen() {
    const router = useRouter();
    const {
        operationalContext,
        activeRole,
        roleConfig,
        shiftState,
        shiftStart,
        shiftId,
        startShift,
        endShift,
        canAccess
    } = useAppStaff();

    const { orders, quickPay, splitOrder } = useOrder(); // ERRO-009 Fix
    const { nowAction, loading, completeAction, pendingCount } = useNowEngine(); // ERRO-008 Fix
    const { session } = useAuth(); // FASE 4: Para passar userId ao completeAction
    const [isVaultVisible, setIsVaultVisible] = useState(false);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    // ERRO-004 Fix: Estado de processamento para prevenir duplo clique
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const handleCompleteAction = async (actionId: string) => {
        try {
            // Para pagamentos, abrir QuickPayModal
            if (nowAction?.action === 'collect_payment' && nowAction.orderId) {
                setIsPaymentModalVisible(true);
                // O pagamento será processado via QuickPayModal
                // O NowEngine será atualizado via realtime quando o status mudar
                return;
            }

            // ERRO-003 Fix: Para ação "acknowledge", mostrar feedback antes de processar
            if (nowAction?.action === 'acknowledge') {
                HapticFeedback.success();
                // Feedback visual: mostrar mensagem de confirmação
                // O feedback será mostrado pelo NowEngine quando próxima ação aparecer
            }

            // Para outras ações, processar diretamente
            // FASE 4: Passar userId para gamificação
            // FASE 5: Haptic feedback em ação crítica
            HapticFeedback.medium();
            const userId = session?.user?.id;
            await completeAction(actionId, userId);
            
            // ERRO-003 Fix: Feedback visual após ação completa
            // A próxima ação aparecerá automaticamente via realtime
            // Se não houver próxima ação, mostrará "Tudo em ordem"
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logError(err, {
                action: 'completeAction',
                actionId,
                actionType: nowAction?.type,
            });
            console.error('[StaffScreen] Error completing action:', error);
            Alert.alert('Erro', 'Falha ao completar ação. Tente novamente.');
        }
    };

    const handlePaymentConfirm = async (method: PaymentMethod, tip: number) => {
        // ERRO-004 Fix: Lock imediato para prevenir duplo clique
        if (isProcessingPayment) return;
        if (!nowAction?.orderId) return;

        // ERRO-004 Fix: Lock antes de processar
        setIsProcessingPayment(true);

        try {
            const order = orders.find(o => o.id === nowAction.orderId);
            if (!order) {
                setIsProcessingPayment(false); // Unlock se erro
                Alert.alert('Erro', 'Pedido não encontrado');
                return;
            }

            // Processar pagamento via OrderContext
            const success = await quickPay(nowAction.orderId, method);
            
            if (success) {
                setIsPaymentModalVisible(false);
                // O NowEngine será atualizado via realtime quando o status mudar
                // Não precisamos chamar completeAction aqui, o realtime fará isso
            } else {
                Alert.alert('Erro', 'Falha ao processar pagamento');
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logError(err, {
                action: 'processPayment',
                orderId: nowAction?.orderId,
                method,
                tip,
            });
            console.error('[StaffScreen] Error processing payment:', error);
            Alert.alert('Erro', 'Falha ao processar pagamento');
        } finally {
            // ERRO-004 Fix: Unlock após processamento
            setIsProcessingPayment(false);
        }
    };

    // --- Shift Closing Logic ---
    // Bug #6 Fix: Validar ações pendentes antes de encerrar turno
    const handleRequestCloseShift = async () => {
        // Validar ações pendentes
        if (nowAction && (nowAction.type === 'critical' || nowAction.type === 'urgent')) {
            Alert.alert(
                'Ações Pendentes',
                `Há uma ação ${nowAction.type === 'critical' ? 'crítica' : 'urgente'} pendente. Resolva antes de encerrar o turno.`,
                [{ text: 'OK' }]
            );
            return;
        }
        
        // Verificar pedidos pendentes (se necessário)
        // Nota: Validação completa requereria buscar do Supabase, mas por ora validamos ação atual
        
        Alert.alert(
            'Encerrar Turno',
            'Deseja realmente encerrar seu turno de trabalho?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Encerrar', style: 'destructive', onPress: () => endShift(0, 0) }
            ]
        );
    };


    // =========================================================================
    // APPSTAFF 2.0 - TELA ÚNICA
    // =========================================================================
    
    // Se turno não iniciado, mostrar tela de início simplificada
    if (shiftState === 'offline') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.shiftStartContainer}>
                    <Text style={styles.businessName}>{operationalContext.businessName}</Text>
                    <Text style={styles.roleLabel}>
                        {roleConfig.emoji} {roleConfig.label}
                    </Text>
                </View>

                <BottomActionBar
                    primary={{
                        label: "INICIAR TURNO",
                        onPress: () => startShift()
                    }}
                />
            </SafeAreaView>
        );
    }

    // Tela única do AppStaff 2.0
    return (
        <SafeAreaView style={styles.container}>
            {/* NOW ACTION CARD - Tela única */}
            <NowActionCard
                action={nowAction}
                onComplete={handleCompleteAction}
                loading={loading}
                pendingCount={pendingCount} // ERRO-008 Fix
            />

            {/* FASE 4: Botão Ranking */}
            {roleConfig.showGamification && (
                <TouchableOpacity 
                    onPress={() => router.push('/(tabs)/leaderboard')} 
                    style={styles.rankingButton}
                >
                    <Ionicons name="trophy" size={24} color="#d4a574" />
                </TouchableOpacity>
            )}

            {/* VAULT ACCESS - Apenas se necessário e permitido */}
            {canAccess('cash:handle') && nowAction?.action === 'collect_payment' && (
                <TouchableOpacity 
                    onPress={() => setIsVaultVisible(true)} 
                    style={styles.vaultButton}
                >
                    <Ionicons name="wallet" size={24} color="#FFCC00" />
                </TouchableOpacity>
            )}

            {/* BOTTOM ACTION BAR - End Shift (apenas se não há ação crítica) */}
            {(!nowAction || nowAction.type !== 'critical') && (
                <BottomActionBar
                    primary={{
                        label: "Encerrar Turno",
                        onPress: handleRequestCloseShift,
                        variant: 'destructive',
                        icon: 'log-out-outline'
                    }}
                />
            )}

            {/* FINANCIAL VAULT MODAL */}
            <Modal
                visible={isVaultVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsVaultVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
                    <View style={{ padding: 16, alignItems: 'flex-end', backgroundColor: '#1c1c1e' }}>
                        <TouchableOpacity onPress={() => setIsVaultVisible(false)}>
                            <Text style={{ color: '#0a84ff', fontSize: 18, fontWeight: '600' }}>Concluído</Text>
                        </TouchableOpacity>
                    </View>
                    <FinancialVault />
                </View>
            </Modal>

                      {/* QUICK PAY MODAL */}
                      {nowAction?.action === 'collect_payment' && nowAction.orderId && (() => {
                          const order = orders.find(o => o.id === nowAction.orderId);
                          return (
                              <QuickPayModal
                                  visible={isPaymentModalVisible}
                                  total={order?.total || 0}
                                  orderId={nowAction.orderId}
                                  order={order || undefined} // Bug #4 Fix: Passar order para validação
                                  onClose={() => setIsPaymentModalVisible(false)}
                                  onConfirm={handlePaymentConfirm}
                                  onSplitBill={async (itemIds: string[]) => {
                                      // ERRO-009 Fix: Dividir conta
                                      if (nowAction.orderId) {
                                          const newOrderId = await splitOrder(nowAction.orderId, itemIds);
                                          if (newOrderId) {
                                              Alert.alert('Sucesso', 'Conta dividida com sucesso!');
                                          }
                                      }
                                  }}
                              />
                          );
                      })()}
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    // Shift Start Screen
    shiftStartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    businessName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#d4a574',
        marginBottom: 8,
    },
    roleLabel: {
        fontSize: 18,
        color: '#888',
        marginBottom: 48,
    },
    startButton: {
        backgroundColor: '#d4a574',
        paddingVertical: 20,
        paddingHorizontal: 48,
        borderRadius: 12,
        marginBottom: 16,
    },
    startButtonText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0a0a0a',
    },
    hint: {
        fontSize: 14,
        color: '#666',
    },
    // FASE 4: Ranking Button
    rankingButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8
    },
    // Vault Button
    vaultButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 24,
    },
    warningBox: {
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff453a',
        marginBottom: 20,
        width: '100%',
    },
    warningTitle: {
        color: '#ff453a',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
        textAlign: 'center',
    },
    warningText: {
        color: '#ff453a',
        fontSize: 12,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 32,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },

    emptyEmoji: { fontSize: 48, marginBottom: 10 },
    emptyText: { color: '#666', fontSize: 16 },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#333',
    },
    confirmButton: {
        backgroundColor: '#ff453a',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
