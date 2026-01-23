import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAppStaff } from '@/context/AppStaffContext';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { validateAmount } from '@/utils/validation';
import { withPermission } from '@/utils/permissionWrapper';
import { AuditLogService } from '@/services/AuditLogService';
import { useAuth } from '@/context/AuthContext';

export function FinancialVault() {
    const {
        financialState,
        financialSessionId,
        openFinancialSession,
        closeFinancialSession,
        canAccess,
        operationalContext,
        shiftId
    } = useAppStaff();
    const { session } = useAuth();

    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'menu' | 'add' | 'remove' | 'close'>('menu');

    // Inputs
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    // Stats
    const [sessionData, setSessionData] = useState<any>(null);

    useEffect(() => {
        if (financialState === 'drawer_open' && financialSessionId) {
            fetchSessionData();
        }
    }, [financialState, financialSessionId]);

    const fetchSessionData = async () => {
        if (!financialSessionId) return;

        try {
            const { data: session } = await supabase
                .from('gm_financial_sessions')
                .select('*')
                .eq('id', financialSessionId)
                .single();
            setSessionData(session);
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenDrawer = async () => {
        // Bug #14 Fix: Validação de valores
        const validation = validateAmount(amount);
        if (!validation.valid) {
            Alert.alert('Erro', validation.error);
            return;
        }

        const floatVal = parseFloat(amount.replace(',', '.'));
        setLoading(true);
        await openFinancialSession(floatVal);
        setLoading(false);
        setAmount('');
    };

    const handleMovement = async (type: 'supply' | 'bleed') => {
        if (!financialSessionId) return;
        
        // Bug #14 Fix: Validação de valores
        const validation = validateAmount(amount);
        if (!validation.valid) {
            Alert.alert('Erro', validation.error);
            return;
        }
        
        const moveAmount = parseFloat(amount.replace(',', '.'));
        if (moveAmount <= 0) {
            Alert.alert('Erro', 'Valor deve ser maior que zero');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Erro', 'Motivo é obrigatório');
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('gm_cash_movements').insert({
            session_id: financialSessionId, // Phase 35
            type,
            amount_cents: Math.round(moveAmount * 100), // Phase 20 Fix
            reason
        });

        if (error) {
            Alert.alert('Erro', 'Falha ao registrar movimento');
        } else {
            // Bug #13 Fix: Log de auditoria para movimento de caixa
            if (session?.user?.id) {
                await AuditLogService.logCashMovement(
                    session.user.id,
                    operationalContext.businessId,
                    type,
                    Math.round(moveAmount * 100), // em centavos
                    reason,
                    shiftId || undefined
                );
            }
            
            Alert.alert('Sucesso', 'Movimento registrado');
            setMode('menu');
            setAmount('');
            setReason('');
        }
        setLoading(false);
    };

    // Bug #5 Fix: Validar pedidos pendentes antes de fechar caixa
    const handleCloseDrawer = async () => {
        // Bug #14 Fix: Validação de valores
        const validation = validateAmount(amount);
        if (!validation.valid) {
            Alert.alert('Erro', validation.error);
            return;
        }
        
        const actualCash = parseFloat(amount.replace(',', '.'));
        
        // VALIDAÇÃO: Verificar pedidos pendentes
        try {
            const { data: pendingOrders } = await supabase
                .from('gm_orders')
                .select('id, table_number, status')
                .eq('restaurant_id', operationalContext.businessId)
                .in('status', ['OPEN', 'IN_PREP', 'READY', 'DELIVERED'])
                .eq('payment_status', 'pending');
            
            if (pendingOrders && pendingOrders.length > 0) {
                Alert.alert(
                    'Pedidos Pendentes',
                    `Existem ${pendingOrders.length} pedido(s) pendente(s). Deseja fechar o caixa mesmo assim?`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Fechar Mesmo Assim',
                            style: 'destructive',
                            onPress: async () => {
                                setLoading(true);
                                await closeFinancialSession(actualCash, reason);
                                setLoading(false);
                                Alert.alert('Turno Fechado', `Caixa encerrado com: €${actualCash.toFixed(2)}`);
                                setMode('menu');
                                setAmount('');
                                setReason('');
                            }
                        }
                    ]
                );
                return;
            }
        } catch (error) {
            console.error('[FinancialVault] Error checking pending orders:', error);
            // Continuar com fechamento mesmo se houver erro na validação
        }

        // Se não há pendências, fechar normalmente
        setLoading(true);
        await closeFinancialSession(actualCash, reason);
        setLoading(false);

        Alert.alert('Turno Fechado', `Caixa encerrado com: €${actualCash.toFixed(2)}`);
        setMode('menu'); // Reset UI state locally
        setAmount('');
        setReason('');
    };

    // 🔒 RBAC Check
    if (!canAccess('cash:handle')) {
        return (
            <View style={styles.center}>
                <Ionicons name="lock-closed" size={48} color="#666" />
                <Text style={styles.message}>Você não tem permissão para acessar o cofre.</Text>
            </View>
        );
    }

    // 1. Drawer is CLOSED -> Show Open UI
    if (financialState === 'drawer_closed') {
        return (
            <View style={styles.container}>
                <Ionicons name="wallet-outline" size={48} color="#FFCC00" style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Text style={styles.title}>Abrir Cofre (Caixa)</Text>
                <Text style={styles.subtitle}>Informe o fundo de troco inicial.</Text>

                <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="€ 0.00"
                    placeholderTextColor="#666"
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenDrawer} disabled={loading}>
                    {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Abrir Caixa</Text>}
                </TouchableOpacity>
            </View>
        );
    }

    // 2. Drawer is OPEN -> Show Management UI
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Meu Caixa</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>ABERTO</Text>
                </View>
            </View>

            {sessionData && (
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Fundo Inicial</Text>
                    <Text style={styles.statValue}>€{(sessionData.starting_float / 100).toFixed(2)}</Text>
                    <Text style={styles.statTime}>Início: {new Date(sessionData.started_at).toLocaleTimeString()}</Text>
                </View>
            )}

            {mode === 'menu' && (
                <View style={styles.menuGrid}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setMode('add')}>
                        <Ionicons name="add-circle" size={32} color="#32d74b" />
                        <Text style={styles.menuLabel}>Suprimento</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setMode('remove')}>
                        <Ionicons name="remove-circle" size={32} color="#ff453a" />
                        <Text style={styles.menuLabel}>Sangria</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#3a1c1c' }]} onPress={() => setMode('close')}>
                        <Ionicons name="lock-closed" size={32} color="#ff453a" />
                        <Text style={[styles.menuLabel, { color: '#ff453a' }]}>Fechar Caixa</Text>
                    </TouchableOpacity>
                </View>
            )}

            {(mode === 'add' || mode === 'remove') && (
                <View style={styles.form}>
                    <Text style={styles.formTitle}>{mode === 'add' ? 'Adicionar Dinheiro' : 'Retirar Dinheiro'}</Text>

                    <Text style={styles.label}>Valor (€)</Text>
                    <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.label}>Motivo</Text>
                    <TextInput
                        style={styles.input}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Ex: Troco extra"
                        placeholderTextColor="#666"
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('menu')}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, mode === 'remove' && { backgroundColor: '#ff453a' }]}
                            onPress={() => handleMovement(mode === 'add' ? 'supply' : 'bleed')}
                        >
                            <Text style={styles.btnText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {mode === 'close' && (
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Encerrar Sessão</Text>
                    <Text style={styles.subtitle}>Conte o dinheiro físico na gaveta.</Text>

                    <Text style={styles.label}>Valor Total em Caixa (€)</Text>
                    <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.label}>Notas (Opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Observações de fechamento"
                        placeholderTextColor="#666"
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('menu')}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: '#ff453a' }]}
                            onPress={handleCloseDrawer}
                        >
                            <Text style={styles.btnText}>Fechar Caixa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    message: { color: '#888', marginTop: 16, fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
    badge: { backgroundColor: '#32d74b20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#32d74b', fontWeight: 'bold', fontSize: 12 },
    statCard: { backgroundColor: '#1c1c1e', padding: 16, borderRadius: 12, marginBottom: 24 },
    statLabel: { color: '#888', textTransform: 'uppercase', fontSize: 12 },
    statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginVertical: 4 },
    statTime: { color: '#666', fontSize: 12 },
    menuGrid: { flexDirection: 'row', gap: 12 },
    menuItem: { flex: 1, backgroundColor: '#1c1c1e', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { color: '#fff', marginTop: 8, fontWeight: '600' },
    form: { backgroundColor: '#1c1c1e', padding: 20, borderRadius: 16 },
    formTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    label: { color: '#ccc', marginTop: 16, marginBottom: 8 },
    input: { backgroundColor: '#2c2c2e', color: '#fff', padding: 12, borderRadius: 8, fontSize: 18 },
    actions: { flexDirection: 'row', marginTop: 24, gap: 12 },
    confirmBtn: { flex: 1, backgroundColor: '#32d74b', padding: 16, borderRadius: 8, alignItems: 'center' },
    cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
    cancelText: { color: '#0a84ff', fontWeight: 'bold' },
    primaryBtn: { backgroundColor: '#FFCC00', padding: 16, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});
