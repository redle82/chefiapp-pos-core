import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStaff } from '@/context/AppStaffContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ShiftGateProps {
    children: React.ReactNode;
}

export function ShiftGate({ children }: ShiftGateProps) {
    const { shiftState, startShift, roleConfig } = useAppStaff();
    const router = useRouter();

    if (shiftState === 'active') {
        return <>{children}</>;
    }

    const handleGoToShift = () => {
        // Navigate to the 'staff' tab which is the Shift hub
        router.push('/(tabs)/staff');
    };

    const handleQuickStart = () => {
        startShift();
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <FontAwesome name="lock" size={48} color="#666" />
                </View>

                <Text style={styles.title}>Turno Fechado</Text>

                <Text style={styles.message}>
                    Para acessar {roleConfig.taskCategories.length > 0 ? 'suas ferramentas' : 'esta área'},
                    você precisa iniciar seu turno.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleQuickStart}
                >
                    <Text style={styles.primaryButtonText}>Iniciar Turno Agora</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleGoToShift}
                >
                    <Text style={styles.secondaryButtonText}>Ir para Gestão de Turno</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    primaryButton: {
        backgroundColor: '#d4a574',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#888',
        fontSize: 14,
    },
});
