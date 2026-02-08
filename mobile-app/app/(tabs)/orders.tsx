import React, { useState, useMemo } from 'react';
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
import { OrderTimer } from '@/components/OrderTimer';
import { SplitBillModal } from '@/components/SplitBillModal';
import { QuickPayModal, PaymentMethod } from '@/components/QuickPayModal';
import { HapticFeedback } from '@/services/haptics';
import { ThumbCard } from '@/components/ThumbCard';
import { BottomSheet } from '@/components/BottomSheet';
import { BottomActionBar } from '@/components/BottomActionBar';
import { useOrder, Order, OrderItem } from '@/context/OrderContext';
import { useAppStaff } from '@/context/AppStaffContext';
import { useAuth } from '@/context/AuthContext';
import { FastPayButton } from '@/components/FastPayButton';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { getVisibleOrders } from '@/utils/orderFilters';
import { withPermission } from '@/utils/permissionWrapper';
import { canPayOrder } from '@/utils/orderValidation';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    paid: 'Pago',
};

import { SplitOrderModal } from '@/components/SplitOrderModal';
import { TableSelectorModal } from '@/components/TableSelectorModal';
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/designTokens';

const STATUS_COLORS_DS: Record<string, string> = {
    pending: colors.warning,
    preparing: colors.info,
    ready: colors.success,
    delivered: colors.textMuted,
    paid: colors.success,
};

