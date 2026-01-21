import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder } from '@/context/OrderContext';
import { useAppStaff } from '@/context/AppStaffContext';

export default function ManagerScreen() {
    const { orders } = useOrder();
    const { roleConfig } = useAppStaff();

    // 1. Calculate Revenue (Total Value of all orders)
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // 2. Active Orders (Pending/Preparing)
    const activeOrdersCount = orders.filter(
        o => o.status === 'pending' || o.status === 'preparing'
    ).length;

    // 3. Completed Orders (Ready/Delivered)
    const completedOrdersCount = orders.filter(
        o => o.status === 'ready' || o.status === 'delivered'
    ).length;

    // 4. Unique Occupied Tables
    const occupiedTables = new Set(
        orders.filter(o => o.status !== 'delivered').map(o => o.table)
    ).size;

    return (
        <ShiftGate>
            <ScrollView style={styles.container}>
                <Text style={styles.headerTitle}>📊 Gestão Operacional</Text>
                <Text style={styles.subTitle}>{roleConfig.role.toUpperCase()} MODE</Text>

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
                <Text style={styles.sectionTitle}>Ações Rápidas</Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => Alert.alert("Relatório", "Gerando PDF de fechamento...")}
                    >
                        <Text style={styles.btnIcon}>📑</Text>
                        <Text style={styles.btnText}>Relatório Z</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => Alert.alert("Equipe", "Notificação enviada: 'Acelerar serviço!'")}
                    >
                        <Text style={styles.btnIcon}>📢</Text>
                        <Text style={styles.btnText}>Alerta Geral</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => Alert.alert("Estoque", "Verificando níveis críticos...")}
                    >
                        <Text style={styles.btnIcon}>📦</Text>
                        <Text style={styles.btnText}>Estoque</Text>
                    </TouchableOpacity>
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

            </ScrollView>
        </ShiftGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
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
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionBtn: {
        backgroundColor: '#1c1c1e',
        width: '30%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    btnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
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
});
