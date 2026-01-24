import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase';
import type { Database } from '../../types/database.types';
import { CalendarEventModal } from './components/CalendarEventModal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

type CalendarEvent = Database['public']['Tables']['gm_calendar_events']['Row'];
type CalendarEventInsert = Database['public']['Tables']['gm_calendar_events']['Insert'];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const StrategicCalendar = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            // Calculate start/end of current view (roughly)
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Get first day of month
            const startOfMonth = new Date(year, month, 1);
            // Get last day of month
            const endOfMonth = new Date(year, month + 1, 0);

            // Buffer to cover grid
            const startQuery = new Date(startOfMonth);
            startQuery.setDate(startQuery.getDate() - 7);

            const endQuery = new Date(endOfMonth);
            endQuery.setDate(endQuery.getDate() + 7);

            const { data, error } = await supabase
                .from('gm_calendar_events')
                .select('*')
                .gte('start_at', startQuery.toISOString())
                .lte('start_at', endQuery.toISOString());

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calendar Grid Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

        const daysArray = [];

        // Previous month padding
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            daysArray.push({
                date: new Date(year, month - 1, prevMonthDays - i),
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Current month days
        const today = new Date();
        for (let i = 1; i <= days; i++) {
            const dayDate = new Date(year, month, i);
            daysArray.push({
                date: dayDate,
                isCurrentMonth: true,
                isToday: dayDate.toDateString() === today.toDateString()
            });
        }

        // Next month padding to complete 42 cells (6 rows)
        const remainingCells = 42 - daysArray.length;
        for (let i = 1; i <= remainingCells; i++) {
            daysArray.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
                isToday: false
            });
        }

        return daysArray;
    };

    const days = getDaysInMonth(currentDate);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleCreate = (date?: Date) => {
        setEditingEvent(null);
        setSelectedDate(date || new Date());
        setIsModalOpen(true);
    };

    const handleEdit = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleSave = async (eventData: CalendarEventInsert) => {
        try {
            // Helper to preserve time zone correctness if needed, but for now trusting simple inputs
            const { error } = await supabase
                .from('gm_calendar_events')
                .upsert(eventData as any)
                .select();

            if (error) throw error;
            await fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Failed to save event');
        }
    };

    const getEventsForDay = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start_at);
            return eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'maintenance': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'audit': return 'bg-red-100 text-red-800 border-red-200';
            case 'inspection': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'special_service': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6" />
                        Strategic Calendar
                    </h1>
                    <p className="text-slate-500 mt-1">Operational orchestration and compliance schedule.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm p-1">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded text-slate-600">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 py-2 font-semibold text-slate-900 min-w-[160px] text-center">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded text-slate-600">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={() => handleCreate()}
                        className="bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium"
                    >
                        + New Event
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                        <p>Loading schedule...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 flex flex-col overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="py-3 px-4 text-sm font-semibold text-slate-500 text-center uppercase tracking-wide">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                        {days.map((day, idx) => {
                            const dayEvents = getEventsForDay(day.date);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleCreate(day.date)}
                                    className={`
                                        min-h-[120px] border-b border-r border-slate-100 p-2 relative transition-colors cursor-pointer hover:bg-slate-50
                                        ${!day.isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white'}
                                        ${day.isToday ? 'bg-blue-50/30' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                            ${day.isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}
                                        `}>
                                            {day.date.getDate()}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => handleEdit(event, e)}
                                                className={`
                                                    px-2 py-1 rounded text-xs border truncate shadow-sm hover:opacity-80 transition-opacity
                                                    ${getCategoryColor(event.category)}
                                                `}
                                                title={event.title}
                                            >
                                                {event.is_blocker && <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />}
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-xs text-slate-400 pl-1">
                                                + {dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <CalendarEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingEvent}
                initialDate={selectedDate ? selectedDate.toISOString() : undefined}
            />
        </div>
    );
};

export default StrategicCalendar;
