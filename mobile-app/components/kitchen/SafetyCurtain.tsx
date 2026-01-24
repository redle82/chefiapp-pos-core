import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafety } from '@/context/SafetyContext';
import { SafetyCard } from '../SafetyCard';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/services/haptics';

export const SafetyCurtain = () => {
    const { pendingChecks, submitLog } = useSafety();
    const hasPending = pendingChecks.length > 0;

    // The Curtain covers everything if there are pending checks
    // Or we can toggle it. For "The Shield" mode (Spec), it sounds like it should be persistent if mandatory.
    // Spec: "Bloqueia a tela de KDS até completar" (Start of shift) or "Manual".

    // For this implementation, we will render it as a absolute fill if there are pending checks.

    if (!hasPending) return null;

    return (
        <View style={styles.curtain}>
            <LinearGradient
                colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,1)']}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <Ionicons name="shield-half" size={64} color="#FF453A" />
                    <Text style={styles.title}>Modo Escudo Ativo</Text>
                    <Text style={styles.subtitle}>{pendingChecks.length} Verificações Pendentes</Text>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                    {pendingChecks.map(control => (
                        <SafetyCard
                            key={control.id}
                            control={control}
                            onLog={(val) => {
                                HapticFeedback.medium();
                                submitLog(control.id, val);
                            }}
                        />
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Complete todas as verificações para liberar o KDS</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    curtain: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999, // On top of everything
        backgroundColor: '#000',
    },
    gradient: {
        flex: 1,
        padding: 20,
        paddingTop: 60
    },
    header: {
        alignItems: 'center',
        marginBottom: 30
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        marginTop: 16,
        letterSpacing: 1
    },
    subtitle: {
        color: '#FF453A',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8
    },
    content: {
        flex: 1
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333'
    },
    footerText: {
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic'
    }
});
