import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Animated,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/BottomSheet';
import { BottomActionBar } from '@/components/BottomActionBar';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder } from '@/context/OrderContext';
import { useAppStaff } from '@/context/AppStaffContext';
import { HapticFeedback } from '@/services/haptics';
import { FastPayButton } from '@/components/FastPayButton';
import { WaitlistBoard } from '@/components/WaitlistBoard';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useMemo } from 'react';
import { useTables } from '@/hooks/useTables';

// ERRO-007 Fix: Removido mock, usando hook useTables

// ERRO-007 Fix: Função para determinar urgência da mesa
function getTableUrgency(orders: any[]): 'normal' | 'warning' | 'critical' {
    if (orders.length === 0) return 'normal';
    const now = Date.now();
    const hasUrgent = orders.some(o => {
        const elapsed = now - o.createdAt.getTime();
        return elapsed > 20 * 60000; // > 20min
    });
    if (hasUrgent) return 'critical';
    const hasWarning = orders.some(o => {
        const elapsed = now - o.createdAt.getTime();
        return elapsed > 10 * 60000; // > 10min
    });
    if (hasWarning) return 'warning';
    return 'normal';
}

type TableStatus = 'free' | 'waiting' | 'ready' | 'eating' | 'reserved';

const STATUS_CONFIG: Record<TableStatus, { color: string; label: string; icon: string }> = {
    free: { color: '#32d74b', label: 'Livre', icon: 'checkmark-circle' },
    waiting: { color: '#ffd60a', label: 'Aguardando', icon: 'time' },
    ready: { color: '#ff9f0a', label: 'Pronto!', icon: 'restaurant' },
    eating: { color: '#5856d6', label: 'Servido', icon: 'cafe' },
    reserved: { color: '#666', label: 'Reservada', icon: 'calendar' },
};