export default function OrdersScreen() {
    // Bug #3 Fix: Route guard - todos podem ver pedidos, mas filtrados por role
    useRouteGuard({ 
        allowedRoles: ['waiter', 'bartender', 'cook', 'chef', 'manager', 'owner', 'cleaning', 'ambulante', 'vendor', 'supervisor', 'cashier', 'delivery', 'admin']
    });
    
    const { orders, updateOrderStatus, updateOrderNote, splitOrder, voidItem, moveOrder, mergeOrders } = useOrder();
    const { activeRole, shiftId, canAccess, operationalContext } = useAppStaff();
    const { session } = useAuth();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showSplitBillModal, setShowSplitBillModal] = useState(false); // Renamed for clarity
    const [showSplitOrderModal, setShowSplitOrderModal] = useState(false); // New
    const [showTableSelector, setShowTableSelector] = useState(false); // New
    const [showPayModal, setShowPayModal] = useState(false);

    // Bug #1 Fix: Filtro estrutural RBAC - ÚNICA fonte de verdade
    const filteredOrders = useMemo(() => {
        return getVisibleOrders({
            role: activeRole,
            userId: session?.user?.id || null,
            shiftId: shiftId,
            businessId: operationalContext.businessId,
            orders: orders,
            canAccess: canAccess
        });
    }, [orders, activeRole, shiftId, operationalContext.businessId, canAccess, session]);

    const handleSplitBillConfirm = (payments: number[]) => {
        if (selectedOrder) {
            // FASE 5: Haptic feedback em ação crítica
            HapticFeedback.success();
            Alert.alert(
                'Pagamento Dividido',
                `${payments.length} pagamentos de €${(selectedOrder.total / payments.length).toFixed(2)} cada`,
                [{
                    text: 'OK', onPress: () => {
                        updateOrderStatus(selectedOrder.id, 'paid');
                        setShowSplitBillModal(false);
                        setSelectedOrder(null);
                    }
                }]
            );
        }
    };

    const handleSplitOrderConfirm = async (itemIds: string[]) => {
        if (selectedOrder) {
            // FASE 5: Haptic feedback em ação crítica
            HapticFeedback.medium();
            const newOrderId = await splitOrder(selectedOrder.id, itemIds);
            setShowSplitOrderModal(false);
            setSelectedOrder(null);
            if (newOrderId) {
                HapticFeedback.success();
                Alert.alert("Sucesso", "Novo pedido criado com os itens selecionados.");
            }
        }
    };

    const handleTableSelect = (targetTableId: number, isOccupied: boolean) => {
        setShowTableSelector(false);
        if (!selectedOrder) return;

        if (isOccupied) {
            // Merge Flow
            const targetOrder = orders.find(o => String(o.table) === String(targetTableId) && ['pending', 'preparing', 'ready', 'delivered'].includes(o.status));
            if (!targetOrder) {
                // Should not happen if isOccupied is true, but safety check
                Alert.alert("Erro", "Pedido alvo não encontrado.");
                return;
            }

            Alert.alert(
                "Juntar Mesas?",
                `Deseja mover todos os itens da Mesa ${selectedOrder.table} para a Mesa ${targetTableId}?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Confirmar",
                        onPress: async () => {
                            // FASE 5: Haptic feedback em ação crítica
                            HapticFeedback.medium();
                            const success = await mergeOrders(selectedOrder.id, targetOrder.id);
                            if (success) {
                                HapticFeedback.success();
                                setSelectedOrder(null);
                                Alert.alert("Sucesso", "Mesas unidas com sucesso!");
                            }
                        }
                    }
                ]
            );
        } else {
            // Move Flow
            Alert.alert(
                "Mudar Mesa",
                `Confirmar mudança da Mesa ${selectedOrder.table} para Mesa ${targetTableId}?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Confirmar",
                        onPress: async () => {
                            // FASE 5: Haptic feedback em ação crítica
                            HapticFeedback.medium();
                            const success = await moveOrder(selectedOrder.id, targetTableId);
                            if (success) {
                                HapticFeedback.success();
                                setSelectedOrder(null);
                                Alert.alert("Sucesso", `Pedido movido para a Mesa ${targetTableId}.`);
                            }
                        }
                    }
                ]
            );
        }
    };

    // Bug #12 Fix: Wrapper com permissão
    const handleVoidItem = (item: OrderItem) => {
        if (!selectedOrder) return;

        // Validação de permissão
        if (!canAccess('order:void')) {
            Alert.alert('Sem Permissão', 'Você não tem permissão para cancelar itens.');
            return;
        }

        Alert.prompt(
            "Cancelar Item",
            `Deseja realmente cancelar ${item.name}?`,
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, Cancelar",
                    onPress: (reason?: string) => {
                        voidItem(selectedOrder.id, item.id, reason || "Sem motivo");
                    },
                    style: 'destructive'
                }
            ],
            "plain-text",
            "Motivo (ex: Cliente desistiu)"
        );
    };

    const handlePayConfirm = (method: PaymentMethod, tip: number) => {
        if (selectedOrder) {
            // FASE 5: Haptic feedback em ação crítica
            HapticFeedback.success();
            updateOrderStatus(selectedOrder.id, 'paid');
            setShowPayModal(false);
            setSelectedOrder(null);
        }
    };

    const handleAction = (action: string) => {
        if (!selectedOrder) return;

        switch (action) {
            case 'delivery':
                HapticFeedback.success();
                updateOrderStatus(selectedOrder.id, 'delivered');
                break;
            case 'cancel':
                HapticFeedback.error();
                Alert.alert("Cancelar Pedido", "Cancelar pedido inteiro requer permissão de Gerente. (Implementação Pendente)");
                break;
            case 'print':
                HapticFeedback.medium();
                Alert.alert("Imprimir", "Enviando para impressora térmica...");
                break;
        }
        setSelectedOrder(null);
    };

    const groupItems = (items: OrderItem[]) => {
        const grouped: Record<string, { count: number, name: string, notes?: string }> = {};
        items.forEach(i => {
            const key = i.name + (i.notes || '');
            if (!grouped[key]) grouped[key] = { count: 0, name: i.name, notes: i.notes };
            grouped[key].count++;
        });
        return Object.values(grouped);
    };

    const renderOrder = ({ item }: { item: Order }) => {
        const grouped = groupItems(item.items);

        return (
            <ThumbCard
                onPress={() => setSelectedOrder(item)}
                statusColor={STATUS_COLORS_DS[item.status]}
                style={{ marginBottom: 12 }}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.headerLeft}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.tableName}>Mesa {item.table}</Text>
                            {/* ERRO-002 Fix: Badge de origem do pedido */}
                            {item.origin && (
                                <View style={[
                                    styles.originBadge,
                                    item.origin === 'WEB_PUBLIC' || item.origin === 'web' ? styles.originBadgeWeb :
                                    item.origin === 'CAIXA' || item.origin === 'TPV' ? styles.originBadgeCaixa :
                                    styles.originBadgeGarcom
                                ]}>
                                    <Text style={styles.originBadgeText}>
                                        {item.origin === 'WEB_PUBLIC' || item.origin === 'web' ? '🌐 WEB' :
                                         item.origin === 'CAIXA' || item.origin === 'TPV' ? '💳 CAIXA' :
                                         '👤 GARÇOM'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <OrderTimer createdAt={item.createdAt} compact />
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS_DS[item.status] || colors.textMuted }]}>
                        <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
                    </View>
                </View>

                <View style={styles.itemsList}>
                    {item.notes && (
                        <View style={{ marginBottom: spacing[2], padding: spacing[1], backgroundColor: colors.surface, borderRadius: radius.sm }}>
                            <Text style={{ color: colors.warning, fontSize: fontSize.xs, fontStyle: 'italic' }}>📝 {item.notes}</Text>
                        </View>
                    )}
                    {grouped.map((line, idx) => (
                        <View key={idx}>
                            <Text style={styles.itemText}>
                                {line.count}x {line.name}
                            </Text>
                            {line.notes && (
                                <Text style={{ color: colors.accent, fontSize: fontSize.xs, marginLeft: 20, marginBottom: spacing[1] }}>
                                    ↳ {line.notes}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>€{item.total.toFixed(2)}</Text>
                </View>
            </ThumbCard>
        );
    };

    // Derived Actions for Selected Order
    const getPrimaryAction = () => {
        if (!selectedOrder) return undefined;
        if (selectedOrder.status === 'ready') return { label: '✅ Entregar', onPress: () => handleAction('delivery') };
        // SEMANA 1: FAST PAY - Substituir modal por botão direto
        if (selectedOrder.status === 'delivered') {
            return {
                label: '💰 Cobrar Tudo',
                onPress: () => {
                    // FastPayButton será renderizado no BottomSheet
                    // Por enquanto, manter compatibilidade
                    setShowPayModal(true);
                }
            };
        }
        if (selectedOrder.status === 'pending') return { label: '🖨️ Imprimir', onPress: () => handleAction('print') };
        return undefined;
    };

    const getSecondaryAction = () => {
        if (!selectedOrder) return undefined;
        if (selectedOrder.status === 'pending') {
            // VALIDAÇÃO DE PERMISSÃO (Bug #12 Fix)
            if (!canAccess('order:void')) {
                return undefined; // Não mostrar se não tem permissão
            }
            return { label: 'Cancelar', onPress: () => handleAction('cancel'), variant: 'destructive' as const };
        }

        // Logic choice: If focused on Payment, show Split Bill. If focused on Management, show Move Items.
        // Let's add a "More" option or specific logic.
        // For now: "Dividir Conta / Mover" logic based on requirement.
        // Let's explicitly allow "Dividir" to open SplitBillModal (Payment)
        // VALIDAÇÃO DE PERMISSÃO (Bug #12 Fix)
        if (!canAccess('order:split')) {
            return undefined; // Não mostrar se não tem permissão
        }
        return { label: 'Dividir Conta', onPress: () => setShowSplitBillModal(true), variant: 'secondary' as const };
    };

    return (
        <ShiftGate>
            <View style={styles.container}>
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum pedido ativo</Text>
                        </View>
                    }
                />

                {/* Details / Actions BottomSheet */}
                <BottomSheet
                    visible={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    title={selectedOrder ? `Pedido Mesa ${selectedOrder.table}` : 'Pedido'}
                >
                    <View style={{ paddingBottom: 20 }}>
                        {selectedOrder && (
                            <View style={styles.modalInfo}>
                                <Text style={styles.infoText}>Estado: {STATUS_LABELS[selectedOrder.status]}</Text>
                                <Text style={styles.infoText}>Total: €{selectedOrder.total.toFixed(2)}</Text>

                                <View style={{ marginVertical: 16, width: '100%', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
                                    <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>ITENS (Toque para Ações)</Text>
                                    {selectedOrder.items.map(item => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}
                                            onLongPress={() => handleVoidItem(item)}
                                        >
                                            <Text style={{ color: colors.textSecondary }}>{item.name}</Text>
                                            <Text style={{ color: colors.textSecondary }}>€{item.price.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Helper Actions Row */}
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                    {canAccess('order:split') && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.bgOrange]}
                                            onPress={() => setShowSplitOrderModal(true)}
                                        >
                                            <Text style={styles.actionBtnText}>✂️ Separar Pedido</Text>
                                        </TouchableOpacity>
                                    )}

                                    {canAccess('order:transfer') && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: colors.info }]}
                                            onPress={() => setShowTableSelector(true)}
                                        >
                                            <Text style={styles.actionBtnText}>🪑 Transferir</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* SEMANA 1: FAST PAY - Botão único para cobrar */}
                                {/* Bug #4 Fix: Validação obrigatória antes de permitir pagamento */}
                                {(() => {
                                    const validation = canPayOrder(selectedOrder);
                                    if (!validation.canPay) {
                                        return (
                                            <View style={{ marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.warning, borderRadius: radius.md }}>
                                                <Text style={{ color: colors.textPrimary, textAlign: 'center', fontWeight: fontWeight.semibold }}>
                                                    ⚠️ {validation.reason || 'Pedido não pode ser pago'}
                                                </Text>
                                            </View>
                                        );
                                    }
                                    return (
                                        <View style={{ marginBottom: 16, alignItems: 'center' }}>
                                            <FastPayButton
                                                orderId={selectedOrder.id}
                                                total={selectedOrder.total}
                                                tableId={selectedOrder.table}
                                                onSuccess={() => {
                                                    setSelectedOrder(null);
                                                    HapticFeedback.success();
                                                }}
                                            />
                                        </View>
                                    );
                                })()}
                            </View>
                        )}

                        <BottomActionBar
                            primary={getPrimaryAction() || { label: 'Fechar', onPress: () => setSelectedOrder(null) }}
                            secondary={getSecondaryAction()}
                        />
                    </View>
                </BottomSheet>

                {/* Split Bill Modal (Payment) */}
                {selectedOrder && (
                    <SplitBillModal
                        visible={showSplitBillModal}
                        total={selectedOrder.total}
                        onClose={() => setShowSplitBillModal(false)}
                        onConfirm={handleSplitBillConfirm}
                    />
                )}

                {/* Split Order Modal (Move Items) */}
                {selectedOrder && (
                    <SplitOrderModal
                        visible={showSplitOrderModal}
                        order={selectedOrder}
                        onClose={() => setShowSplitOrderModal(false)}
                        onConfirm={handleSplitOrderConfirm}
                    />
                )}

                {selectedOrder && (
                    <TableSelectorModal
                        visible={showTableSelector}
                        currentTableId={parseInt(selectedOrder.table, 10)}
                        activeOrders={orders}
                        onClose={() => setShowTableSelector(false)}
                        onSelectTable={handleTableSelect}
                    />
                )}

                {/* Quick Pay Modal */}
                {selectedOrder && (
                    <QuickPayModal
                        visible={showPayModal}
                        total={selectedOrder.total}
                        orderId={selectedOrder.id}
                        onClose={() => setShowPayModal(false)}
                        onConfirm={handlePayConfirm}
                    />
                )}
            </View>
        </ShiftGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: { padding: spacing[4] },
    orderCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing[4],
        marginBottom: spacing[3],
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tableName: {
        color: colors.textPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    statusBadge: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius.lg,
    },
    statusText: {
        color: colors.textPrimary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
    },
    itemsList: {
        marginBottom: spacing[3],
        paddingBottom: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        marginBottom: spacing[1],
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
    totalValue: {
        color: colors.success,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 16,
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlayDark,
        justifyContent: 'center',
        padding: spacing[5],
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing[5],
        alignItems: 'center',
    },
    modalTitle: {
        color: colors.textPrimary,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        marginBottom: spacing[5],
    },
    modalInfo: { marginBottom: spacing[5], alignItems: 'center' },
    infoText: {
        color: colors.textSecondary,
        fontSize: fontSize.base,
        marginBottom: spacing[2],
    },
    sectionTitle: {
        color: colors.textSecondary,
        fontWeight: fontWeight.bold,
        marginBottom: spacing[2],
        fontSize: fontSize.xs,
        textTransform: 'uppercase',
    },
    actionBtn: {
        paddingHorizontal: spacing[4],
        paddingVertical: 10,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgOrange: { backgroundColor: colors.warning },
    actionBtnText: {
        color: colors.textPrimary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.sm,
    },
    originBadge: {
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: radius.md,
        borderWidth: 1,
    },
    originBadgeWeb: {
        backgroundColor: `${colors.info}20`,
        borderColor: colors.info,
    },
    originBadgeCaixa: {
        backgroundColor: `${colors.warning}20`,
        borderColor: colors.warning,
    },
    originBadgeGarcom: {
        backgroundColor: `${colors.success}20`,
        borderColor: colors.success,
    },
    originBadgeText: { fontSize: 10, fontWeight: fontWeight.bold },
});
