import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder, Order } from '@/context/OrderContext';
import { HapticFeedback } from '@/services/haptics';
import { Audio } from 'expo-av';
import { useAppStaff } from '@/context/AppStaffContext';
import { Ionicons } from '@expo/vector-icons';
import { ProductionBoard, SafetyCurtain } from '@/components/kitchen';
import { useRouteGuard } from '@/hooks/useRouteGuard';

export default function KitchenScreen() {
    // Bug #3 Fix: Route guard
    useRouteGuard({ allowedRoles: ['cook', 'chef', 'manager', 'owner', 'admin'] });
    
    const { orders, updateOrderStatus } = useOrder();
    const { shiftId, stations, getStationForCategory } = useAppStaff();
    const [now, setNow] = useState(new Date());
    const prevOrderCount = useRef(0);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    // ERRO-007 Fix: Flash visual para novos pedidos
    const [flashNewOrder, setFlashNewOrder] = useState<string | null>(null);
    const flashAnim = useRef(new Animated.Value(0)).current;

    // Identify Kitchen Station
    const kitchenStation = stations.find(s => s.name === 'Cozinha');

    // Filter Logic
    const hasKitchenItems = (order: Order) => {
        if (!kitchenStation) return true; // Fallback: show all if loading
        return order.items.some(i => {
            const s = getStationForCategory(i.category);
            // Default to Kitchen if null? Or strict?
            // Migration ensures all have station_id.
            // But if new items created without mapped category...
            // Let's assume KITCHEN is default for anything not 'Bar'.
            return s?.id === kitchenStation.id || (!s && i.category !== 'drink');
        });
    };

    // Update timer every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const activeOrders = orders.filter(o =>
        (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'delivered') &&
        (o.shiftId === shiftId)
    );

    // Optimizing: only pass relevant orders
    const kitchenOrders = activeOrders.filter(hasKitchenItems);

    // Sound Logic: Play 'Ding' when activeOrders increase (only new ones)
    const newOrdersCount = kitchenOrders.filter(o => o.status === 'pending').length;

    // ERRO-007 Fix: Detectar novos pedidos e ativar flash visual
    useEffect(() => {
        const playSound = async () => {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: 'https://www.soundjay.com/buttons/beep-01a.mp3' }
                );
                await sound.playAsync();
            } catch (error) {
                console.log('Error playing sound', error);
            }
        };

        if (newOrdersCount > prevOrderCount.current) {
            playSound();
            HapticFeedback.medium(); // ERRO-007 Fix: Vibração
            
            // ERRO-007 Fix: Flash visual para novos pedidos
            const newOrders = kitchenOrders.filter(o => {
                const timeSinceCreated = Date.now() - o.createdAt.getTime();
                return o.status === 'pending' && timeSinceCreated < 5000; // Últimos 5 segundos
            });
            
            if (newOrders.length > 0) {
                setFlashNewOrder(newOrders[0].id);
                // Flash por 5 segundos
                Animated.sequence([
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start();
                
                setTimeout(() => {
                    setFlashNewOrder(null);
                }, 5000);
            }
        }
        prevOrderCount.current = newOrdersCount;
    }, [newOrdersCount, kitchenOrders]);

    // SIMPLIFICADO: 1 toque muda status (toque duplo era frágil em cozinha movimentada)
    const handleBump = (orderId: string, currentStatus: Order['status']) => {
        HapticFeedback.success();
        const nextStatus = currentStatus === 'pending' ? 'preparing' : 'ready';
        updateOrderStatus(orderId, nextStatus);
        // Confirmação visual será mostrada pelo ProductionBoard (check verde)
    };

    const handleRecall = (orderId: string) => {
        HapticFeedback.medium();
        updateOrderStatus(orderId, 'preparing');
    };

    return (
        <ShiftGate>
            <View style={styles.container}>
                {/* Header - Minimalist */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="restaurant" size={24} color="#FFCC00" style={{ marginRight: 8 }} />
                        <Text style={styles.screenTitle}>COZINHA</Text>
                    </View>
                    <Text style={styles.clock}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                {/* Main Production Board (The Line) */}
                {/* ERRO-007 Fix: Flash visual para novos pedidos */}
                {flashNewOrder && (
                    <Animated.View 
                        style={[
                            styles.flashOverlay,
                            {
                                opacity: flashAnim,
                            }
                        ]}
                        pointerEvents="none"
                    />
                )}
                <ProductionBoard
                    orders={kitchenOrders}
                    now={now}
                    onBump={handleBump}
                    onRecall={handleRecall}
                    station={kitchenStation}
                />

                {/* The Shield (Overlay) */}
                <SafetyCurtain />

            </View>
        </ShiftGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Deep black for better contrast
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12, // More spacing for header
        paddingBottom: 12,
        backgroundColor: '#1c1c1e',
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    screenTitle: {
        color: '#FFCC00',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    },
    clock: {
        color: '#888',
        fontSize: 18,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums']
    },
    // ERRO-007 Fix: Flash visual para novos pedidos
    flashOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ff4444',
        zIndex: 1000,
        pointerEvents: 'none',
    },
});
