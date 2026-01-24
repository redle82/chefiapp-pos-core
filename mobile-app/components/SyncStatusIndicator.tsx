import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function SyncStatusIndicator() {
    const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

    if (isOnline && pendingCount === 0) {
        return null; // Don't show when online and synced
    }

    return (
        <TouchableOpacity onPress={syncNow} style={styles.container}>
            <View style={[styles.dot, isOnline ? styles.online : styles.offline]} />
            <Text style={styles.text}>
                {isSyncing
                    ? 'Sincronizando...'
                    : isOnline
                        ? `${pendingCount} pendentes`
                        : `Offline (${pendingCount} pendentes)`}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'center',
        marginVertical: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    online: {
        backgroundColor: '#32d74b',
    },
    offline: {
        backgroundColor: '#ff9500',
    },
    text: {
        color: '#888',
        fontSize: 12,
    },
});
