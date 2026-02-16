import { KDSTicket } from '@/components/KDSTicket';
import { ShiftGate } from '@/components/ShiftGate';
import { useAppStaff } from '@/context/AppStaffContext';
import { Order, OrderItem, useOrder } from '@/context/OrderContext';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { HapticFeedback } from '@/services/haptics';
import { useAudioPlayer } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function BarScreen() {
    // Bug #3 Fix: Route guard
    useRouteGuard({ allowedRoles: ['bartender', 'chef', 'manager', 'owner', 'admin'] });

    const { orders, updateOrderStatus } = useOrder();
    const { shiftId, stations, getStationForCategory } = useAppStaff();
    const [now, setNow] = useState(new Date());
    const prevOrderCount = useRef(0);
    const barBeepPlayer = useAudioPlayer('https://www.soundjay.com/buttons/beep-01a.mp3');
    // Identify Bar Station
    const barStation = stations.find(s => s.name === 'Bar');

    // Update timer every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const activeOrders = orders.filter(o =>
        (o.status === 'pending' || o.status === 'preparing') &&
        (o.shiftId === shiftId)
    );

    // Filter Items Logic (Bar)
    const hasBarItems = (order: Order) => {
        if (!barStation) return false;
        return order.items.some(i => {
            const s = getStationForCategory(i.category);
            // Smart check: matches ID OR fallback to legacy 'drink' if unmapped
            return s?.id === barStation.id || (!s && i.category === 'drink');
        });
    };

    // Filter orders that actually have drinks (optimization)
    const activeBarOrders = activeOrders.filter(hasBarItems);

    // Sound Logic (expo-audio; expo-av deprecated in SDK 54)
    useEffect(() => {
        if (activeBarOrders.length > prevOrderCount.current) {
            try {
                barBeepPlayer.seekTo(0);
                barBeepPlayer.play();
            } catch (e) {
                if (__DEV__) console.log('Bar beep play error', e);
            }
        }
        prevOrderCount.current = activeBarOrders.length;
    }, [activeBarOrders.length, barBeepPlayer]);

    // SIMPLIFICADO: 1 toque muda status
    const handleBump = (orderId: string) => {
        HapticFeedback.success();
        updateOrderStatus(orderId, 'ready');
        // Confirmação visual será mostrada pelo KDSTicket (check verde)
    };

    const groupItems = (items: OrderItem[]) => {
        const grouped: Record<string, { count: number, name: string }> = {};
        items.forEach(i => {
            // Smart Filter
            if (barStation) {
                const s = getStationForCategory(i.category);
                const isMatch = s?.id === barStation.id || (!s && i.category === 'drink');
                if (!isMatch) return;
            } else {
                if (i.category !== 'drink') return;
            }

            const key = i.name;
            if (!grouped[key]) grouped[key] = { count: 0, name: i.name };
            grouped[key].count++;
        });
        return Object.values(grouped);
    };

    const renderTicket = ({ item }: { item: Order }) => {
        const barItems = groupItems(item.items);
        if (barItems.length === 0) return null;

        return (
            <KDSTicket
                order={item}
                now={now}
                items={barItems}
                onBump={(id) => handleBump(id)}
                station="bar"
            />
        );
    };

    return (
        <ShiftGate>
            <View style={styles.container}>
                <Text style={styles.screenTitle}>🍸 Bar - KDS</Text>
                <FlatList
                    data={activeBarOrders}
                    renderItem={renderTicket}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    numColumns={2}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🥂</Text>
                            <Text style={styles.emptyText}>Bar Livre!</Text>
                        </View>
                    }
                />
            </View>
        </ShiftGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000030',
        padding: 8,
    },
    screenTitle: {
        color: '#5ac8fa',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 16,
        marginTop: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContainer: {
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        opacity: 0.5,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 10,
    },
    emptyText: {
        color: '#5ac8fa',
        fontSize: 18,
        fontWeight: 'bold',
    },
    ticket: {
        flex: 1,
        backgroundColor: '#f0f8ff',
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
    ticketBody: {
        padding: 12,
        minHeight: 100,
        backgroundColor: '#e6f2ff',
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    qty: {
        fontWeight: '900',
        fontSize: 18,
        color: '#007aff',
        width: 30,
        textAlign: 'center',
        marginRight: 8,
        backgroundColor: 'rgba(0,122,255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        paddingVertical: 2,
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        color: '#003366',
        fontWeight: '500',
        lineHeight: 22,
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
});
