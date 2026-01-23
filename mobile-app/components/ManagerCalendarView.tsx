import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThumbCard } from './ThumbCard';
import { supabase } from '@/services/supabase';
import { useAppStaff } from '@/context/AppStaffContext';
import { HapticFeedback } from '@/services/haptics';

// Types matched to validation_calendar.ts / DB
type EventCategory = 'maintenance' | 'audit' | 'inspection' | 'special_service' | 'incident' | 'training' | 'other';

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
    category: EventCategory;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    is_blocker: boolean;
    assigned_role?: string;
}

export const ManagerCalendarView = () => {
    const { operationalContext } = useAppStaff();
    const [selectedDayOffset, setSelectedDayOffset] = useState(0);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);

    // Generate Weekly Days
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            date: d,
            dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3).toUpperCase(),
            dayNum: d.getDate(),
            offset: i,
            isoString: d.toISOString().split('T')[0] // YYYY-MM-DD for comparison
        };
    });

    const selectedDayIso = days.find(d => d.offset === selectedDayOffset)?.isoString;

    useEffect(() => {
        fetchEvents();
    }, [selectedDayOffset, operationalContext.businessId]);

    const fetchEvents = async () => {
        if (!operationalContext.businessId) return;
        setLoading(true);
        try {
            // Calculate start and end of the selected day in UTC?
            // Simplified: Filter by Date string in DB if we stored just Date, but we stored ISO timestamp.
            // We need range: 00:00 to 23:59 of selected day.

            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + selectedDayOffset);

            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

            const { data, error } = await supabase
                .from('gm_calendar_events')
                .select('*')
                .eq('restaurant_id', operationalContext.businessId)
                .gte('start_at', startOfDay)
                .lte('start_at', endOfDay)
                .order('start_at', { ascending: true });

            if (data) {
                setEvents(data as CalendarEvent[]);
            } else if (error) {
                console.error("Error fetching calendar events:", error);
            }
        } catch (e) {
            console.error("Exception fetching calendar:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleEventStatus = async (event: CalendarEvent) => {
        const newStatus = event.status === 'completed' ? 'pending' : 'completed';
        HapticFeedback.light();

        // Optimistic Update
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: newStatus } : e));

        try {
            const { error } = await supabase
                .from('gm_calendar_events')
                .update({ status: newStatus })
                .eq('id', event.id);

            if (error) throw error;

            if (newStatus === 'completed') {
                HapticFeedback.success();
            }
        } catch (e) {
            console.error("Error toggling status:", e);
            Alert.alert("Erro", "Falha ao atualizar status.");
            // Revert
            fetchEvents();
        }
    };

    const getIcon = (cat: EventCategory) => {
        switch (cat) {
            case 'maintenance': return 'construct';
            case 'audit': return 'clipboard';
            case 'inspection': return 'shield-checkmark';
            case 'special_service': return 'star';
            case 'incident': return 'alert-circle';
            case 'training': return 'school';
            default: return 'calendar';
        }
    };

    const getColor = (cat: EventCategory) => {
        switch (cat) {
            case 'maintenance': return '#ff9f0a';
            case 'audit': return '#0a84ff';
            case 'inspection': return '#32d74b';
            case 'incident': return '#ff453a';
            case 'special_service': return '#bf5af2';
            default: return '#acacac';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🗓️ Visão Tática Semanal</Text>
                <Text style={styles.headerSub}>Planejamento & Ocorrências</Text>
            </View>

            {/* Day Strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripContainer}>
                {days.map((day) => (
                    <TouchableOpacity
                        key={day.offset}
                        style={[styles.dayCard, selectedDayOffset === day.offset && styles.dayCardActive]}
                        onPress={() => setSelectedDayOffset(day.offset)}
                    >
                        <Text style={[styles.dayName, selectedDayOffset === day.offset && styles.dayNameActive]}>{day.dayName}</Text>
                        <Text style={[styles.dayNum, selectedDayOffset === day.offset && styles.dayNumActive]}>{day.dayNum}</Text>

                        {/* We don't have pre-fetched counts for other days in this logic yet, simplified to dot if current day has events or fetching all? 
                            To keep it simple: removed dot logic for non-selected days or would need to fetch week range. 
                            Let's keep it simple: no dot for now unless we fetch all week. 
                        */}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Event List */}
            <View style={styles.listContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>
                        {selectedDayOffset === 0 ? 'Hoje' : selectedDayOffset === 1 ? 'Amanhã' : days[selectedDayOffset].dayName}
                    </Text>
                    {loading && <ActivityIndicator size="small" color="#fff" />}
                </View>

                {!loading && events.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nada planejado para este dia.</Text>
                        <Text style={styles.emptySub}>Foco na operação padrão.</Text>
                    </View>
                ) : (
                    events.map(event => (
                        <ThumbCard
                            key={event.id}
                            style={[
                                styles.eventCard,
                                event.status === 'completed' && { opacity: 0.6, borderColor: '#32d74b', borderWidth: 1 }
                            ]}
                            onPress={() => toggleEventStatus(event)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: getColor(event.category) + '20' }]}>
                                <Ionicons name={getIcon(event.category) as any} size={24} color={getColor(event.category)} />
                            </View>
                            <View style={styles.eventContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.eventTime}>
                                        {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    {event.status === 'completed' && <Text style={{ marginLeft: 8, fontSize: 10, color: '#32d74b', fontWeight: 'bold' }}>CONCLUÍDO</Text>}
                                </View>
                                <Text style={[styles.eventTitle, event.status === 'completed' && { textDecorationLine: 'line-through', color: '#888' }]}>
                                    {event.title}
                                </Text>
                                <Text style={styles.eventCat}>
                                    {event.category.toUpperCase()} • {event.assigned_role ? event.assigned_role.toUpperCase() : 'GERAL'}
                                </Text>
                            </View>
                            <View>
                                {event.status === 'pending' ? (
                                    <View style={styles.checkCircle} />
                                ) : (
                                    <Ionicons name="checkmark-circle" size={24} color="#32d74b" />
                                )}
                            </View>
                        </ThumbCard>
                    ))
                )}
            </View>
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
    stripContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    dayCard: {
        width: 60,
        height: 80,
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    dayCardActive: {
        backgroundColor: '#0a84ff',
        borderColor: '#0a84ff',
    },
    dayName: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    dayNameActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    dayNum: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dayNumActive: {
        color: '#fff',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#32d74b',
        marginTop: 6,
    },
    listContainer: {
        minHeight: 200,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    emptySub: {
        color: '#444',
        fontSize: 14,
        marginTop: 4,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#1c1c1e',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    eventContent: {
        flex: 1,
    },
    eventTime: {
        color: '#0a84ff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    eventTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    eventCat: {
        color: '#666',
        fontSize: 10,
        letterSpacing: 1,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#444',
    }
});
