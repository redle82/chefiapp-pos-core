import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase';
import type { Database } from '../../types/database.types';
import { SafetyControlModal } from './components/SafetyControlModal';

type SafetyControl = Database['public']['Tables']['gm_safety_controls']['Row'];
type SafetyControlInsert = Database['public']['Tables']['gm_safety_controls']['Insert'];

export const SafetyConfig = () => {
    const [controls, setControls] = useState<SafetyControl[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState<SafetyControl | null>(null);

    useEffect(() => {
        fetchControls();
    }, []);

    const fetchControls = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('gm_safety_controls')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;
            setControls(data || []);
        } catch (error) {
            console.error('Error fetching safety controls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingControl(null);
        setIsModalOpen(true);
    };

    const handleEdit = (control: SafetyControl) => {
        setEditingControl(control);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this control?')) return;
        try {
            const { error } = await supabase
                .from('gm_safety_controls')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchControls();
        } catch (error) {
            console.error('Error deleting control:', error);
            alert('Failed to delete control');
        }
    };

    const handleSave = async (controlData: SafetyControlInsert) => {
        try {
            const { error } = await supabase
                .from('gm_safety_controls')
                .upsert(controlData as any)
                .select();

            if (error) throw error;
            await fetchControls();
        } catch (error) {
            console.error('Error saving control:', error);
            alert('Failed to save control');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Safety Configuration</h1>
                    <p className="text-slate-500 mt-1">Manage operational controls and compliance rules.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                    + New Control
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading controls...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Target</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Frequency</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Type</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {controls.map((control) => (
                                <tr key={control.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{control.target}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${control.category === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                                                control.category === 'hygiene' ? 'bg-green-100 text-green-800' :
                                                    control.category === 'temperature' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-slate-100 text-slate-800'}`}>
                                            {control.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 capitalize">{control.frequency}</td>
                                    <td className="px-6 py-4 text-slate-600 capitalize">{control.type}</td>
                                    <td className="px-6 py-4 text-slate-600 capitalize">{control.role_required}</td>
                                    <td className="px-6 py-4 text-right space-x-4">
                                        <button
                                            onClick={() => handleEdit(control)}
                                            className="text-slate-600 hover:text-slate-900 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(control.id)}
                                            className="text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {controls.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            No active controls found.
                        </div>
                    )}
                </div>
            )}

            <SafetyControlModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingControl}
            />
        </div>
    );
};

export default SafetyConfig;
