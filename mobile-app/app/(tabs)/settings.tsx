import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SettingsSection } from '@/components/SettingsSection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { HapticFeedback } from '@/services/haptics';
import { printerService } from '@/services/PrinterService';
import { useRestaurant } from '@/context/RestaurantContext';
import { PrinterSettings } from '@/components/PrinterSettings';

export default function SettingsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const { activeRestaurant, availableRestaurants, setActiveRestaurant, loading: restaurantsLoading } = useRestaurant();

    // Printer Config
    const [kitchenPrinterIp, setKitchenPrinterIp] = useState('192.168.1.200');
    const [counterPrinterIp, setCounterPrinterIp] = useState('192.168.1.201');
    const [printerPort, setPrinterPort] = useState('9100');

    // Business Profile
    const [restaurantName, setRestaurantName] = useState('Sofia Gastrobar');
    const [restaurantAddress, setRestaurantAddress] = useState('Rua das Flores, 123');
    const [restaurantPhone, setRestaurantPhone] = useState('(11) 99999-9999');

    // Preferences
    const [serviceCharge, setServiceCharge] = useState('10');
    const [taxRate, setTaxRate] = useState('0');
    const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
    const [showPrinterSettings, setShowPrinterSettings] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const keys = [
                '@chefiapp_kitchen_ip', '@chefiapp_counter_ip', '@chefiapp_printer_port',
                '@chefiapp_name', '@chefiapp_address', '@chefiapp_phone',
                '@chefiapp_service_charge', '@chefiapp_tax_rate', '@chefiapp_auto_print'
            ];
            const result = await AsyncStorage.multiGet(keys);

            const getVal = (key: string, defaultVal: string) => {
                const pair = result.find(r => r[0] === key);
                return pair && pair[1] ? pair[1] : defaultVal;
            };

            setKitchenPrinterIp(getVal('@chefiapp_kitchen_ip', '192.168.1.200'));
            setCounterPrinterIp(getVal('@chefiapp_counter_ip', '192.168.1.201'));
            setPrinterPort(getVal('@chefiapp_printer_port', '9100'));

            setRestaurantName(getVal('@chefiapp_name', 'Sofia Gastrobar'));
            setRestaurantAddress(getVal('@chefiapp_address', 'Rua das Flores, 123'));
            setRestaurantPhone(getVal('@chefiapp_phone', '(11) 99999-9999'));

            setServiceCharge(getVal('@chefiapp_service_charge', '10'));
            setTaxRate(getVal('@chefiapp_tax_rate', '0'));
            setAutoPrintReceipt(getVal('@chefiapp_auto_print', 'true') === 'true');

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        HapticFeedback.success();
        try {
            const pairs: [string, string][] = [
                ['@chefiapp_kitchen_ip', kitchenPrinterIp],
                ['@chefiapp_counter_ip', counterPrinterIp],
                ['@chefiapp_printer_port', printerPort],
                ['@chefiapp_name', restaurantName],
                ['@chefiapp_address', restaurantAddress],
                ['@chefiapp_phone', restaurantPhone],
                ['@chefiapp_service_charge', serviceCharge],
                ['@chefiapp_tax_rate', taxRate],
                ['@chefiapp_auto_print', String(autoPrintReceipt)]
            ];
            await AsyncStorage.multiSet(pairs);
            Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar configurações.');
        }
    };

    const testPrint = async (type: 'Kitchen' | 'Counter') => {
        // Save first to ensure service has latest
        await saveSettings();

        const ip = type === 'Kitchen' ? kitchenPrinterIp : counterPrinterIp;
        HapticFeedback.light();

        try {
            const success = await printerService.printTest(type.toUpperCase() as any);
            if (success) {
                Alert.alert("Sucesso", "Teste enviado para a impressora.");
                HapticFeedback.success();
            } else {
                Alert.alert("Erro", `Falha ao conectar em ${ip}:${printerPort}`);
                HapticFeedback.error();
            }
        } catch (e) {
            Alert.alert("Erro de Exceção", String(e));
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.headerButtonFunc}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurações</Text>
                <TouchableOpacity onPress={saveSettings} style={styles.saveBtn}>
                    <Text style={styles.headerButtonFunc}>Salvar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>

                {/* Seletor de Restaurante (Multi-Tenant) */}
                {availableRestaurants.length > 1 && (
                    <>
                        <SettingsSection title="Restaurante Ativo">
                            <View style={styles.row}>
                                <Text style={styles.label}>Restaurante</Text>
                                <View style={styles.restaurantSelector}>
                                    {availableRestaurants.map((restaurant) => (
                                        <TouchableOpacity
                                            key={restaurant.id}
                                            style={[
                                                styles.restaurantOption,
                                                activeRestaurant?.id === restaurant.id && styles.restaurantOptionActive
                                            ]}
                                            onPress={() => setActiveRestaurant(restaurant)}
                                        >
                                            <Text style={[
                                                styles.restaurantOptionText,
                                                activeRestaurant?.id === restaurant.id && styles.restaurantOptionTextActive
                                            ]}>
                                                {restaurant.name}
                                            </Text>
                                            {activeRestaurant?.id === restaurant.id && (
                                                <Text style={styles.restaurantRole}>• {restaurant.role}</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </SettingsSection>
                        <View style={{ height: 20 }} />
                    </>
                )}

                <SettingsSection title="Impressoras & Dispositivos">
                    {/* FASE 6: Botão para abrir UI dedicada de configuração de impressoras */}
                    <TouchableOpacity
                        style={styles.printerSettingsButton}
                        onPress={() => setShowPrinterSettings(true)}
                    >
                        <Text style={styles.printerSettingsButtonText}>⚙️ Configurar Impressoras</Text>
                        <Text style={styles.printerSettingsButtonSubtext}>
                            IP: {kitchenPrinterIp} / {counterPrinterIp} • Porta: {printerPort}
                        </Text>
                    </TouchableOpacity>
                </SettingsSection>

                <SettingsSection title="Perfil do Estabelecimento">
                    <View style={styles.row}>
                        <Text style={styles.label}>Nome</Text>
                        <TextInput
                            style={styles.input}
                            value={restaurantName}
                            onChangeText={setRestaurantName}
                            placeholderTextColor="#666"
                        />
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Endereço</Text>
                        <TextInput
                            style={styles.input}
                            value={restaurantAddress}
                            onChangeText={setRestaurantAddress}
                            placeholderTextColor="#666"
                        />
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Telefone</Text>
                        <TextInput
                            style={styles.input}
                            value={restaurantPhone}
                            onChangeText={setRestaurantPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#666"
                        />
                    </View>
                </SettingsSection>

                <SettingsSection title="Preferências do Sistema">
                    <View style={styles.row}>
                        <Text style={styles.label}>Taxa de Serviço (%)</Text>
                        <TextInput
                            style={styles.input}
                            value={serviceCharge}
                            onChangeText={setServiceCharge}
                            keyboardType="numeric"
                            placeholder="10"
                            placeholderTextColor="#666"
                        />
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Impostos (%)</Text>
                        <TextInput
                            style={styles.input}
                            value={taxRate}
                            onChangeText={setTaxRate}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#666"
                        />
                    </View>
                    <View style={styles.separator} />
                    <View style={[styles.row, { justifyContent: 'space-between' }]}>
                        <Text style={styles.label}>Imprimir Recibo Auto</Text>
                        <Switch
                            value={autoPrintReceipt}
                            onValueChange={setAutoPrintReceipt}
                            trackColor={{ false: "#3e3e3e", true: "#32d74b" }}
                        />
                    </View>
                </SettingsSection>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FASE 6: Modal de configuração de impressoras */}
            <PrinterSettings
                visible={showPrinterSettings}
                onClose={() => {
                    setShowPrinterSettings(false);
                    loadSettings(); // Recarregar configurações após fechar
                }}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#1c1c1e',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerButtonFunc: {
        color: '#0a84ff',
        fontSize: 16,
    },
    backBtn: {
        padding: 8,
    },
    saveBtn: {
        padding: 8,
    },
    content: {
        padding: 16,
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        minHeight: 50,
    },
    label: {
        color: '#fff',
        fontSize: 16,
        width: 140,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        textAlign: 'right',
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        marginLeft: 16,
    },
    actionRow: {
        flexDirection: 'row',
        padding: 16,
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    testBtn: {
        backgroundColor: '#333',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    testBtnText: {
        color: '#0a84ff', // iOS Blue
        fontWeight: '600',
    },
    restaurantSelector: {
        flex: 1,
        flexDirection: 'column',
        gap: 8,
    },
    restaurantOption: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#1c1c1e',
        borderWidth: 1,
        borderColor: '#333',
    },
    restaurantOptionActive: {
        backgroundColor: '#0a84ff',
        borderColor: '#0a84ff',
    },
    restaurantOptionText: {
        color: '#fff',
        fontSize: 16,
    },
    restaurantOptionTextActive: {
        fontWeight: '600',
    },
    restaurantRole: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        opacity: 0.8,
    },
    printerSettingsButton: {
        padding: 16,
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    printerSettingsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    printerSettingsButtonSubtext: {
        color: '#888',
        fontSize: 14,
    },
});
