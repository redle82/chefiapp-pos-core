import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useDirectCommand, DirectCommand } from '@/hooks/useDirectCommand';
import { HapticFeedback } from '@/services/haptics';
import { Ionicons } from '@expo/vector-icons';

export function CommandInterceptor() {
    const { incomingCommands, respondToCommand } = useDirectCommand();
    const [currentCommand, setCurrentCommand] = useState<DirectCommand | null>(null);

    useEffect(() => {
        // If we have incoming commands, lock onto the first one
        if (incomingCommands.length > 0 && !currentCommand) {
            setCurrentCommand(incomingCommands[0]);
            HapticFeedback.error(); // Vibrate on receive (Heavy/Error pattern for urgency)
        }
    }, [incomingCommands, currentCommand]);

    const handleResponse = async (type: 'OK' | 'UNDERSTOOD' | 'HELP') => {
        if (!currentCommand) return;
        HapticFeedback.success();
        await respondToCommand(currentCommand.id, type);
        setCurrentCommand(null); // Clear current, effect will pick up next one if exists
    };

    if (!currentCommand) return null;

    return (
        <Modal
            visible={true}
            transparent={true}
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Ionicons name="alert-circle" size={48} color="#ff453a" />
                        <Text style={styles.title}>COMANDO DIRETO</Text>
                        <Text style={styles.subtitle}>Prioridade Máxima</Text>
                    </View>

                    <Text style={styles.message}>
                        "{currentCommand.content}"
                    </Text>
                    <Text style={styles.sender}>
                        Do Gerente
                    </Text>

                    <View style={styles.responseContainer}>
                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: '#32d74b' }]}
                            onPress={() => handleResponse('OK')}
                        >
                            <Text style={styles.btnText}>✅ OK</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: '#0a84ff' }]}
                            onPress={() => handleResponse('UNDERSTOOD')}
                        >
                            <Text style={styles.btnText}>🫡 ENTENDIDO</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: '#ff9f0a' }]}
                            onPress={() => handleResponse('HELP')}
                        >
                            <Text style={styles.btnText}>🆘 PRECISO DE AJUDA</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    card: {
        width: '100%',
        backgroundColor: '#1c1c1e',
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: '#ff453a',
        alignItems: 'center'
    },
    header: {
        alignItems: 'center',
        marginBottom: 24
    },
    title: {
        color: '#ff453a',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 8,
        letterSpacing: 1
    },
    subtitle: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    message: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12
    },
    sender: {
        color: '#888',
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 40
    },
    responseContainer: {
        width: '100%',
        gap: 12
    },
    btn: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
