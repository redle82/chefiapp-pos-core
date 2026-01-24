/**
 * OfflineBanner - Banner persistente de modo offline
 * 
 * ERRO-006 Fix: Banner fixo no topo quando offline, contador de itens pendentes
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
    const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

    // Não mostrar se online e sem pendências
    if (isOnline && pendingCount === 0 && !isSyncing) {
        return null;
    }

    // Determinar cor e texto
    const getBannerConfig = () => {
        if (isSyncing) {
            return {
                backgroundColor: '#0a84ff',
                text: 'Sincronizando...',
                icon: 'sync' as const,
                showCount: false
            };
        }
        if (!isOnline) {
            return {
                backgroundColor: '#ff9500',
                text: 'Offline',
                icon: 'cloud-offline-outline' as const,
                showCount: true
            };
        }
        // Online mas com pendências
        return {
            backgroundColor: '#ffd60a',
            text: 'Sincronizando pendências',
            icon: 'cloud-upload-outline' as const,
            showCount: true
        };
    };

    const config = getBannerConfig();

    return (
        <TouchableOpacity
            style={[styles.banner, { backgroundColor: config.backgroundColor }]}
            onPress={syncNow}
            activeOpacity={0.8}
        >
            <Ionicons name={config.icon} size={16} color="#fff" />
            <Text style={styles.bannerText}>
                {config.text}
                {config.showCount && pendingCount > 0 && ` (${pendingCount} ${pendingCount === 1 ? 'item' : 'itens'})`}
            </Text>
            {!isOnline && (
                <Text style={styles.bannerHint}>Toque para tentar sincronizar</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 1000,
        gap: 8,
    },
    bannerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    bannerHint: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        marginLeft: 8,
        fontStyle: 'italic',
    },
});
