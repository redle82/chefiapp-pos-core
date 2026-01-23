import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafetyControl } from '@/context/SafetyContext';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticFeedback } from '@/services/haptics';

interface SafetyCardProps {
    control: SafetyControl;
    onLog: (value: number | boolean | string) => void;
}

export const SafetyCard: React.FC<SafetyCardProps> = ({ control, onLog }) => {
    // Local state for numeric input
    const [numValue, setNumValue] = useState<number>(
        control.category === 'temperature' ? -18 : 0
    );
    const [boolValue, setBoolValue] = useState<boolean | null>(null);

    const isNumeric = control.type === 'numeric';
    const isBoolean = control.type === 'boolean';

    // Helper to determine zone color based on *current* local value
    const getZoneColor = (val: number) => {
        if (!control.validationRules) return '#666';
        const { min, max } = control.validationRules;
        if (max !== undefined && val > max) return '#ff453a'; // Critical (High)
        if (min !== undefined && val < min) return '#ff453a'; // Critical (Low)
        return '#32d74b'; // Safe
    };

    const handleQuickAdd = (delta: number) => {
        HapticFeedback.light();
        setNumValue(prev => prev + delta);
    };

    const handleBoolean = (val: boolean) => {
        HapticFeedback.medium();
        setBoolValue(val);
        onLog(val); // Submit immediately for boolean? Or wait? Let's submit immediately for "1-Touch"
    };

    const handleSubmitNumeric = () => {
        HapticFeedback.success();
        onLog(numValue);
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Text style={styles.emoji}>
                        {control.category === 'temperature' ? '🌡️' :
                            control.category === 'hygiene' ? '🧼' : '🛡️'}
                    </Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.target}>{control.target}</Text>
                    <Text style={styles.instruction}>{control.instructions}</Text>
                </View>
                {isNumeric && (
                    <View style={[styles.zoneBadge, { backgroundColor: getZoneColor(numValue) }]}>
                        <Text style={styles.zoneText}>
                            {getZoneColor(numValue) === '#32d74b' ? 'SAFE' : 'ALERT'}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.body}>
                {isNumeric && (
                    <View style={styles.numericContainer}>
                        <TouchableOpacity style={styles.adjustBtn} onPress={() => handleQuickAdd(-1)}>
                            <Ionicons name="remove" size={24} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.valueDisplay}>
                            <Text style={styles.valueText}>{numValue}</Text>
                            <Text style={styles.unit}>{control.validationRules.unit || ''}</Text>
                        </View>

                        <TouchableOpacity style={styles.adjustBtn} onPress={() => handleQuickAdd(1)}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitNumeric}>
                            <Ionicons name="checkmark" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {isBoolean && (
                    <View style={styles.booleanContainer}>
                        <TouchableOpacity
                            style={[styles.boolBtn, styles.boolBtnFalse]}
                            onPress={() => handleBoolean(false)}
                        >
                            <Ionicons name="close" size={24} color="#ff453a" />
                            <Text style={styles.boolTextFalse}>Não / Sujo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.boolBtn, styles.boolBtnTrue]}
                            onPress={() => handleBoolean(true)}
                        >
                            <Ionicons name="checkmark" size={24} color="#32d74b" />
                            <Text style={styles.boolTextTrue}>Sim / Limpo</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0a84ff', // Default accent
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    emoji: {
        fontSize: 20,
    },
    textContainer: {
        flex: 1,
    },
    target: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    instruction: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    zoneBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    zoneText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    body: {
        marginTop: 0,
    },
    // Numeric Styles
    numericContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2c2c2e',
        borderRadius: 12,
        padding: 8,
    },
    adjustBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#3a3a3c',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueDisplay: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    valueText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    unit: {
        color: '#888',
        fontSize: 14,
        marginLeft: 4,
        marginTop: 6,
    },
    submitBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#0a84ff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Boolean Styles
    booleanContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    boolBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    boolBtnFalse: {
        borderColor: '#ff453a',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
    },
    boolBtnTrue: {
        borderColor: '#32d74b',
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
    },
    boolTextFalse: {
        color: '#ff453a',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    boolTextTrue: {
        color: '#32d74b',
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
