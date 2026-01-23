import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStaff } from '../context/AppStaffContext';
import { supabase } from '../services/supabase';
import { printerService } from '../services/PrinterService';
import { HapticFeedback } from '../services/haptics';

interface CashManagementModalProps {
    visible: boolean;
    onClose: () => void;
}

type Mode = 'menu' | 'open_shift' | 'close_shift' | 'add_cash' | 'remove_cash';

export const CashManagementModal: React.FC<CashManagementModalProps> = ({ visible, onClose }) => {
    const { currentShift, startShift, endShift } = useAppStaff();
    const [mode, setMode] = useState<Mode>('menu');
    const [loading, setLoading] = useState(false);

    // Inputs
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    
    // ERRO-010 Fix: Checklist de fechamento (inicializado aqui para reset quando modal fecha)
    const [closeChecklist, setCloseChecklist] = useState([
        { id: 'actions', label: 'Verificar ações pendentes', checked: false },
        { id: 'cash', label: 'Contar dinheiro físico', checked: false },
        { id: 'confirm', label: 'Confirmar fechamento', checked: false },
    ]);

    // Calculations
    const [cashMovements, setCashMovements] = useState<{ type: string, amount: number, reason: string }[]>([]);
    const [expectedCash, setExpectedCash] = useState(0);

    useEffect(() => {
        if (visible) {
            if (!currentShift) {
                setMode('open_shift');
            } else {
                setMode('menu');
                fetchCashMovements();
            }
            setAmount('');
            setReason('');
            // ERRO-010 Fix: Reset checklist quando modal abre
            setCloseChecklist([
                { id: 'actions', label: 'Verificar ações pendentes', checked: false },
                { id: 'cash', label: 'Contar dinheiro físico', checked: false },
                { id: 'confirm', label: 'Confirmar fechamento', checked: false },
            ]);
        }
    }, [visible, currentShift]);

    const fetchCashMovements = async () => {
        if (!currentShift) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('gm_cash_movements')
            .select('*')
            .eq('shift_id', currentShift.id);

        if (data) {
            setCashMovements(data);
            calculateExpectedResult(data);
        }
        setLoading(false);
    };

    const calculateExpectedResult = (movements: any[]) => {
        // Start with Opening Float (stored in cash_start in Context currently, need to ensure we use opening_float)
        // For MVP, assume cash_start IS the float.
        let total = currentShift?.cash_start || 0;

        // Add Cash Sales (We need calculations from orders, but for "Cash Control" strictly...
        // Ideally we fetch total CASH payments.
        // For now let's just do Float + Movements logic. 
        // Real implementation requires summing orders where method='cash'. 
        // We will assume 0 cash sales for this specific calculation if we can't fetch it easily here, 
        // OR better yet, fetch it.

        movements.forEach(m => {
            if (m.type === 'supply') total += m.amount;
            if (m.type === 'bleed') total -= m.amount;
        });

        // Add sales logic later. For V1 we verify Movements only.
        setExpectedCash(total);
    };

    const handleOpenShift = async () => {
        const floatAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(floatAmount)) {
            Alert.alert('Erro', 'Valor inválido');
            return;
        }

        setLoading(true);
        // Start shift with float
        await startShift(Math.round(floatAmount * 100));
        setLoading(false);
        onClose();
        Alert.alert('Turno Aberto', `Fundo de caixa definido: €${floatAmount.toFixed(2)}`);
    };

    const handleMovement = async (type: 'supply' | 'bleed') => {
        if (!currentShift) return;
        const moveAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(moveAmount) || moveAmount <= 0) {
            Alert.alert('Erro', 'Valor inválido');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Erro', 'Motivo é obrigatório');
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('gm_cash_movements').insert({
            shift_id: currentShift.id,
            type,
            amount: Math.round(moveAmount * 100),
            reason
        });

        if (error) {
            Alert.alert('Erro', 'Falha ao registrar movimento');
        } else {
            Alert.alert('Sucesso', 'Movimento registrado');
            onClose();
        }
        setLoading(false);
    };

    const handleCloseShift = async () => {
        if (!currentShift) return;
        const actualCash = parseFloat(amount.replace(',', '.'));
        if (isNaN(actualCash)) {
            Alert.alert('Erro', 'Valor inválido');
            return;
        }

        setLoading(true);
        // Calculate difference logic (optional here, mostly for reporting)
        // Call endShift with closing cash
        // Note: endShift needs updating in Context to accept this arg.
        await endShift(Math.round(actualCash * 100));
        setLoading(false);
        onClose();
        Alert.alert('Turno Fechado', `Caixa final: €${actualCash.toFixed(2)}`);
    };

    const renderOpenShift = () => (
        <View>
            <Text style={styles.title}>Abertura de Caixa</Text>
            <Text style={styles.subtitle}>Informe o Fundo de Caixa (Float) inicial.</Text>

            <Text style={styles.label}>Valor (€)</Text>
            <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
                autoFocus
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenShift}>
                <Text style={styles.btnText}>Abrir Turno</Text>
            </TouchableOpacity>
        </View>
    );

    const renderMenu = () => (
        <View>
            <Text style={styles.title}>Gestão de Caixa</Text>
            <Text style={styles.subtitle}>Turno Iniciado em: {currentShift?.started_at ? new Date(currentShift.started_at).toLocaleTimeString() : '--:--'}</Text>

            <View style={styles.statBox}>
                <Text style={styles.statLabel}>Fundo Inicial</Text>
                <Text style={styles.statValue}>€{((currentShift?.cash_start || 0) / 100).toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.menuBtn} onPress={() => setMode('add_cash')}>
                <Text style={styles.menuBtnIcon}>📥</Text>
                <View>
                    <Text style={styles.menuBtnTitle}>Suprimento (Entrada)</Text>
                    <Text style={styles.menuBtnDesc}>Adicionar troco ou aporte</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuBtn} onPress={() => setMode('remove_cash')}>
                <Text style={styles.menuBtnIcon}>📤</Text>
                <View>
                    <Text style={styles.menuBtnTitle}>Sangria (Saída)</Text>
                    <Text style={styles.menuBtnDesc}>Pagamento de fornecedor, retirada</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuBtn, { borderColor: '#ff453a' }]} onPress={() => setMode('close_shift')}>
                <Text style={styles.menuBtnIcon}>🔒</Text>
                <View>
                    <Text style={[styles.menuBtnTitle, { color: '#ff453a' }]}>Fechar Caixa</Text>
                    <Text style={styles.menuBtnDesc}>Conferência e encerramento</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderMovement = (type: 'supply' | 'bleed') => (
        <View>
            <Text style={styles.title}>{type === 'supply' ? 'Suprimento de Caixa' : 'Sangria de Caixa'}</Text>

            <Text style={styles.label}>Valor (€)</Text>
            <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
                autoFocus
            />

            <Text style={styles.label}>Motivo / Descrição</Text>
            <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder={type === 'supply' ? "Ex: Troco inicial extra" : "Ex: Compra de gelo"}
                placeholderTextColor="#666"
            />

            <TouchableOpacity
                style={[styles.primaryBtn, type === 'bleed' && { backgroundColor: '#ff453a' }]}
                onPress={() => handleMovement(type)}
            >
                <Text style={styles.btnText}>Confirmar {type === 'supply' ? 'Entrada' : 'Saída'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('menu')}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );

    // ERRO-010 Fix: Função para atualizar checklist
    const updateCloseChecklist = (id: string) => {
        setCloseChecklist(prev => prev.map(item => 
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const allCloseChecked = closeChecklist.every(item => item.checked);

    const renderCloseShift = () => (
        <View>
            <Text style={styles.title}>Fechamento de Caixa</Text>
            <Text style={styles.subtitle}>Conte o dinheiro físico na gaveta.</Text>

            {/* ERRO-010 Fix: Checklist visual de fechamento */}
            <View style={styles.checklistContainer}>
                <Text style={styles.checklistTitle}>Checklist de Fechamento</Text>
                {closeChecklist.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.checklistItem}
                        onPress={() => updateCloseChecklist(item.id)}
                    >
                        <Ionicons
                            name={item.checked ? "checkbox" : "checkbox-outline"}
                            size={24}
                            color={item.checked ? "#32d74b" : "#666"}
                        />
                        <Text style={[
                            styles.checklistLabel,
                            item.checked && styles.checklistLabelChecked
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Valor em Caixa (€)</Text>
            <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
                autoFocus
            />

            <TouchableOpacity 
                style={[
                    styles.primaryBtn, 
                    { backgroundColor: '#ff453a' },
                    !allCloseChecked && { opacity: 0.5 }
                ]} 
                onPress={handleCloseShift}
                disabled={!allCloseChecked}
            >
                <Text style={styles.btnText}>Encerrar Turno</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('menu')}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#32d74b" />
                    ) : (
                        <>
                            {mode === 'open_shift' && renderOpenShift()}
                            {mode === 'menu' && renderMenu()}
                            {mode === 'add_cash' && renderMovement('supply')}
                            {mode === 'remove_cash' && renderMovement('bleed')}
                            {mode === 'close_shift' && renderCloseShift()}
                        </>
                    )}

                    {!loading && mode === 'open_shift' && (
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    )}

                    {!loading && mode === 'menu' && (
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>Fechar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20
    },
    content: {
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 24,
        textAlign: 'center'
    },
    label: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10
    },
    input: {
        backgroundColor: '#2c2c2e',
        borderRadius: 8,
        padding: 14,
        fontSize: 18,
        color: '#fff',
        marginBottom: 10
    },
    primaryBtn: {
        backgroundColor: '#32d74b',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20
    },
    btnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16
    },
    secondaryBtn: {
        marginTop: 12,
        alignItems: 'center',
        padding: 10
    },
    secondaryBtnText: {
        color: '#0a84ff',
        fontSize: 16
    },
    closeBtn: {
        marginTop: 20,
        alignItems: 'center'
    },
    closeBtnText: {
        color: '#666',
        fontSize: 14
    },
    // ERRO-010 Fix: Estilos para checklist
    checklistContainer: {
        marginTop: 20,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#2c2c2e',
        borderRadius: 8,
    },
    checklistTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    checklistLabel: {
        color: '#888',
        fontSize: 14,
        flex: 1,
    },
    checklistLabelChecked: {
        color: '#32d74b',
        textDecorationLine: 'line-through',
    },
    menuBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2c2c2e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3a3a3c'
    },
    menuBtnIcon: {
        fontSize: 24,
        marginRight: 16
    },
    menuBtnTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2
    },
    menuBtnDesc: {
        color: '#888',
        fontSize: 12
    },
    statBox: {
        backgroundColor: '#2c2c2e',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center'
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        textTransform: 'uppercase'
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    }
});
