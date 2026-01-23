/**
 * WaitlistBoard - SEMANA 4: RESERVAS LITE
 * 
 * Lista de espera digital simples
 * - Adicionar por nome + hora
 * - Conversão reserva → mesa
 * - Sem CRM, SMS ou overengineering
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/services/haptics';
import { BottomActionBar } from './BottomActionBar';
import { PersistenceService } from '@/services/persistence';

interface WaitlistEntry {
    id: string;
    name: string;
    time: string; // HH:mm format
    createdAt: Date;
    status: 'waiting' | 'seated' | 'cancelled';
}

interface WaitlistBoardProps {
    visible: boolean;
    onClose: () => void;
    onAssignTable: (entryId: string, tableId: string) => void;
}

export function WaitlistBoard({ visible, onClose, onAssignTable }: WaitlistBoardProps) {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTime, setNewTime] = useState('');

    // Carregar lista salva ao montar
    useEffect(() => {
        if (visible) {
            loadWaitlist();
        }
    }, [visible]);

    // Salvar lista sempre que mudar
    useEffect(() => {
        saveWaitlist();
    }, [entries]);

    const loadWaitlist = async () => {
        const saved = await PersistenceService.loadWaitlist();
        if (saved && Array.isArray(saved)) {
            // Converter strings de data de volta para Date
            const parsed = saved.map((e: any) => ({
                ...e,
                createdAt: new Date(e.createdAt),
            }));
            setEntries(parsed);
        }
    };

    const saveWaitlist = async () => {
        await PersistenceService.saveWaitlist(entries);
    };

    const handleAdd = () => {
        if (!newName.trim()) {
            Alert.alert('Erro', 'Digite um nome');
            return;
        }

        const entry: WaitlistEntry = {
            id: Date.now().toString(),
            name: newName.trim(),
            time: newTime || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date(),
            status: 'waiting',
        };

        setEntries(prev => [...prev, entry].sort((a, b) => 
            a.time.localeCompare(b.time)
        ));
        setNewName('');
        setNewTime('');
        setShowAddModal(false);
        HapticFeedback.success();
    };

    const handleSeat = (entry: WaitlistEntry) => {
        Alert.alert(
            'Atribuir Mesa',
            `Atribuir ${entry.name} a qual mesa?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                ...Array.from({ length: 12 }, (_, i) => i + 1).map(tableNum => ({
                    text: `Mesa ${tableNum}`,
                    onPress: () => {
                        onAssignTable(entry.id, String(tableNum));
                        setEntries(prev => prev.filter(e => e.id !== entry.id));
                        HapticFeedback.success();
                    }
                }))
            ]
        );
    };

    const handleCancel = (entryId: string) => {
        setEntries(prev => prev.map(e => 
            e.id === entryId ? { ...e, status: 'cancelled' as const } : e
        ));
        HapticFeedback.light();
    };

    const waitingEntries = entries.filter(e => e.status === 'waiting');

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>📋 Lista de Espera</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={waitingEntries}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.entryCard}>
                                <View style={styles.entryInfo}>
                                    <Text style={styles.entryName}>{item.name}</Text>
                                    <Text style={styles.entryTime}>🕐 {item.time}</Text>
                                </View>
                                <View style={styles.entryActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.seatBtn]}
                                        onPress={() => handleSeat(item)}
                                    >
                                        <Ionicons name="restaurant" size={16} color="#fff" />
                                        <Text style={styles.actionBtnText}>Atribuir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.cancelBtn]}
                                        onPress={() => handleCancel(item.id)}
                                    >
                                        <Ionicons name="close-circle" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Lista vazia</Text>
                                <Text style={styles.emptySubtext}>Toque em + para adicionar</Text>
                            </View>
                        }
                        contentContainerStyle={styles.list}
                    />

                    <BottomActionBar
                        primary={{
                            label: '+ Adicionar',
                            onPress: () => setShowAddModal(true)
                        }}
                    />
                </View>
            </View>

            {/* Add Entry Modal */}
            <Modal visible={showAddModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nova Reserva</Text>
                        
                        <Text style={styles.label}>Nome</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nome do cliente"
                            value={newName}
                            onChangeText={setNewName}
                            placeholderTextColor="#666"
                            autoFocus
                        />

                        <Text style={styles.label}>Hora (HH:mm)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 20:00"
                            value={newTime}
                            onChangeText={setNewTime}
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#333' }]}
                                onPress={() => {
                                    setShowAddModal(false);
                                    setNewName('');
                                    setNewTime('');
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#32d74b' }]}
                                onPress={handleAdd}
                            >
                                <Text style={[styles.modalButtonText, { color: '#000' }]}>Adicionar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    entryCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    entryInfo: {
        flex: 1,
    },
    entryName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    entryTime: {
        color: '#888',
        fontSize: 14,
    },
    entryActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seatBtn: {
        backgroundColor: '#32d74b',
    },
    cancelBtn: {
        backgroundColor: '#ff453a',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    emptySubtext: {
        color: '#444',
        fontSize: 12,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#333',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
