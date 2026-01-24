import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStaff } from '@/context/AppStaffContext';
import { Ionicons } from '@expo/vector-icons';
import { CashManagementModal } from './CashManagementModal';
import { useState, useCallback } from 'react';
import { BottomActionBar } from './BottomActionBar';
import { useNotices, Notice } from '@/hooks/useNotices';
import { BottomSheet } from './BottomSheet';
import { ThumbCard } from './ThumbCard';
import { ScrollView, Alert } from 'react-native';

interface ShiftGateProps {
    children: React.ReactNode;
}

export function ShiftGate({ children }: ShiftGateProps) {
    const { shiftState, startShift } = useAppStaff();
    const router = useRouter();

    // Notice Blocker Logic
    const { notices, fetchNotices, markAsRead } = useNotices();
    const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
    const unreadNotices = notices.filter(n => !n.read_by_me);

    if (shiftState === 'active') {
        return <>{children}</>;
    }

    const handleQuickStart = async () => {
        // 1. Check for Unread Notices
        await fetchNotices();

        if (unreadNotices.length > 0) {
            setIsNoticeModalVisible(true);
        } else {
            // Pure Attendance Clock-in
            try {
                await startShift();
            } catch (error) {
                console.error('Error starting shift:', error);
            }
        }
    };

    const handleAcknowledgeAll = async () => {
        // Mark all displayed unread notices as read
        for (const notice of unreadNotices) {
            await markAsRead(notice.id);
        }
        setIsNoticeModalVisible(false);
        // Proceed to start flow
        setTimeout(() => {
            startShift();
        }, 500);
    };

    const handleReadOne = async (id: string) => {
        await markAsRead(id);
    };

    // CHECKLIST REMOVIDO: Funcionário deve poder iniciar turno com 1 toque
    // Avisos podem ser lidos durante turno (não bloqueiam início)
    // Caixa inicial é opcional (não bloqueia)

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.centerContent}>
                    <Ionicons name="lock-closed-outline" size={64} color="#333" />
                    <Text style={styles.title}>Turno Fechado</Text>
                    <Text style={styles.message}>
                        Toque para iniciar seu turno.
                    </Text>
                </View>

                <BottomActionBar
                    primary={{
                        label: "Iniciar Turno",
                        onPress: handleQuickStart
                        // CHECKLIST REMOVIDO: Funcionário pode iniciar com 1 toque
                    }}
                    secondary={{
                        label: "Ir para Gestão",
                        onPress: () => router.navigate('/(tabs)/staff'),
                        variant: 'secondary'
                    }}
                />

                {/* BLOCKER NOTICE MODAL */}
                <BottomSheet
                    visible={isNoticeModalVisible}
                    onClose={() => {
                        setIsNoticeModalVisible(false);
                    }}
                    title={`Avisos Pendentes (${unreadNotices.length})`}
                >
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: '#888', marginBottom: 16, textAlign: 'center' }}>
                            Você deve ler estes avisos antes de iniciar o turno.
                        </Text>

                        <ScrollView style={{ maxHeight: 400 }}>
                            {unreadNotices.map(notice => (
                                <ThumbCard
                                    key={notice.id}
                                    style={{
                                        marginBottom: 12,
                                        borderLeftWidth: 4,
                                        borderLeftColor: notice.severity === 'critical' ? 'red' : notice.severity === 'attention' ? 'gold' : 'blue',
                                        backgroundColor: '#1c1c1e'
                                    }}
                                    onPress={() => handleReadOne(notice.id)}
                                >
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{notice.severity.toUpperCase()}</Text>
                                            <Text style={{ color: '#666' }}>{new Date(notice.created_at).toLocaleDateString()}</Text>
                                        </View>
                                        <Text style={{ color: '#ccc', fontSize: 16, lineHeight: 24 }}>{notice.content}</Text>
                                        <Text style={{ color: '#0a84ff', marginTop: 12, fontSize: 12, textAlign: 'right' }}>
                                            Toque para marcar como lido
                                        </Text>
                                    </View>
                                </ThumbCard>
                            ))}
                        </ScrollView>

                        {unreadNotices.length === 0 ? (
                            <BottomActionBar
                                primary={{ label: "Continuar para o Turno", onPress: handleAcknowledgeAll }}
                            />
                        ) : (
                            <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
                                Leia todos os avisos para continuar.
                            </Text>
                        )}
                    </View>
                </BottomSheet>
            </View>
        </SafeAreaView>
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80, // Space for bottom bar
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 32,
    },
});
