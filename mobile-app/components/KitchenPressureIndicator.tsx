/**
 * KitchenPressureIndicator - SEMANA 3: Indicador Visual de Pressão
 * 
 * Componente leve para mostrar estado da cozinha
 * Otimizado para performance
 * 
 * v1.2.0: Animação suave para evitar piscadas
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useKitchenPressure } from '@/hooks/useKitchenPressure';

const CONFIGS = {
    low: null,
    medium: {
        emoji: '⚠️',
        text: 'Ocupada',
        bgColor: '#3a3a0a',
    },
    high: {
        emoji: '🔥',
        text: 'Saturada',
        bgColor: '#3a0a0a',
    },
} as const;

export function KitchenPressureIndicator() {
    const { pressure, preparingCount, shouldHideSlowItems, isTransitioning } = useKitchenPressure();
    const fadeAnim = useRef(new Animated.Value(pressure === 'low' ? 0 : 1)).current;
    const heightAnim = useRef(new Animated.Value(pressure === 'low' ? 0 : 40)).current;

    // Animate visibility changes
    useEffect(() => {
        const isVisible = pressure !== 'low';
        
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: isVisible ? 1 : 0,
                duration: 300,
                useNativeDriver: false, // height animation doesn't support native driver
            }),
            Animated.timing(heightAnim, {
                toValue: isVisible ? 40 : 0,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start();
    }, [pressure, fadeAnim, heightAnim]);

    const config = CONFIGS[pressure];

    // Always render but with animated height/opacity
    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    backgroundColor: config?.bgColor || 'transparent',
                    opacity: fadeAnim,
                    height: heightAnim,
                    overflow: 'hidden',
                }
            ]}
        >
            {config && (
                <Text style={styles.text}>
                    {config.emoji} Cozinha {config.text} ({preparingCount} pedidos)
                    {shouldHideSlowItems && ' • Priorizando Bebidas'}
                </Text>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
