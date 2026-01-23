import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafety } from '@/context/SafetyContext';
import { SafetyCard } from './SafetyCard';
import { Ionicons } from '@expo/vector-icons';

export const SafetyMonitor = () => {
    const { pendingChecks, submitLog } = useSafety();

    if (pendingChecks.length === 0) {
        return (
            <View style={styles.safeState}>
                <Ionicons name="shield-checkmark" size={48} color="#32d74b" />
                <Text style={styles.safeText}>Controles Operacionais em Dia</Text>
                <Text style={styles.safeSubtext}>Sua cozinha está protegida.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🛡️ Controles Críticos ({pendingChecks.length})</Text>
            </View>
            {pendingChecks.map(control => (
                <SafetyCard
                    key={control.id}
                    control={control}
                    onLog={(val) => submitLog(control.id, val)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    safeState: {
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(50, 215, 75, 0.2)',
    },
    safeText: {
        color: '#32d74b',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
    },
    safeSubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 4,
    },
});
