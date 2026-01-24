import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder } from '@/context/OrderContext';
import { useAppStaff, StaffRole, RoleGate } from '@/context/AppStaffContext';
import { router } from 'expo-router';
import { HapticFeedback } from '@/services/haptics';
import { supabase } from '@/services/supabase';
import { MenuManagerModal } from '@/components/MenuManagerModal';
import { CashManagementModal } from '@/components/CashManagementModal';
import { AnalyticsView } from '@/components/AnalyticsView';
import { ThumbCard } from '@/components/ThumbCard';
import { BottomSheet } from '@/components/BottomSheet';
import { BottomActionBar } from '@/components/BottomActionBar';
import { useNotices, Notice } from '@/hooks/useNotices';
import { useDirectCommand, DirectCommand } from '@/hooks/useDirectCommand';
import { SafetyMonitor } from '@/components/SafetyMonitor';
import { ManagerCalendarView } from '@/components/ManagerCalendarView';
import { OwnerCalendarView } from '@/components/OwnerCalendarView';

export default function ManagerScreen() {
    // ============================================================
    // HOOKS - SEMPRE NO TOPO (Rules of Hooks)
    // ============================================================
    
    // Context hooks
    const { orders } = useOrder();
    const { 
        roleConfig, 
        createTask, 
        allRoles, 
        activeRole, 
        canAccess,
        shiftId,
        endShift,
        operationalContext 
    } = useAppStaff();
    
    // Custom hooks
    const { notices, postNotice, deleteNotice, fetchNotices: refreshNotices } = useNotices();
    const { sendCommand, sentCommands } = useDirectCommand();
    
    // View State
    const [viewMode, setViewMode] = useState<'ops' | 'analytics' | 'planning'>('ops');
    
    // Task Modal State
    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskRole, setTaskRole] = useState<StaffRole>('waiter');
    const [taskPriority, setTaskPriority] = useState<'attention' | 'urgent'>('attention');
    
    // History State
    const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
    const [historyShifts, setHistoryShifts] = useState<any[]>([]);
    
    // Manager Modals
    const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
    const [isCashManagerOpen, setIsCashManagerOpen] = useState(false);
    
    // Product Form State
    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodCategory, setProdCategory] = useState<'food' | 'drink' | 'other'>('food');
    
    // Notice Board State
    const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
    const [noticeContent, setNoticeContent] = useState('');
    const [noticeSeverity, setNoticeSeverity] = useState<'info' | 'attention' | 'critical'>('info');
    
    // Direct Command State
    const [isCommandModalVisible, setIsCommandModalVisible] = useState(false);
    const [commandTarget, setCommandTarget] = useState<StaffRole>('waiter');
    const [commandContent, setCommandContent] = useState('');
    const [activeStaffList, setActiveStaffList] = useState<any[]>([]);
    const [targetId, setTargetId] = useState('');
    
    // ============================================================
    // GUARDS - APÓS TODOS OS HOOKS
    // ============================================================
    
    if (!canAccess('business:view_reports') && activeRole !== 'owner' && activeRole !== 'manager') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
                <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', padding: 20 }}>
                    Você não tem permissão para acessar esta tela.
                </Text>
            </View>
        );
    }
    
    // ============================================================
    // COMPUTED VALUES
    // ============================================================
    
    const sessionOrders = orders.filter(o => o.shiftId === shiftId);
    
    // ============================================================
    // HANDLERS
    // ============================================================

    const handleCreateTask = () => {
        if (!taskTitle.trim()) {
            HapticFeedback.error();
            Alert.alert("Erro", "Digite um título para a tarefa.");
            return;
        }
        createTask(taskTitle, taskRole, taskPriority);
        HapticFeedback.success();
        setIsTaskModalVisible(false);
        setTaskTitle('');
        Alert.alert("Sucesso", "Tarefa criada e atribuída!");
    };

    const fetchHistory = async () => {
        const { data } = await supabase
            .from('gm_shifts')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(20);

        if (data) {
            setHistoryShifts(data);
            setIsHistoryModalVisible(true);
        }
    };

    const handleCreateProduct = async () => {
        if (!prodName || !prodPrice) {
            HapticFeedback.error();
            Alert.alert("Erro", "Preencha Nome e Preço.");
            return;
        }

        const price = parseFloat(prodPrice.replace(',', '.'));
        if (isNaN(price)) {
            Alert.alert("Erro", "Preço inválido.");
            return;
        }

        const priceCents = Math.round(price * 100);

        const { error } = await supabase.from('gm_products').insert({
            name: prodName,
            price_cents: priceCents,
            category: prodCategory,
            available: true,
            visibility: { tpv: true, mobile: true }
        });

        if (error) {
            HapticFeedback.error();
            Alert.alert("Erro ao criar produto", error.message);
        } else {
            HapticFeedback.success();
            setIsProductModalVisible(false);
            setProdName('');
            setProdPrice('');
            Alert.alert("Sucesso", "Produto adicionado ao cardápio!");
        }
    };

    const handlePostNotice = async () => {
        if (!noticeContent.trim()) {
            Alert.alert("Erro", "Digite o conteúdo do aviso.");
            return;
        }
        try {
            await postNotice(noticeContent, noticeSeverity);
            HapticFeedback.success();
            setNoticeContent('');
            setIsNoticeModalVisible(false);
            Alert.alert("Sucesso", "Aviso publicado no Mural!");
        } catch (e) {
            Alert.alert("Erro", "Falha ao publicar aviso.");
        }
    };

    const handleDeleteNotice = (id: string) => {
        Alert.alert("Apagar Aviso", "Tem certeza?", [
            { text: "Cancelar" },
            {
                text: "Apagar", style: 'destructive', onPress: () => {
                    deleteNotice(id);
                    HapticFeedback.success();
                }
            }
        ]);
    };

    const fetchActiveStaff = async () => {
        // Use operationalContext from hook (already extracted at top)
        const { data } = await supabase
            .from('gm_shifts')
            .select('user_id, active_role')
            .eq('status', 'open')
            .eq('restaurant_id', operationalContext.businessId);

        if (data) {
            setActiveStaffList(data);
            if (data.length > 0) setTargetId(data[0].user_id);
        }
    };

    const handleSendCommand = async () => {
        if (!commandContent.trim()) {
            Alert.alert("Erro", "Digite o comando.");
            return;
        }
        if (!targetId) {
            Alert.alert("Erro", "Nenhum funcionário selecionado.");
            return;
        }

        try {
            await sendCommand(targetId, commandContent);
            HapticFeedback.success();
            setCommandContent('');
            setIsCommandModalVisible(false);
            Alert.alert("Enviado", "Comando enviado com sucesso.");
        } catch (e: any) {
            Alert.alert("Erro", e.message || "Falha ao enviar.");
        }
    };

    // Calculate Revenue (Total Value of all orders)
    const totalRevenue = sessionOrders.reduce((sum, order) => sum + order.total, 0);

    // Detailed Breakdown (Food vs Drink)
    const foodRevenue = sessionOrders.reduce((sum, order) => {
        const foodItems = order.items.filter(i => i.category === 'food' || i.category === 'other');
        return sum + foodItems.reduce((s, i) => s + i.price, 0);
    }, 0);

    const drinkRevenue = sessionOrders.reduce((sum, order) => {
        const drinkItems = order.items.filter(i => i.category === 'drink');
        return sum + drinkItems.reduce((s, i) => s + i.price, 0);
    }, 0);

    // Close Shift Handler (Z-Report)
    const handleCloseShift = () => {
        Alert.alert(
            "Fechar Turno (Relatório Z)",
            `Deseja encerrar o turno?\n\nTotal: €${totalRevenue.toFixed(2)}\nComida: €${foodRevenue.toFixed(2)}\nBebida: €${drinkRevenue.toFixed(2)}`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Encerrar Turno",
                    style: "destructive",
                    onPress: async () => {
                        await endShift(totalRevenue);
                        Alert.alert("Turno Fechado", "O sistema foi desconectado com sucesso.");
                    }
                }
            ]
        );
    };

    // 2. Active Orders (Pending/Preparing)
    const activeOrdersCount = sessionOrders.filter(
        o => o.status === 'pending' || o.status === 'preparing'
    ).length;

    // 3. Completed Orders (Ready/Delivered)
    const completedOrdersCount = sessionOrders.filter(
        o => o.status === 'ready' || o.status === 'delivered'
    ).length;

    // 4. Unique Occupied Tables
    const occupiedTables = new Set(
        // Use ALL orders for occupancy map? No, only current shift implies occupancy usually.
        // If a table sat down yesterday and never closed, are they still there? 
        // For simple TPV, yes, check ALL active orders. 
        // BUT for "Manager Stats" we want specific shift metrics.
        sessionOrders.filter(o => o.status !== 'delivered').map(o => o.table)
    ).size;

    // Function to refresh data (placeholder for now)
    const refreshData = () => {
        HapticFeedback.light();
        Alert.alert("Atualizar Dados", "Dados atualizados com sucesso!");
        // In a real app, you'd re-fetch orders, shifts, etc.
    };

    return (
        <RoleGate
            allowed={['manager', 'owner', 'admin', 'supervisor']}
            fallback={
                <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Acesso Restrito 🚫</Text>
                    <Text style={{ color: '#888', marginTop: 8 }}>Apenas gerentes podem acessar esta área.</Text>
                </View>
            }
        >
            <ShiftGate>
                <ScrollView style={styles.container}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.headerTitle}>📊 Gestão Operacional</Text>
                            <Text style={styles.subTitle}>{activeRole.toUpperCase()} MODE</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                            <Text style={{ fontSize: 24 }}>⚙️</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Safety Shield 🛡️ */}
                    <SafetyMonitor />

                    {/* View Switcher */}
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[styles.segmentBtn, viewMode === 'ops' && styles.segmentBtnActive]}
                            onPress={() => setViewMode('ops')}
                        >
                            <Text style={[styles.segmentText, viewMode === 'ops' && styles.segmentTextActive]}>Operações</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segmentBtn, viewMode === 'planning' && styles.segmentBtnActive]}
                            onPress={() => setViewMode('planning')}
                        >
                            <Text style={[styles.segmentText, viewMode === 'planning' && styles.segmentTextActive]}>Planejamento</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segmentBtn, viewMode === 'analytics' && styles.segmentBtnActive]}
                            onPress={() => setViewMode('analytics')}
                        >
                            <Text style={[styles.segmentText, viewMode === 'analytics' && styles.segmentTextActive]}>Analytics 📈</Text>
                        </TouchableOpacity>
                    </View>

                    {viewMode === 'planning' ? (
                        activeRole === 'owner' ? <OwnerCalendarView /> : <ManagerCalendarView />
                    ) : viewMode === 'analytics' ? (
                        <AnalyticsView shiftId={shiftId} />
                    ) : (
                        <>
                            {/* KPI Grid */}
                            <View style={styles.kpiGrid}>
                                <View style={[styles.kpiCard, { backgroundColor: '#1c1c1e' }]}>
                                    <Text style={styles.kpiLabel}>Receita do Turno</Text>
                                    <Text style={[styles.kpiValue, { color: '#32d74b' }]}>
                                        €{totalRevenue.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={[styles.kpiCard, { backgroundColor: '#1c1c1e' }]}>
                                    <Text style={styles.kpiLabel}>Mesas Ativas</Text>
                                    <Text style={[styles.kpiValue, { color: '#0a84ff' }]}>
                                        {occupiedTables}
                                    </Text>
                                </View>

                                {/* Breakdown Card (Double Width) */}
                                <View style={[styles.kpiCard, { width: '100%' }]}>
                                    <Text style={styles.kpiLabel}>Mix de Vendas</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                        <View>
                                            <Text style={{ color: '#888', fontSize: 12 }}>Comida 🍔</Text>
                                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>€{foodRevenue.toFixed(2)}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ color: '#888', fontSize: 12 }}>Bebida 🍹</Text>
                                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>€{drinkRevenue.toFixed(2)}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ color: '#888', fontSize: 12 }}>Ticket Médio</Text>
                                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                                €{sessionOrders.length > 0 ? (totalRevenue / sessionOrders.length).toFixed(2) : '0.00'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={[styles.kpiCard, { backgroundColor: '#1c1c1e' }]}>
                                    <Text style={styles.kpiLabel}>Em Produção</Text>
                                    <Text style={[styles.kpiValue, { color: '#ff9500' }]}>
                                        {activeOrdersCount}
                                    </Text>
                                </View>

                                <View style={[styles.kpiCard, { backgroundColor: '#1c1c1e' }]}>
                                    <Text style={styles.kpiLabel}>Entregues</Text>
                                    <Text style={[styles.kpiValue, { color: '#fff' }]}>
                                        {completedOrdersCount}
                                    </Text>
                                </View>
                            </View>

                            {/* Quick Actions */}
                            <Text style={styles.sectionTitle}>Ações</Text>
                            <View style={styles.actionGrid}>
                                <ThumbCard style={[styles.actionCard, { backgroundColor: '#3a0000', borderColor: '#ff453a', borderWidth: 1 }]} onPress={() => { setIsCommandModalVisible(true); fetchActiveStaff(); }}>
                                    <Text style={styles.actionIcon}>☎️</Text>
                                    <Text style={[styles.actionLabel, { color: '#ff453a' }]}>Telefone Vermelho</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={() => setIsNoticeModalVisible(true)}>
                                    <Text style={styles.actionIcon}>📌</Text>
                                    <Text style={styles.actionLabel}>Mural de Avisos</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={() => setIsMenuManagerOpen(true)}>
                                    <Text style={styles.actionIcon}>📦</Text>
                                    <Text style={styles.actionLabel}>Estoque & Cardápio</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={() => setIsCashManagerOpen(true)}>
                                    <Text style={styles.actionIcon}>💵</Text>
                                    <Text style={styles.actionLabel}>Gaveta de Dinheiro</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={refreshData}>
                                    <Text style={styles.actionIcon}>🔃</Text>
                                    <Text style={styles.actionLabel}>Atualizar Dados</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={() => setIsTaskModalVisible(true)}>
                                    <Text style={styles.actionIcon}>➕</Text>
                                    <Text style={styles.actionLabel}>Nova Tarefa</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={() => setIsProductModalVisible(true)}>
                                    <Text style={styles.actionIcon}>🍔</Text>
                                    <Text style={styles.actionLabel}>Novo Produto</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={handleCloseShift}>
                                    <Text style={styles.actionIcon}>📑</Text>
                                    <Text style={styles.actionLabel}>Relatório Z</Text>
                                </ThumbCard>

                                <ThumbCard style={styles.actionCard} onPress={fetchHistory}>
                                    <Text style={styles.actionIcon}>📜</Text>
                                    <Text style={styles.actionLabel}>Histórico</Text>
                                </ThumbCard>
                            </View>

                            {/* Recent Activity Stream (Mock) */}
                            <Text style={styles.sectionTitle}>Feed da Operação</Text>
                            <View style={styles.feed}>
                                {orders.slice(0, 5).map(o => (
                                    <View key={o.id} style={styles.feedItem}>
                                        <Text style={styles.feedText}>
                                            Mesa {o.table} pediu {o.items.length} itens (€{o.total.toFixed(2)})
                                        </Text>
                                        <Text style={styles.feedTime}>
                                            {o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* CREATE TASK SHEET */}
                    <BottomSheet
                        visible={isTaskModalVisible}
                        onClose={() => setIsTaskModalVisible(false)}
                        title="Nova Tarefa"
                    >
                        <View>
                            <TextInput
                                style={styles.input}
                                placeholder="Título da tarefa..."
                                placeholderTextColor="#666"
                                value={taskTitle}
                                onChangeText={setTaskTitle}
                            />

                            <Text style={styles.label}>Atribuir para:</Text>
                            <View style={styles.roleSelector}>
                                {(['waiter', 'cook', 'cleaning', 'bartender'] as StaffRole[]).map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.roleChip, taskRole === r && styles.roleChipActive]}
                                        onPress={() => setTaskRole(r)}
                                    >
                                        <Text style={[styles.roleChipText, taskRole === r && styles.roleChipTextActive]}>
                                            {r.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Prioridade:</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleChip, taskPriority === 'attention' && styles.roleChipActive]}
                                    onPress={() => setTaskPriority('attention')}
                                >
                                    <Text style={[styles.roleChipText, taskPriority === 'attention' && styles.roleChipTextActive]}>NORMAL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleChip, taskPriority === 'urgent' && styles.roleChipActive, taskPriority === 'urgent' && { backgroundColor: '#ff453a' }]}
                                    onPress={() => setTaskPriority('urgent')}
                                >
                                    <Text style={[styles.roleChipText, taskPriority === 'urgent' && styles.roleChipTextActive]}>URGENTE</Text>
                                </TouchableOpacity>
                            </View>

                            <BottomActionBar
                                primary={{ label: "Criar Tarefa", onPress: handleCreateTask }}
                                secondary={{ label: "Cancelar", onPress: () => setIsTaskModalVisible(false), variant: 'secondary' }}
                            />
                        </View>
                    </BottomSheet>

                    {/* CREATE PRODUCT SHEET */}
                    <BottomSheet
                        visible={isProductModalVisible}
                        onClose={() => setIsProductModalVisible(false)}
                        title="Novo Produto"
                    >
                        <View>
                            <TextInput
                                style={styles.input}
                                placeholder="Nome do Produto..."
                                placeholderTextColor="#666"
                                value={prodName}
                                onChangeText={setProdName}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Preço (ex: 12.50)"
                                placeholderTextColor="#666"
                                value={prodPrice}
                                onChangeText={setProdPrice}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Categoria:</Text>
                            <View style={styles.roleSelector}>
                                {(['food', 'drink', 'other'] as const).map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.roleChip, prodCategory === c && styles.roleChipActive]}
                                        onPress={() => setProdCategory(c)}
                                    >
                                        <Text style={[styles.roleChipText, prodCategory === c && styles.roleChipTextActive]}>
                                            {c === 'food' ? 'Comida' : c === 'drink' ? 'Bebida' : 'Outro'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <BottomActionBar
                                primary={{ label: "Criar Produto", onPress: handleCreateProduct }}
                                secondary={{ label: "Cancelar", onPress: () => setIsProductModalVisible(false), variant: 'secondary' }}
                            />
                        </View>
                    </BottomSheet>

                    {/* NOTICE BOARD SHEET */}
                    <BottomSheet
                        visible={isNoticeModalVisible}
                        onClose={() => setIsNoticeModalVisible(false)}
                        title="Mural de Avisos 📌"
                    >
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.sectionTitle}>Novo Aviso</Text>
                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                placeholder="Escreva o aviso para a equipe..."
                                placeholderTextColor="#666"
                                multiline
                                value={noticeContent}
                                onChangeText={setNoticeContent}
                            />

                            <Text style={styles.label}>Severidade:</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleChip, noticeSeverity === 'info' && styles.roleChipActive]}
                                    onPress={() => setNoticeSeverity('info')}
                                >
                                    <Text style={[styles.roleChipText, noticeSeverity === 'info' && styles.roleChipTextActive]}>INFO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleChip, noticeSeverity === 'attention' && styles.roleChipActive, noticeSeverity === 'attention' && { backgroundColor: '#FFD700' }]}
                                    onPress={() => setNoticeSeverity('attention')}
                                >
                                    <Text style={[styles.roleChipText, noticeSeverity === 'attention' && { color: '#000' }]}>ATENÇÃO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleChip, noticeSeverity === 'critical' && styles.roleChipActive, noticeSeverity === 'critical' && { backgroundColor: '#ff453a' }]}
                                    onPress={() => setNoticeSeverity('critical')}
                                >
                                    <Text style={[styles.roleChipText, noticeSeverity === 'critical' && styles.roleChipTextActive]}>CRÍTICO</Text>
                                </TouchableOpacity>
                            </View>

                            <BottomActionBar
                                primary={{ label: "Publicar Aviso", onPress: handlePostNotice }}
                                secondary={{ label: "Fechar", onPress: () => setIsNoticeModalVisible(false), variant: 'secondary' }}
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Avisos Ativos</Text>
                        {notices.length === 0 ? (
                            <Text style={{ color: '#666', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>Nenhum aviso ativo.</Text>
                        ) : (
                            notices.map((notice) => (
                                <View key={notice.id} style={[styles.feedItem, { borderLeftWidth: 4, borderLeftColor: notice.severity === 'critical' ? 'red' : notice.severity === 'attention' ? 'gold' : 'blue' }]}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                                                {notice.severity.toUpperCase()}
                                            </Text>
                                            <Text style={{ color: '#666', fontSize: 10 }}>
                                                {new Date(notice.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Text style={{ color: '#ccc', fontSize: 14 }}>{notice.content}</Text>
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={{ color: '#666', fontSize: 10 }}>
                                                Visto por: {notice.read_by_me ? 'Mim' : '??'} (TODO: count)
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteNotice(notice.id)} style={{ padding: 8 }}>
                                        <Text>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                        {/* Add spacing for bottom content */}
                        <View style={{ height: 100 }} />
                        <View style={{ height: 100 }} />
                    </BottomSheet>

                    {/* RED PHONE SHEET */}
                    <BottomSheet
                        visible={isCommandModalVisible}
                        onClose={() => setIsCommandModalVisible(false)}
                        title="Telefone Vermelho ☎️"
                    >
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ color: '#666', marginBottom: 10 }}>
                                Canal direto de comando. Use apenas para urgências operacionais.
                            </Text>

                            <Text style={styles.label}>Para quem?</Text>
                            <ScrollView horizontal style={{ marginBottom: 20 }}>
                                {activeStaffList.length === 0 ? (
                                    <Text style={{ color: '#444' }}>Sem staff ativo no momento.</Text>
                                ) : (
                                    activeStaffList.map((staff) => (
                                        <TouchableOpacity
                                            key={staff.user_id}
                                            style={[styles.roleChip, targetId === staff.user_id && styles.roleChipActive]}
                                            onPress={() => setTargetId(staff.user_id)}
                                        >
                                            <Text style={[styles.roleChipText, targetId === staff.user_id && styles.roleChipTextActive]}>
                                                {staff.active_role.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>

                            <Text style={styles.label}>Comando (Max 140):</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top', borderColor: '#ff453a', borderWidth: 1 }]}
                                placeholder="Ex: Atenção mesa 5, cliente VIP."
                                placeholderTextColor="#666"
                                multiline
                                maxLength={140}
                                value={commandContent}
                                onChangeText={setCommandContent}
                            />

                            <BottomActionBar
                                primary={{ label: "ENVIAR COMANDO", onPress: handleSendCommand, variant: 'destructive' }}
                                secondary={{ label: "Cancelar", onPress: () => setIsCommandModalVisible(false), variant: 'secondary' }}
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Histórico Recente</Text>
                        {sentCommands.map(cmd => (
                            <View key={cmd.id} style={styles.feedItem}>
                                <View>
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{cmd.content}</Text>
                                    <Text style={{ color: '#666', fontSize: 10 }}> Status: {cmd.status.toUpperCase()} {cmd.response ? `| Resp: ${cmd.response}` : ''}</Text>
                                </View>
                            </View>
                        ))}
                        <View style={{ height: 100 }} />
                    </BottomSheet>

                    {/* HISTORY SHEET */}
                    <BottomSheet
                        visible={isHistoryModalVisible}
                        onClose={() => setIsHistoryModalVisible(false)}
                        title="Histórico de Turnos"
                    >
                        <View style={{ maxHeight: 400 }}>
                            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                                {historyShifts.length === 0 ? (
                                    <Text style={{ color: '#666', textAlign: 'center', padding: 20 }}>Nenhum histórico recente.</Text>
                                ) : (
                                    historyShifts.map(s => (
                                        <View key={s.id} style={styles.feedItem}>
                                            <View>
                                                <Text style={styles.feedText}>
                                                    {s.status === 'open' ? '🟢 ABERTO' : '🔴 FECHADO'}
                                                </Text>
                                                <Text style={styles.feedTime}>
                                                    Início: {new Date(s.started_at).toLocaleString()}
                                                </Text>
                                                {s.ended_at && (
                                                    <Text style={styles.feedTime}>
                                                        Fim: {new Date(s.ended_at).toLocaleString()}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                )}
                            </ScrollView>

                            <BottomActionBar
                                primary={{ label: "Fechar", onPress: () => setIsHistoryModalVisible(false) }}
                            />
                        </View>
                    </BottomSheet>

                    <MenuManagerModal
                        visible={isMenuManagerOpen}
                        onClose={() => setIsMenuManagerOpen(false)}
                    />

                    <CashManagementModal
                        visible={isCashManagerOpen}
                        onClose={() => setIsCashManagerOpen(false)}
                    />
                </ScrollView>
            </ShiftGate >
        </RoleGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    settingsBtn: {
        padding: 8,
        backgroundColor: '#1c1c1e',
        borderRadius: 20,
    },
    subTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        fontWeight: '600',
        letterSpacing: 1,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    kpiCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    kpiLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 10,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%', // Approx 2 columns
        alignItems: 'center',
        paddingVertical: 20, // More padding for thumb
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    feed: {
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
        padding: 4,
        marginBottom: 40,
    },
    feedItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    feedText: {
        color: '#ccc',
        fontSize: 14,
        flex: 1,
    },
    feedTime: {
        color: '#666',
        fontSize: 12,
    },
    input: {
        backgroundColor: '#333',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
    },
    label: {
        color: '#888',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    roleSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    roleChip: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    roleChipActive: {
        backgroundColor: '#0a84ff',
    },
    roleChipText: {
        color: '#ccc',
        fontSize: 12,
        fontWeight: '600',
    },
    roleChipTextActive: {
        color: '#fff',
    },
    // Segmented Control
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#2c2c2e',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentBtnActive: {
        backgroundColor: '#636366',
    },
    segmentText: {
        color: '#888',
        fontWeight: '600',
    },
    segmentTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
