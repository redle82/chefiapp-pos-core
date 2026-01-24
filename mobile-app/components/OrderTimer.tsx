import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderTimerProps {
    createdAt: Date | string;
    compact?: boolean;
}

type UrgencyLevel = 'green' | 'yellow' | 'red';

/**
 * Formats elapsed time as "Xm" or "Xh Ym"
 */
function formatElapsed(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Determines urgency level based on elapsed minutes
 */
function getUrgencyLevel(minutes: number): UrgencyLevel {
    if (minutes < 10) return 'green';
    if (minutes < 20) return 'yellow';
    return 'red';
}

const URGENCY_COLORS: Record<UrgencyLevel, string> = {
    green: '#32d74b',
    yellow: '#ffd60a',
    red: '#ff453a',
};

export function OrderTimer({ createdAt, compact = false }: OrderTimerProps) {
    const [elapsed, setElapsed] = useState(0);
    const [pulseAnim] = useState(new Animated.Value(1));
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const appState = useRef(AppState.currentState);

    // Calculate elapsed time
    const calculateElapsed = useCallback(() => {
        const startTime = typeof createdAt === 'string' ? new Date(createdAt).getTime() : createdAt.getTime();
        return Date.now() - startTime;
    }, [createdAt]);

    // Setup timer with AppState awareness
    useEffect(() => {
        // Initial calculation
        setElapsed(calculateElapsed());

        // Determine update interval based on urgency
        const getInterval = () => {
            const minutes = Math.floor(calculateElapsed() / 60000);
            // Update more frequently when urgent
            if (minutes >= 20) return 5000;  // Red: every 5s
            if (minutes >= 10) return 15000; // Yellow: every 15s
            return 30000; // Green: every 30s
        };

        // Start interval
        const startTimer = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setElapsed(calculateElapsed());
            }, getInterval());
        };

        startTimer();

        // AppState listener - recalculate immediately when app comes to foreground
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground - recalculate immediately
                setElapsed(calculateElapsed());
                // Restart timer with appropriate interval
                startTimer();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            subscription.remove();
        };
    }, [createdAt, calculateElapsed]);

    const minutes = Math.floor(elapsed / 60000);
    const urgency = getUrgencyLevel(minutes);
    const color = URGENCY_COLORS[urgency];

    // Pulsing animation for red urgency
    useEffect(() => {
        if (urgency === 'red') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.5, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [urgency]);

    if (compact) {
        return (
            <Animated.View style={[styles.compactContainer, { opacity: pulseAnim }]}>
                <Ionicons name="time-outline" size={12} color={color} />
                <Text style={[styles.compactText, { color }]}>{formatElapsed(elapsed)}</Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.container, { borderColor: color, opacity: pulseAnim }]}>
            <Ionicons name="time" size={16} color={color} />
            <Text style={[styles.text, { color }]}>{formatElapsed(elapsed)}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    compactText: {
        fontSize: 11,
        fontWeight: '500',
    },
});
