import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, AppState, AppStateStatus } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Order } from '@/context/OrderContext';

interface TicketProps {
    order: Order;
    now: Date; // Kept for backwards compatibility, but we use internal timer
    items: { count: number, name: string }[];
    onBump: (orderId: string, currentStatus: Order['status']) => void;
    station: 'kitchen' | 'bar';
}

/**
 * KDSTicket - v1.2.0
 * 
 * Self-updating timer for more responsive urgency colors.
 * Uses internal interval that respects AppState.
 */
export const KDSTicket: React.FC<TicketProps> = ({ order, items, onBump, station }) => {
    // Local State for Strikethrough
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
    const [blinkAnim] = useState(new Animated.Value(1));
    
    // v1.2.0: Self-updating elapsed time for responsive urgency
    const [elapsedMinutes, setElapsedMinutes] = useState(() => 
        Math.floor((Date.now() - order.createdAt.getTime()) / 60000)
    );

    // Calculate elapsed and update urgency
    const calculateElapsed = useCallback(() => {
        return Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
    }, [order.createdAt]);

    // Self-updating timer with AppState awareness
    useEffect(() => {
        setElapsedMinutes(calculateElapsed());

        // Update interval based on urgency (more frequent when critical)
        const getInterval = () => {
            const mins = calculateElapsed();
            if (mins >= 20) return 5000;   // Critical: every 5s
            if (mins >= 10) return 15000;  // Warning: every 15s
            return 30000;                   // Fresh: every 30s
        };

        let intervalId: ReturnType<typeof setInterval>;
        
        const startTimer = () => {
            intervalId = setInterval(() => {
                setElapsedMinutes(calculateElapsed());
            }, getInterval());
        };

        startTimer();

        // Handle app state changes
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // Recalculate immediately when app comes to foreground
                setElapsedMinutes(calculateElapsed());
                clearInterval(intervalId);
                startTimer();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            clearInterval(intervalId);
            subscription.remove();
        };
    }, [calculateElapsed]);

    const urgency = useMemo(() => {
        if (elapsedMinutes < 10) return 'fresh';
        if (elapsedMinutes < 20) return 'warning';
        return 'critical';
    }, [elapsedMinutes]);

    // Blinking Animation for Critical
    useEffect(() => {
        if (urgency === 'critical') {
            const blink = Animated.loop(
                Animated.sequence([
                    Animated.timing(blinkAnim, { toValue: 0.5, duration: 500, useNativeDriver: true }),
                    Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            );
            blink.start();
            return () => blink.stop();
        } else {
            blinkAnim.setValue(1);
        }
    }, [urgency]);

    // 2. Determine Header Colors
    const headerColors = useMemo(() => {
        switch (urgency) {
            case 'fresh': return station === 'bar' ? ['#007aff', '#0055b3'] : ['#34c759', '#248a3d']; // Blue (Bar) / Green (Kitchen)
            case 'warning': return ['#ffcc00', '#e6ac00']; // Yellow/Gold
            case 'critical': return ['#ff3b30', '#c0392b']; // Red
        }
    }, [urgency, station]);

    // 3. Status Text
    const bumpText = order.status === 'pending' ? 'PREPARAR' : 'PRONTO';
    const bumpColors = order.status === 'pending' ? ['#007aff', '#0056b3'] : ['#4cd964', '#32d74b'];

    const elapsedText = elapsedMinutes < 1 ? 'Agora' : `${elapsedMinutes} min`;

    const toggleItem = (name: string) => {
        setCompletedItems(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    return (
        <Animated.View style={[
            styles.ticket,
            urgency === 'critical' && { opacity: blinkAnim, transform: [{ scale: blinkAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0.98, 1] }) }] as any }
        ]}>
            <LinearGradient
                colors={headerColors as any}
                style={styles.ticketHeader}
            >
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={styles.ticketTitle}>Mesa {order.table}</Text>
                        {/* ERRO-002 Fix: Badge de origem do pedido */}
                        {order.origin && (
                            <View style={[
                                styles.originBadge,
                                order.origin === 'WEB_PUBLIC' || order.origin === 'web' ? styles.originBadgeWeb :
                                order.origin === 'CAIXA' || order.origin === 'TPV' ? styles.originBadgeCaixa :
                                styles.originBadgeGarcom
                            ]}>
                                <Text style={styles.originBadgeText}>
                                    {order.origin === 'WEB_PUBLIC' || order.origin === 'web' ? '🌐' :
                                     order.origin === 'CAIXA' || order.origin === 'TPV' ? '💳' :
                                     '👤'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.ticketSubtitle}>#{order.id.slice(-4)}</Text>
                </View>
                <View style={styles.timerBadge}>
                    <Text style={[styles.timerText, urgency === 'critical' && styles.timerTextCritical]}>{elapsedText}</Text>
                </View>
            </LinearGradient>

            <View style={styles.ticketBody}>
                {items.map((line, idx) => {
                    const isDone = completedItems.has(line.name);
                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.itemRow, isDone && styles.itemRowDone]}
                            onPress={() => toggleItem(line.name)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.qty,
                                station === 'bar' ? styles.qtyBar : styles.qtyKitchen,
                                isDone && styles.qtyDone
                            ]}>
                                {line.count}
                            </Text>
                            <Text style={[styles.itemName, isDone && styles.itemNameDone]}>{line.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={styles.bumpButton}
                onPress={() => onBump(order.id, order.status)}
            >
                <LinearGradient
                    colors={bumpColors as any}
                    style={styles.bumpGradient}
                >
                    <Text style={styles.bumpText}>{bumpText}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    ticket: {
        flex: 1,
        backgroundColor: '#2c2c2e', // Dark mode base
        borderRadius: 12,
        margin: 6,
        overflow: 'hidden',
        minWidth: '46%',
        maxWidth: '48%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    ticketHeader: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ticketTitle: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 18,
    },
    ticketSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    timerBadge: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    timerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    timerTextCritical: {
        color: '#fff', // Keep white, the flashing card is enough
    },
    ticketBody: {
        padding: 12,
        minHeight: 120,
        backgroundColor: '#1c1c1e', // Slightly darker body
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    itemRowDone: {
        opacity: 0.4,
    },
    qty: {
        fontWeight: '900',
        fontSize: 18,
        width: 30,
        textAlign: 'center',
        marginRight: 8,
        borderRadius: 4,
        overflow: 'hidden',
        paddingVertical: 2,
    },
    qtyKitchen: {
        color: '#ff9500',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
    },
    qtyBar: {
        color: '#0a84ff',
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
    },
    qtyDone: {
        backgroundColor: '#333',
        color: '#666',
        textDecorationLine: 'line-through',
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
        lineHeight: 22,
    },
    itemNameDone: {
        color: '#666',
        textDecorationLine: 'line-through',
    },
    bumpButton: {
        width: '100%',
    },
    bumpGradient: {
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bumpText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1.5,
    },
    // ERRO-002 Fix: Estilos para badge de origem
    originBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    originBadgeWeb: {
        backgroundColor: 'rgba(10, 132, 255, 0.3)',
        borderColor: '#0a84ff',
    },
    originBadgeCaixa: {
        backgroundColor: 'rgba(255, 214, 10, 0.3)',
        borderColor: '#ffd60a',
    },
    originBadgeGarcom: {
        backgroundColor: 'rgba(50, 215, 75, 0.3)',
        borderColor: '#32d74b',
    },
    originBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});
