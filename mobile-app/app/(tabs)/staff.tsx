import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Modal, Alert } from 'react-native';
import { useAppStaff, RoleGate } from '@/context/AppStaffContext';
import { useOrder } from '@/context/OrderContext';

export default function StaffScreen() {
    const {
        operationalContext,
        activeRole,
        roleConfig,
        shiftState,
        shiftStart,
        startShift,
        endShift,
        tasks,
        completeTask
    } = useAppStaff();

    const { orders } = useOrder();
    const [isClosingModalVisible, setClosingModalVisible] = useState(false);

    const formatDuration = (startTime: number | null) => {
        if (!startTime) return '0m';
        const diffMs = Date.now() - startTime;
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return '#ff4444';
            case 'urgent': return '#ff8800';
            case 'attention': return '#ffcc00';
            default: return '#888888';
        }
    };

    // --- Shift Closing Logic ---
    const handleRequestCloseShift = () => {
        setClosingModalVisible(true);
    };

    const confirmEndShift = () => {
        endShift();
        setClosingModalVisible(false);
        Alert.alert("Turno Encerrado", "Bom descanso! 👋");
    };

    // --- Analysis for Summary ---
    const sessionRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const openOrders = orders.filter(o => o.status !== 'delivered');
    const hasOpenOrders = openOrders.length > 0;
    const completedTasks = tasks.filter(t => t.status === 'done');
    const pendingTasks = tasks.filter(t => t.status !== 'done');


    // =========================================================================
    // SHIFT START SCREEN
    // =========================================================================
    if (shiftState === 'offline') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.shiftStartContainer}>
                    <Text style={styles.businessName}>{operationalContext.businessName}</Text>
                    <Text style={styles.roleLabel}>
                        {roleConfig.emoji} {roleConfig.label}
                    </Text>

                    <TouchableOpacity style={styles.startButton} onPress={startShift}>
                        <Text style={styles.startButtonText}>▶️ INICIAR TURNO</Text>
                    </TouchableOpacity>

                    <Text style={styles.hint}>
                        Toque para começar a receber tarefas de {roleConfig.label}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // =========================================================================
    // ACTIVE SHIFT SCREEN (Task List)
    // =========================================================================
    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.businessNameSmall}>{operationalContext.businessName}</Text>
                    <Text style={styles.roleLabelSmall}>
                        {roleConfig.emoji} {roleConfig.label}
                    </Text>
                </View>
                <View style={styles.shiftInfo}>
                    <Text style={styles.shiftDuration}>⏱️ {formatDuration(shiftStart)}</Text>
                    <TouchableOpacity style={styles.endButton} onPress={handleRequestCloseShift}>
                        <Text style={styles.endButtonText}>Encerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* GAMIFICATION & METRICS (Conditional) */}
            {roleConfig.showGamification && (
                <View style={styles.xpBar}>
                    <Text style={styles.xpText}>⭐ XP da Sessão: {completedTasks.length * 100}</Text>
                </View>
            )}

            {roleConfig.showMetrics && (
                <View style={styles.metricsBar}>
                    <Text style={styles.metricsText}>📊 Eficiência da Equipa: 94%</Text>
                </View>
            )}

            {/* TASK LIST */}
            <View style={styles.taskSection}>
                <Text style={styles.sectionTitle}>
                    {activeRole === 'owner' ? '👁️ Visão Geral' : `📋 Tarefas de ${roleConfig.label}`} ({pendingTasks.length})
                </Text>

                {pendingTasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>✅</Text>
                        <Text style={styles.emptyText}>Tudo em ordem!</Text>
                    </View>
                ) : (
                    <FlatList
                        data={pendingTasks}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.taskCard, { borderLeftColor: getPriorityColor(item.priority) }]}
                                onPress={() => completeTask(item.id)}
                            >
                                <View style={styles.taskContent}>
                                    <View style={styles.taskHeaderRow}>
                                        <Text style={styles.taskTitle}>{item.title}</Text>
                                        {item.priority === 'critical' && <Text style={styles.criticalBadge}>!</Text>}
                                    </View>
                                    <View style={styles.taskMetaRow}>
                                        <Text style={styles.taskPriority}>{item.priority.toUpperCase()}</Text>
                                        <Text style={styles.taskCategory}> • {item.category}</Text>
                                    </View>
                                </View>
                                <Text style={styles.taskAction}>✓</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            {/* RECAP MODAL */}
            <Modal
                visible={isClosingModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setClosingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Resumo do Turno</Text>

                        {/* WARNING IF OPEN ORDERS */}
                        {hasOpenOrders && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningTitle}>⚠️ {openOrders.length} Pedidos Abertos</Text>
                                <Text style={styles.warningText}>Recomenda-se fechar todas as mesas/pedidos antes de encerrar o turno.</Text>
                            </View>
                        )}

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Tempo</Text>
                                <Text style={styles.statValue}>{formatDuration(shiftStart)}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Tarefas</Text>
                                <Text style={styles.statValue}>{completedTasks.length}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Vendas</Text>
                                <Text style={styles.statValue}>€{sessionRevenue.toFixed(0)}</Text>
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setClosingModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Continuar Turno</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmEndShift}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {hasOpenOrders ? 'Forçar Encerramento' : 'Encerrar Turno'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    // Active Shift Screen
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    businessNameSmall: {
        fontSize: 18,
        fontWeight: '700',
        color: '#d4a574',
    },
    roleLabelSmall: {
        fontSize: 14,
        color: '#888',
    },
    shiftInfo: {
        alignItems: 'flex-end',
    },
    shiftDuration: {
        fontSize: 16,
        color: '#4ade80',
        marginBottom: 4,
    },
    endButton: {
        backgroundColor: '#333',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    endButtonText: {
        fontSize: 12,
        color: '#ff453a', // Red text for danger action
        fontWeight: 'bold',
    },
    // Task Section
    taskSection: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    taskCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        borderLeftWidth: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    taskPriority: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
    },
    taskAction: {
        fontSize: 24,
        color: '#4ade80',
    },
    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
    // Completed Bar
    completedBar: {
        padding: 12,
        backgroundColor: '#1a2f1a',
        borderTopWidth: 1,
        borderTopColor: '#2a4a2a',
    },
    completedText: {
        textAlign: 'center',
        color: '#4ade80',
        fontSize: 14,
    },
    // Gamification & Metrics
    xpBar: {
        backgroundColor: '#2a2010',
        padding: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#d4a574',
    },
    xpText: {
        color: '#d4a574',
        fontWeight: '700',
        fontSize: 14,
    },
    metricsBar: {
        backgroundColor: '#1a1a2e',
        padding: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#4a4ae2',
    },
    metricsText: {
        color: '#a0a0ff',
        fontWeight: '700',
        fontSize: 14,
    },
    taskHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    criticalBadge: {
        backgroundColor: '#ff4444',
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
        overflow: 'hidden',
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskCategory: {
        fontSize: 10,
        color: '#666',
        marginLeft: 4,
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
