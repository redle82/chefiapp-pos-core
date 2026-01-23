import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThumbCard } from './ThumbCard';

// Mock Data for Monthly Stats
interface DailyStat {
    day: number;
    status: 'perfect' | 'warning' | 'critical' | 'neutral';
    score: number;
}

// Generate a fake month of data
const generateMonthData = (): DailyStat[] => {
    return Array.from({ length: 30 }, (_, i) => {
        const rand = Math.random();
        let status: DailyStat['status'] = 'perfect';
        let score = 100;

        if (rand > 0.8) { status = 'critical'; score = 65; }
        else if (rand > 0.6) { status = 'warning'; score = 85; }
        else if (rand > 0.95) { status = 'neutral'; score = 0; } // Closed day

        return { day: i + 1, status, score };
    });
};

const MOCK_MONTH_DATA = generateMonthData();

export const OwnerCalendarView = () => {
    const [selectedDay, setSelectedDay] = useState<DailyStat | null>(null);

    const getDayColor = (status: DailyStat['status']) => {
        switch (status) {
            case 'perfect': return '#32d74b'; // Green
            case 'warning': return '#ff9f0a'; // Orange
            case 'critical': return '#ff453a'; // Red
            default: return '#3a3a3c'; // Grey
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>👁️ Visão Estratégica (Mensal)</Text>
                <Text style={styles.headerSub}>Desempenho & Conformidade</Text>
            </View>

            {/* Monthly Heatmap Grid */}
            <View style={styles.calendarGrid}>
                {MOCK_MONTH_DATA.map((stat) => (
                    <TouchableOpacity
                        key={stat.day}
                        style={[
                            styles.dayCell,
                            { backgroundColor: getDayColor(stat.status) + '40', borderColor: getDayColor(stat.status) },
                            selectedDay?.day === stat.day && styles.dayCellSelected
                        ]}
                        onPress={() => setSelectedDay(stat)}
                    >
                        <Text style={[styles.dayText, { color: getDayColor(stat.status) }]}>{stat.day}</Text>
                        {stat.status === 'perfect' && <View style={styles.perfectDot} />}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Selected Day Detail */}
            {selectedDay ? (
                <View style={styles.detailContainer}>
                    <Text style={styles.sectionTitle}>Detalhes do Dia {selectedDay.day}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Score Geral</Text>
                            <Text style={[styles.statValue, { color: getDayColor(selectedDay.status) }]}>
                                {selectedDay.score}%
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Status</Text>
                            <Text style={[styles.statValue, { color: '#fff', fontSize: 16 }]}>
                                {selectedDay.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {selectedDay.status === 'critical' && (
                        <View style={styles.alertBox}>
                            <Ionicons name="warning" size={24} color="#ff453a" />
                            <Text style={styles.alertText}>Falha crítica na Cadeia de Frio (Congelador 2 &gt; -15°C).</Text>
                        </View>
                    )}
                    {selectedDay.status === 'perfect' && (
                        <View style={[styles.alertBox, { backgroundColor: '#32d74b20', borderColor: '#32d74b' }]}>
                            <Ionicons name="checkmark-circle" size={24} color="#32d74b" />
                            <Text style={[styles.alertText, { color: '#32d74b' }]}>Dia Perfeito! Sem incidentes operacionais.</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={[styles.detailContainer, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#666' }}>Selecione um dia para ver os detalhes.</Text>
                </View>
            )}

            {/* Strategic KPI */}
            <ThumbCard style={styles.strategyCard}>
                <View>
                    <Text style={styles.strategyLabel}>Índice de "Dias Perfeitos"</Text>
                    <Text style={styles.strategyValue}>72%</Text>
                </View>
                <View>
                    <Text style={[styles.strategyLabel, { textAlign: 'right' }]}>Meta</Text>
                    <Text style={[styles.strategyValue, { textAlign: 'right', color: '#ff9f0a' }]}>85%</Text>
                </View>
            </ThumbCard>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 20,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSub: {
        color: '#666',
        fontSize: 14,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dayCell: {
        width: '13%', // Approx 7 cols
        aspectRatio: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1,
    },
    dayCellSelected: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    dayText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    perfectDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#32d74b',
        position: 'absolute',
        bottom: 4,
    },
    detailContainer: {
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
        padding: 16,
        minHeight: 150,
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff453a20',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff453a',
    },
    alertText: {
        color: '#ff453a',
        marginLeft: 12,
        fontSize: 14,
        flex: 1,
    },
    strategyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1c1c1e', // Dark card
    },
    strategyLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    strategyValue: {
        color: '#32d74b',
        fontSize: 28,
        fontWeight: 'bold',
    }
});