function TableCard({ table, orders, onSelect, onMarkFree, urgency = 'normal' }: {
    table: { id: string; label: string; number?: number; zone?: string; seats?: number };
    orders: any[];
    onSelect: () => void;
    onMarkFree: () => void;
    urgency?: 'normal' | 'warning' | 'critical';
}) {
    const [pulseAnim] = useState(new Animated.Value(1));
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Determine status based on orders (definir ANTES do useEffect)
    const tableNumber = String(table.number || table.id);
    const tableOrders = (orders || []).filter(o => o.table === tableNumber && o.status !== 'paid');

    // SEMANA 2: Timer atualizado a cada segundo (otimizado: só atualiza se necessário)
    useEffect(() => {
        // Só atualiza timer se mesa estiver ocupada
        if (tableOrders.length === 0) return;

        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [tableOrders.length]);
    const hasReadyOrder = tableOrders.some(o => o.status === 'ready');
    const hasPreparingOrder = tableOrders.some(o => o.status === 'preparing');
    const hasDeliveredOrder = tableOrders.some(o => o.status === 'delivered');
    const hasPendingOrder = tableOrders.some(o => o.status === 'pending');
    const wantsToPay = tableOrders.some(o => o.status === 'delivered'); // SEMANA 2: "quer pagar"
    const waitingForDrink = tableOrders.some(o =>
        o.status === 'preparing' && o.items?.some((item: any) => item.category === 'drink')
    ); // SEMANA 2: "esperando bebida"

    let status: TableStatus = 'free';
    if (hasReadyOrder) status = 'ready';
    else if (hasPreparingOrder || hasPendingOrder) status = 'waiting';
    else if (hasDeliveredOrder) status = 'eating';
    else if (tableOrders.length === 0) status = 'free';

    const config = STATUS_CONFIG[status];

    // SEMANA 2: Calcular tempo desde último evento (não apenas criação)
    const getLastEventTime = () => {
        if (tableOrders.length === 0) return null;

        // Último evento = última atualização do pedido mais recente
        const lastUpdate = Math.max(
            ...tableOrders.map(o => new Date(o.updatedAt || o.createdAt).getTime())
        );
        return lastUpdate;
    };

    const lastEventTime = getLastEventTime();
    const elapsedMinutes = lastEventTime
        ? Math.floor((currentTime - lastEventTime) / 60000)
        : 0;

    // SEMANA 2: Cores de urgência baseadas em tempo
    const getUrgencyColor = (): string => {
        if (status === 'free') return '#32d74b'; // Verde
        if (elapsedMinutes < 15) return '#32d74b'; // Verde: < 15min
        if (elapsedMinutes < 30) return '#ffd60a'; // Amarelo: 15-30min
        return '#ff453a'; // Vermelho: > 30min
    };

    const urgencyColor = getUrgencyColor();

    // Pulsing animation for ready status
    useEffect(() => {
        if (status === 'ready') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.6, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [status]);

    // handleLongPress removed

    return (
        <Animated.View style={{ opacity: status === 'ready' ? pulseAnim : 1 }}>
            <TouchableOpacity
                style={[styles.tableCard, { borderColor: urgencyColor }]}
                onPress={onSelect}
            >
                {/* SEMANA 2: Status dot com cor de urgência */}
                <View style={[styles.statusDot, { backgroundColor: urgencyColor }]} />
                <Text style={styles.tableLabel}>{table.label}</Text>
                <View style={styles.statusRow}>
                    <Ionicons name={config.icon as any} size={14} color={urgencyColor} />
                    <Text style={[styles.statusText, { color: urgencyColor }]}>{config.label}</Text>
                </View>

                {/* SEMANA 2: Timer sempre visível quando ocupada */}
                {status !== 'free' && (
                    <View style={[styles.timerBadge, elapsedMinutes >= 30 && styles.timerBadgeUrgent]}>
                        <Ionicons
                            name="time-outline"
                            size={10}
                            color={elapsedMinutes >= 30 ? '#ff453a' : elapsedMinutes >= 15 ? '#ffd60a' : '#888'}
                        />
                        <Text style={[
                            styles.timerText,
                            elapsedMinutes >= 30 && styles.timerTextUrgent,
                            elapsedMinutes >= 15 && elapsedMinutes < 30 && { color: '#ffd60a' }
                        ]}>
                            {elapsedMinutes}m
                        </Text>
                    </View>
                )}

                {/* SEMANA 2: Ícone "quer pagar" */}
                {wantsToPay && (
                    <View style={styles.wantsToPayBadge}>
                        <Ionicons name="cash-outline" size={12} color="#32d74b" />
                    </View>
                )}

                {/* SEMANA 2: Ícone "esperando bebida" */}
                {waitingForDrink && (
                    <View style={styles.waitingDrinkBadge}>
                        <Ionicons name="wine-outline" size={12} color="#0a84ff" />
                    </View>
                )}

                {tableOrders.length > 0 && (
                    <View style={styles.orderCountBadge}>
                        <Text style={styles.orderCountText}>{tableOrders.length}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function TablesScreen() {
    // Bug #3 Fix: Route guard - apenas roles que podem ver mesas
    useRouteGuard({
        allowedRoles: ['waiter', 'manager', 'owner', 'chef', 'admin', 'supervisor'],
        redirectTo: '/(tabs)/staff'
    });

    const { activeRole, shiftId, canAccess } = useAppStaff();
    const router = useRouter();
    const { orders, setActiveTable, updateOrderStatus } = useOrder();
    // ERRO-007 Fix: Buscar mesas do banco
    const { tables: dbTables, loading: tablesLoading } = useTables();

    const [selectedTable, setSelectedTable] = useState<{ id: string; label: string; number?: number } | null>(null);

    const handleTableTap = (table: { id: string; label: string; number?: number }) => {
        HapticFeedback.light();
        setSelectedTable(table);
    };

    const handleOpenOrder = () => {
        if (!selectedTable) return;
        setActiveTable(selectedTable.id);
        setSelectedTable(null);
        router.navigate('/(tabs)' as any);
    };

    const handleMarkFree = () => {
        if (!selectedTable) return;

        // Confirmation Logic inside Sheet? Or separate Alert? 
        // User asked for "Big Liberar Button". Better to just do it or show ONE confirmation?
        // Let's do a quick confirmation ALERT for safety, or just do it if we trust the "Destructive" styling.
        // Let's use Alert for safety on Destructive actions as per existing logic, but triggered from Sheet.

        Alert.alert(
            'Confirmar',
            'Liberar mesa e fechar pedidos?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Liberar',
                    style: 'destructive',
                    onPress: () => {
                        const tableOrders = filteredOrders.filter(o => o.table === selectedTable.id && o.status !== 'paid');
                        tableOrders.forEach(o => updateOrderStatus(o.id, 'paid'));
                        HapticFeedback.success();
                        setSelectedTable(null);
                    }
                }
            ]
        );
    };

    const [filter, setFilter] = useState<'all' | 'free' | 'busy'>('all');
    const [showWaitlist, setShowWaitlist] = useState(false);

    // Bug #11 Fix: Filtrar pedidos por role/shift antes de usar
    const filteredOrders = useMemo(() => {
        // Manager, Owner, Admin veem todos
        if (canAccess('order:view_all')) {
            return orders;
        }

        // Outros roles veem apenas pedidos do turno atual
        return orders.filter(o => o.shiftId === shiftId);
    }, [orders, shiftId, canAccess]);

    // Determine status of selected table for Sheet actions
    const selectedOrders = selectedTable ? filteredOrders.filter(o => o.table === String(selectedTable.number || selectedTable.id) && o.status !== 'paid') : [];
    const isOccupied = selectedOrders.length > 0;

    // ERRO-007 Fix: Usar mesas do banco em vez de mock
    const tables = useMemo(() => {
        return dbTables.map(t => ({
            id: t.id,
            label: `Mesa ${t.number}`,
            number: t.number,
            zone: t.zone || 'Salão 1',
            seats: t.seats
        }));
    }, [dbTables]);

    // ERRO-007 Fix: Agrupar mesas por zona
    const tablesByZone = useMemo(() => {
        const grouped: Record<string, typeof tables> = {};
        tables.forEach(table => {
            const zone = table.zone || 'Salão 1';
            if (!grouped[zone]) grouped[zone] = [];
            grouped[zone].push(table);
        });
        return grouped;
    }, [tables]);

    // Filter Logic
    const filteredTables = tables.filter(table => {
        const tableOrders = filteredOrders.filter(o => o.table === String(table.number) && o.status !== 'paid');
        const isTableOccupied = tableOrders.length > 0;
        if (filter === 'free') return !isTableOccupied;
        if (filter === 'busy') return isTableOccupied;
        return true;
    });

    const freeCount = tables.filter(t => !filteredOrders.some(o => o.table === String(t.number) && o.status !== 'paid')).length;
    const busyCount = tables.length - freeCount;

    return (
        <ShiftGate>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.screenTitle}>🗺️ Salão</Text>
                    <TouchableOpacity
                        style={styles.waitlistButton}
                        onPress={() => setShowWaitlist(true)}
                    >
                        <Ionicons name="list" size={20} color="#32d74b" />
                        <Text style={styles.waitlistButtonText}>Lista</Text>
                    </TouchableOpacity>
                </View>

                {/* ERRO-007 Fix: Grid por zonas */}
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {Object.entries(tablesByZone).map(([zone, zoneTables]) => {
                        const zoneFiltered = zoneTables.filter(table => {
                            const tableOrders = filteredOrders.filter(o => o.table === String(table.number) && o.status !== 'paid');
                            const isTableOccupied = tableOrders.length > 0;
                            if (filter === 'free') return !isTableOccupied;
                            if (filter === 'busy') return isTableOccupied;
                            return true;
                        });

                        if (zoneFiltered.length === 0) return null;

                        return (
                            <View key={zone} style={styles.zoneSection}>
                                <Text style={styles.zoneTitle}>{zone}</Text>
                                <View style={styles.zoneGrid}>
                                    {zoneFiltered.map(table => {
                                        const tableOrders = filteredOrders.filter(o => o.table === String(table.number) && o.status !== 'paid');
                                        const urgency = getTableUrgency(tableOrders);
                                        return (
                                            <TableCard
                                                key={table.id}
                                                table={table}
                                                orders={filteredOrders}
                                                onSelect={() => handleTableTap(table)}
                                                onMarkFree={() => { }}
                                                urgency={urgency}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* BOTTOM FILTER BAR */}
                <View style={styles.filterBar}>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                        onPress={() => { setFilter('all'); HapticFeedback.light(); }}
                    >
                        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todas ({tables.length})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'free' && styles.filterTabActive]}
                        onPress={() => { setFilter('free'); HapticFeedback.light(); }}
                    >
                        <View style={[styles.dot, { backgroundColor: '#32d74b' }]} />
                        <Text style={[styles.filterText, filter === 'free' && styles.filterTextActive]}>Livres ({freeCount})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'busy' && styles.filterTabActive]}
                        onPress={() => { setFilter('busy'); HapticFeedback.light(); }}
                    >
                        <View style={[styles.dot, { backgroundColor: '#ffd60a' }]} />
                        <Text style={[styles.filterText, filter === 'busy' && styles.filterTextActive]}>Ocupadas ({busyCount})</Text>
                    </TouchableOpacity>
                </View>

                {/* TABLE DETAILS SHEET */}
                <BottomSheet
                    visible={!!selectedTable}
                    onClose={() => setSelectedTable(null)}
                    title={selectedTable?.label || 'Mesa'}
                >
                    <View style={styles.sheetContent}>
                        <View style={styles.sheetStats}>
                            <Text style={styles.sheetStatus}>
                                {isOccupied ? `${selectedOrders.length} Pedidos Ativos` : 'Mesa Livre'}
                            </Text>
                            {isOccupied && (
                                <Text style={styles.sheetTotal}>
                                    Total: €{selectedOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                                </Text>
                            )}
                        </View>

                        <View style={{ height: 20 }} />

                        {/* SEMANA 1: FAST PAY - Botão único para cobrar tudo */}
                        {isOccupied && selectedTable && (
                            <View style={styles.fastPayContainer}>
                                {selectedOrders.map(order => (
                                    <FastPayButton
                                        key={order.id}
                                        orderId={order.id}
                                        total={order.total}
                                        tableId={selectedTable.id}
                                        onSuccess={() => {
                                            setSelectedTable(null);
                                            HapticFeedback.success();
                                        }}
                                    />
                                ))}
                            </View>
                        )}

                        <BottomActionBar
                            primary={{
                                label: isOccupied ? "Ver Pedidos / Adicionar" : "Abrir Mesa / Pedido",
                                onPress: handleOpenOrder
                            }}
                            secondary={isOccupied ? {
                                label: "Liberar Mesa",
                                onPress: handleMarkFree,
                                variant: 'destructive'
                            } : undefined}
                        />
                    </View>
                </BottomSheet>

                {/* SEMANA 4: RESERVAS LITE - Lista de Espera */}
                <WaitlistBoard
                    visible={showWaitlist}
                    onClose={() => setShowWaitlist(false)}
                    onAssignTable={(entryId, tableId) => {
                        setActiveTable(tableId);
                        setShowWaitlist(false);
                        HapticFeedback.success();
                    }}
                />
            </View>
        </ShiftGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        padding: 10,
    },
    header: {
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginVertical: 10,
    },
    statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    statText: { color: '#888', fontSize: 12 },
    listContainer: { paddingBottom: 100 }, // Added padding for filter bar
    // ERRO-007 Fix: Estilos para grid por zonas
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Espaço para filter bar
    },
    zoneSection: {
        marginBottom: 24,
    },
    zoneTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    zoneGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 4,
    },
    tableCard: {
        flex: 1,
        margin: 5,
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        minHeight: 100,
        position: 'relative',
    },
    statusDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    tableLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusText: { fontSize: 11, fontWeight: '600' },
    timerBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    timerBadgeUrgent: { backgroundColor: 'rgba(255,69,58,0.2)' },
    timerText: { fontSize: 9, color: '#888' },
    timerTextUrgent: { color: '#ff453a' },
    orderCountBadge: {
        position: 'absolute',
        top: -5,
        left: -5,
        backgroundColor: '#d4a574',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderCountText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
    // SEMANA 2: Badges de urgência
    wantsToPayBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#32d74b',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
    },
    waitingDrinkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#0a84ff',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
    },
    // Filter Bar Replaces Legend
    filterBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        padding: 4,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6
    },
    filterTabActive: {
        backgroundColor: '#333'
    },
    filterText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 12
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: 'bold'
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    // Sheet Styles
    sheetContent: {
        paddingBottom: 20
    },
    sheetStats: {
        alignItems: 'center',
        paddingVertical: 10
    },
    sheetStatus: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8
    },
    sheetTotal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#32d74b'
    },
    fastPayContainer: {
        marginBottom: 16,
        gap: 8,
    },
    waitlistButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#32d74b',
    },
    waitlistButtonText: {
        color: '#32d74b',
        fontSize: 14,
        fontWeight: '600',
    }
});
