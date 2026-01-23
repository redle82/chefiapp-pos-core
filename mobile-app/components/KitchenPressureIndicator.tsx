/**
 * KitchenPressureIndicator - SEMANA 3: Indicador Visual de Pressão
 * 
 * Componente leve para mostrar estado da cozinha
 * Otimizado para performance
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useKitchenPressure } from '@/hooks/useKitchenPressure';

export function KitchenPressureIndicator() {
    const { pressure, preparingCount, shouldHideSlowItems } = useKitchenPressure();

    if (pressure === 'low') return null;

    const config = {
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
    }[pressure];

    return (
        <View style={[styles.container, { backgroundColor: config.bgColor }]}>
            <Text style={styles.text}>
                {config.emoji} Cozinha {config.text} ({preparingCount} pedidos)
                {shouldHideSlowItems && ' • Priorizando Bebidas'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 8,
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
