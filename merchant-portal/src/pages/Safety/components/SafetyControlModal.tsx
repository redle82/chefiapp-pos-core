import React, { useState, useEffect } from 'react';
import type { Database } from '../../../types/database.types';

type SafetyControl = Database['public']['Tables']['gm_safety_controls']['Row'];
type SafetyControlInsert = Database['public']['Tables']['gm_safety_controls']['Insert'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (control: SafetyControlInsert) => Promise<void>;
    initialData?: SafetyControl | null;
}

export const SafetyControlModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Partial<SafetyControlInsert>>({
        target: '',
        category: 'hygiene',
        frequency: 'daily',
        type: 'boolean',
        role_required: 'any',
        is_active: true,
        restaurant_id: '00000000-0000-0000-0000-000000000000', // Placeholder, should be handled by context/backend
        validation_rules: {},
        orchestration: {}
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                restaurant_id: initialData.restaurant_id // Ensure ID is preserved
            });
        } else {
            // Reset form for new entry
            setFormData({
                target: '',
                category: 'hygiene',
                frequency: 'daily',
                type: 'boolean',
                role_required: 'any',
                is_active: true,
                restaurant_id: '00000000-0000-0000-0000-000000000000',
                validation_rules: {},
                orchestration: {}
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData as SafetyControlInsert);
            onClose();
        } catch (error) {
            console.error('Error saving control:', error);
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
                        {initialData ? 'Edit Safety Control' : 'New Safety Control'}
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Target Name</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                placeholder="e.g., Freezer 1 Temperature, Hand Washing"
                                value={formData.target}
                                onChange={e => setFormData({ ...formData, target: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                <option value="hygiene">Hygiene</option>
                                <option value="temperature">Temperature</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="safety">Safety (General)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                            <select
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value as any })}
                            >
                                <option value="daily">Daily</option>
                                <option value="shift_start">Shift Start</option>
                                <option value="shift_end">Shift End</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Type</label>
                            <select
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <option value="boolean">Boolean (Pass/Fail)</option>
                                <option value="numeric">Numeric (Value)</option>
                                <option value="photo">Photo Evidence</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role Required</label>
                            <select
                                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                                value={formData.role_required}
                                onChange={e => setFormData({ ...formData, role_required: e.target.value as any })}
                            >
                                <option value="any">Any Staff</option>
                                <option value="chef">Chef / Kitchen</option>
                                <option value="manager">Manager Only</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center space-x-4 border-t border-slate-200 pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Control'}
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
