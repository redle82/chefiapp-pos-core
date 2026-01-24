import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Order } from '@/context/OrderContext';

interface KitchenOrderCardProps {
    order: Order;
    now: Date;
    items: { count: number, name: string }[];
    onBump: () => void;
    onLongPress: () => void;
}

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({ order, now, items, onBump, onLongPress }) => {
    // ERRO-015 Fix: Estado para feedback visual no primeiro toque
    const [isFirstTap, setIsFirstTap] = useState(false);
    const borderAnim = useRef(new Animated.Value(1)).current;

    // ERRO-015 Fix: Animação de borda piscando no primeiro toque
    useEffect(() => {
        if (isFirstTap) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(borderAnim, { toValue: 0.5, duration: 300, useNativeDriver: false }),
                    Animated.timing(borderAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
                ]),
                { iterations: 3 } // Pisca 3 vezes
            );
            pulse.start();
            // Reset após animação
            setTimeout(() => {
                setIsFirstTap(false);
                borderAnim.setValue(1);
            }, 1800);
        }
    }, [isFirstTap]);

    // 1. Calculate Urgency State
    const elapsedMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / 60000);
    const urgency = useMemo(() => {
        if (elapsedMinutes < 10) return 'normal';
        if (elapsedMinutes < 20) return 'warning';
        return 'critical';
    }, [elapsedMinutes]);

    // 2. Colors by State
    const stylesByState = {
        normal: {
            bg: '#1c1c1e',
            border: '#333',
            timeColor: '#888'
        },
        warning: {
            bg: '#252010', // Dark Yellow tint
            border: '#FFCC00',
            timeColor: '#FFCC00'
        },
        critical: {
            bg: '#2a1010', // Dark Red tint
            border: '#FF3B30',
            timeColor: '#FF3B30'
        }
    };

    const theme = stylesByState[urgency];

    // 3. Time Display
    const timeDisplay = elapsedMinutes < 1 ? 'AGORA' : `${elapsedMinutes}m`;

    // ERRO-015 Fix: Handler para primeiro toque (feedback visual)
    const handlePress = () => {
        // Primeiro toque: mostrar feedback visual
        if (!isFirstTap) {
            setIsFirstTap(true);
        }
        // Chamar onBump (que já tem lógica de toque duplo)
        onBump();
    };

    // ERRO-015 Fix: Cor da borda animada no primeiro toque
    const animatedBorderColor = borderAnim.interpolate({
        inputRange: [0.5, 1],
        outputRange: ['#0a84ff', theme.border] // Azul quando piscando, cor normal quando não
    });

    return (
        <Animated.View style={[styles.card, { 
            backgroundColor: theme.bg, 
            borderColor: isFirstTap ? animatedBorderColor : theme.border, 
            borderWidth: urgency !== 'normal' ? 2 : 1 
        }]}>
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            onLongPress={onLongPress}
            style={{ flex: 1 }}
        >
            {/* Header: Time & Table */}
            <View style={styles.header}>
                <View style={styles.tableBlock}>
                    <Text style={styles.tableNum}>Mesa {order.table}</Text>
                    <Text style={styles.orderId}>#{order.id.slice(-4)}</Text>
                </View>

                <View style={[styles.timerBadge, urgency !== 'normal' && { backgroundColor: theme.timeColor }]}>
                    <Text style={[styles.timerText, urgency !== 'normal' && { color: '#000' }]}>
                        {timeDisplay}
                    </Text>
                </View>
            </View>
            {/* ERRO-014 Fix: Badge de urgência (fora do header para posicionamento absoluto) */}
            {urgency === 'critical' && (
                <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>URGENTE</Text>
                </View>
            )}

            {/* divider */}
            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8, opacity: 0.5 }} />

            {/* Body: Items */}
            <View style={styles.body}>
                {items.map((line, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <View style={styles.qtyBox}>
                            <Text style={styles.qtyText}>{line.count}</Text>
                        </View>
                        <Text style={styles.itemName} numberOfLines={2}>
                            {line.name}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Footer: Action Hint */}
            <View style={styles.footer}>
                <Text style={styles.actionHint}>
                    {/* ERRO-015 Fix: Indicar toque duplo */}
                    {isFirstTap ? 'TOQUE NOVAMENTE PARA CONFIRMAR' : 
                     order.status === 'pending' ? 'TOQUE DUPLO PARA PREPARAR' : 
                     'TOQUE DUPLO PARA CONCLUIR'}
                </Text>
            </View>
        </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 12,
        padding: 12,
        position: 'relative', // ERRO-014 Fix: Para posicionamento absoluto do badge
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tableBlock: {
        flexDirection: 'column'
    },
    tableNum: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    orderId: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600'
    },
    timerBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    timerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    body: {
        marginVertical: 4
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    qtyBox: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: 32,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    qtyText: {
        color: '#ff9500',
        fontSize: 18,
        fontWeight: '900'
    },
    itemName: {
        color: '#e0e0e0',
        fontSize: 18, // Large text for distance reading
        fontWeight: '600',
        flex: 1
    },
    footer: {
        marginTop: 8,
        alignItems: 'center'
    },
    actionHint: {
        color: '#555',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    // ERRO-014 Fix: Badge de urgência
    urgentBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fff',
    },
    urgentBadgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
});
