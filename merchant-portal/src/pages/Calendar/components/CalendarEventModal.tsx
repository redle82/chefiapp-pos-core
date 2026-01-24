import React, { useState, useEffect } from 'react';
import type { Database } from '../../../types/database.types';

type CalendarEvent = Database['public']['Tables']['gm_calendar_events']['Row'];
type CalendarEventInsert = Database['public']['Tables']['gm_calendar_events']['Insert'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEventInsert) => Promise<void>;
    initialData?: CalendarEvent | null;
    initialDate?: string; // ISO string
}

export const CalendarEventModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, initialDate }) => {
    const [formData, setFormData] = useState<Partial<CalendarEventInsert>>({
        title: '',
        description: '',
        category: 'maintenance',
        start_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        end_at: '',
        is_all_day: false,
        recurrence: 'none',
        assigned_role: '',
        status: 'planned',
        restaurant_id: '00000000-0000-0000-0000-000000000000', // Placeholder
        is_blocker: false
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                start_at: initialData.start_at ? new Date(initialData.start_at).toISOString().slice(0, 16) : '',
                end_at: initialData.end_at ? new Date(initialData.end_at).toISOString().slice(0, 16) : '',
                restaurant_id: initialData.restaurant_id
            });
        } else {
            // Default to initialDate if provided, or now
            const defaultStart = initialDate
                ? new Date(initialDate).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16);

            setFormData({
                title: '',
                description: '',
                category: 'maintenance',
                start_at: defaultStart,
                end_at: '',
                is_all_day: false,
                recurrence: 'none',
                assigned_role: '',
                status: 'planned',
                restaurant_id: '00000000-0000-0000-0000-000000000000',
                is_blocker: false
            });
        }
    }, [initialData, initialDate, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ensure dates are full ISO strings
            const submissionData = { ...formData };
            if (submissionData.start_at) submissionData.start_at = new Date(submissionData.start_at).toISOString();
            if (submissionData.end_at) submissionData.end_at = new Date(submissionData.end_at).toISOString();

            await onSave(submissionData as CalendarEventInsert);
            onClose();
        } catch (error) {
            console.error('Error saving event:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm p-4 md:p-0">
            <div className="relative w-full max-w-2xl max-h-full rounded-xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <h3 className="text-xl font-semibold text-slate-900">
                        {initialData ? 'Edit Strategic Event' : 'New Strategic Event'}
                    </h3>
                    <button
                        onClick={onClose}
                        type="button"
                        className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <svg className="h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                placeholder="e.g., HVAC Maintenance, Annual Audit"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                placeholder="Additional details..."
                                rows={3}
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                <option value="maintenance">Maintenance</option>
                                <option value="audit">Audit</option>
                                <option value="inspection">Inspection</option>
                                <option value="special_service">Special Service</option>
                                <option value="incident">Incident</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Recurrence</label>
                            <select
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.recurrence || 'none'}
                                onChange={e => setFormData({ ...formData, recurrence: e.target.value as any })}
                            >
                                <option value="none">None (One-time)</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time</label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.start_at}
                                onChange={e => setFormData({ ...formData, start_at: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Date & Time</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.end_at || ''}
                                onChange={e => setFormData({ ...formData, end_at: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Role</label>
                            <select
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.assigned_role || ''}
                                onChange={e => setFormData({ ...formData, assigned_role: e.target.value })}
                            >
                                <option value="">Unassigned</option>
                                <option value="manager">Manager</option>
                                <option value="chef">Chef</option>
                                <option value="cleaner">Cleaner</option>
                                <option value="external">External Vendor</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.is_blocker || false}
                                    onChange={e => setFormData({ ...formData, is_blocker: e.target.checked })}
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                <span className="ms-3 text-sm font-medium text-slate-900">Blocker? (Critical Event)</span>
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center space-x-4 border-t border-slate-200 pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Event'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-slate-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
