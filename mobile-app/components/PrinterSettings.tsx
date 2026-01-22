/**
 * PrinterSettings - UI para Configurar Impressoras
 * 
 * FASE 6: UI simples de configuração de impressoras físicas
 * Permite configurar IP/porta por tipo (KITCHEN/COUNTER)
 * Inclui teste de impressão básico
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { printerService } from '@/services/PrinterService';
import { HapticFeedback } from '@/services/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface PrinterSettingsProps {
    visible: boolean;
    onClose: () => void;
}

type PrinterType = 'KITCHEN' | 'COUNTER';

export function PrinterSettings({ visible, onClose }: PrinterSettingsProps) {
    const [kitchenIP, setKitchenIP] = useState('192.168.1.200');
    const [counterIP, setCounterIP] = useState('192.168.1.201');
    const [port, setPort] = useState('9100');
    const [testing, setTesting] = useState<PrinterType | null>(null);
    const [saving, setSaving] = useState(false);

    // Carregar configurações salvas
    useEffect(() => {
        if (visible) {
            loadConfig();
        }
    }, [visible]);

    const loadConfig = async () => {
        try {
            const kitchenIPValue = await AsyncStorage.getItem('@chefiapp_kitchen_ip') || '192.168.1.200';
            const counterIPValue = await AsyncStorage.getItem('@chefiapp_counter_ip') || '192.168.1.201';
            const portValue = await AsyncStorage.getItem('@chefiapp_printer_port') || '9100';

            setKitchenIP(kitchenIPValue);
            setCounterIP(counterIPValue);
            setPort(portValue);
        } catch (error) {
            console.error('[PrinterSettings] Error loading config:', error);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await AsyncStorage.setItem('@chefiapp_kitchen_ip', kitchenIP);
            await AsyncStorage.setItem('@chefiapp_counter_ip', counterIP);
            await AsyncStorage.setItem('@chefiapp_printer_port', port);

            HapticFeedback.success();
            Alert.alert('Sucesso', 'Configurações de impressora salvas!');
            onClose();
        } catch (error) {
            console.error('[PrinterSettings] Error saving config:', error);
            HapticFeedback.error();
            Alert.alert('Erro', 'Falha ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const testPrint = async (type: PrinterType) => {
        setTesting(type);
        try {
            HapticFeedback.medium();
            const success = await printerService.printTest(type);

            if (success) {
                HapticFeedback.success();
                Alert.alert(
                    'Sucesso',
                    `Teste de impressão enviado para impressora ${type === 'KITCHEN' ? 'da Cozinha' : 'do Balcão'}.\n\nVerifique se a impressora recebeu o comando.`,
                    [{ text: 'OK' }]
                );
            } else {
                HapticFeedback.error();
                Alert.alert(
                    'Erro',
                    `Não foi possível conectar à impressora ${type === 'KITCHEN' ? 'da Cozinha' : 'do Balcão'}.\n\nVerifique:\n• IP e porta estão corretos\n• Impressora está ligada\n• Dispositivo está na mesma rede`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error: any) {
            console.error('[PrinterSettings] Test print error:', error);
            HapticFeedback.error();
            Alert.alert('Erro', `Falha ao testar impressão: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setTesting(null);
        }
    };

    const validateIP = (ip: string): boolean => {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) return false;
        const parts = ip.split('.').map(Number);
        return parts.every(part => part >= 0 && part <= 255);
    };

    const validatePort = (portStr: string): boolean => {
        const port = parseInt(portStr, 10);
        return !isNaN(port) && port > 0 && port <= 65535;
    };

    const canSave = validateIP(kitchenIP) && validateIP(counterIP) && validatePort(port);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Configurar Impressoras</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {/* Info Banner */}
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={20} color="#0a84ff" />
                        <Text style={styles.infoText}>
                            Configure o IP e porta das impressoras térmicas na sua rede local.
                        </Text>
                    </View>

                    {/* Kitchen Printer */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🖨️ Impressora da Cozinha</Text>
                        <Text style={styles.sectionDescription}>
                            Usada para imprimir pedidos da cozinha
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Endereço IP</Text>
                            <TextInput
                                style={styles.input}
                                value={kitchenIP}
                                onChangeText={setKitchenIP}
                                placeholder="192.168.1.200"
                                keyboardType="numeric"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {kitchenIP && !validateIP(kitchenIP) && (
                                <Text style={styles.errorText}>IP inválido</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.testButton, testing === 'KITCHEN' && styles.testButtonDisabled]}
                            onPress={() => testPrint('KITCHEN')}
                            disabled={testing === 'KITCHEN' || !validateIP(kitchenIP) || !validatePort(port)}
                        >
                            {testing === 'KITCHEN' ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="print" size={18} color="#fff" />
                                    <Text style={styles.testButtonText}>Testar Impressão</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Counter Printer */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💰 Impressora do Balcão</Text>
                        <Text style={styles.sectionDescription}>
                            Usada para imprimir recibos de pagamento
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Endereço IP</Text>
                            <TextInput
                                style={styles.input}
                                value={counterIP}
                                onChangeText={setCounterIP}
                                placeholder="192.168.1.201"
                                keyboardType="numeric"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {counterIP && !validateIP(counterIP) && (
                                <Text style={styles.errorText}>IP inválido</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.testButton, testing === 'COUNTER' && styles.testButtonDisabled]}
                            onPress={() => testPrint('COUNTER')}
                            disabled={testing === 'COUNTER' || !validateIP(counterIP) || !validatePort(port)}
                        >
                            {testing === 'COUNTER' ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="print" size={18} color="#fff" />
                                    <Text style={styles.testButtonText}>Testar Impressão</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Port (Shared) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🔌 Porta</Text>
                        <Text style={styles.sectionDescription}>
                            Porta TCP padrão (geralmente 9100)
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Porta TCP</Text>
                            <TextInput
                                style={styles.input}
                                value={port}
                                onChangeText={setPort}
                                placeholder="9100"
                                keyboardType="numeric"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {port && !validatePort(port) && (
                                <Text style={styles.errorText}>Porta inválida (1-65535)</Text>
                            )}
                        </View>
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionsSection}>
                        <Text style={styles.instructionsTitle}>📋 Instruções</Text>
                        <Text style={styles.instructionsText}>
                            1. Certifique-se de que as impressoras estão ligadas e na mesma rede Wi-Fi{'\n'}
                            2. Encontre o IP de cada impressora nas configurações do dispositivo{'\n'}
                            3. Digite o IP e porta acima{'\n'}
                            4. Use "Testar Impressão" para verificar a conexão{'\n'}
                            5. Salve as configurações quando tudo estiver funcionando
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
                        onPress={saveConfig}
                        disabled={!canSave || saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Salvar Configurações</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#1c1c1e',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#0a84ff20',
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#0a84ff',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ccc',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2c2c2e',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#fff',
    },
    errorText: {
        fontSize: 12,
        color: '#ff3b30',
        marginTop: 4,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5856d6',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    testButtonDisabled: {
        opacity: 0.5,
    },
    testButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    instructionsSection: {
        marginTop: 8,
        padding: 16,
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        backgroundColor: '#1c1c1e',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    saveButton: {
        backgroundColor: '#32d74b',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
