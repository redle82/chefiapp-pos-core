import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../core/tenant/TenantContext';
import { supabase } from '../../core/supabase';
import { Logger } from '../../core/logger';

interface OperationHistoryEntry {
    id: string;
    status: 'active' | 'paused' | 'suspended';
    reason: string | null;
    updated_by: string | null;
    created_at: string;
}

/**
 * OperationStatusPage (Opus 6.0)
 * 
 * Page to manage operation status and view history.
 */
export const OperationStatusPage: React.FC = () => {
    const { restaurant, refreshTenant } = useTenant();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<OperationHistoryEntry[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const currentStatus = restaurant?.operation_status || 'active';

    useEffect(() => {
        loadHistory();
    }, [restaurant?.id]);

    const loadHistory = async () => {
        if (!restaurant?.id) return;
        setLoadingHistory(true);
        try {
            // Query audit table for full history
            const { data, error } = await supabase.rpc('get_operation_status_history', {
                p_restaurant_id: restaurant.id,
                p_limit: 50
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setHistory(data.map((entry: any) => ({
                    id: entry.id,
                    status: entry.new_status,
                    reason: entry.reason,
                    updated_by: entry.actor_id,
                    created_at: entry.created_at
                })));
            } else {
                // Fallback to metadata if no audit entries
                const metadata = restaurant?.operation_metadata || {};
                if (metadata.last_update) {
                    setHistory([{
                        id: 'current',
                        status: currentStatus,
                        reason: metadata.reason || null,
                        updated_by: metadata.updated_by || null,
                        created_at: metadata.last_update
                    }]);
                }
            }
        } catch (err) {
            console.error('Failed to load history:', err);
            // Fallback to metadata on error
            const metadata = restaurant?.operation_metadata || {};
            if (metadata.last_update) {
                setHistory([{
                    id: 'current',
                    status: currentStatus,
                    reason: metadata.reason || null,
                    updated_by: metadata.updated_by || null,
                    created_at: metadata.last_update
                }]);
            }
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleStatusChange = async (newStatus: 'active' | 'paused' | 'suspended') => {
        if (!restaurant?.id) return;

        const statusLabels = {
            active: 'ATIVAR',
            paused: 'PAUSAR',
            suspended: 'SUSPENDER'
        };

        if (!confirm(`Tem certeza que deseja ${statusLabels[newStatus]} a operação do sistema?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase.rpc('update_operation_status', {
                p_restaurant_id: restaurant.id,
                p_status: newStatus,
                p_reason: `Status alterado para ${newStatus} via OperationStatusPage`,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null
            });

            if (error) throw error;

            // Log operation status change
            Logger.info('OperationGate: Status changed', {
                restaurantId: restaurant.id,
                previousStatus: currentStatus,
                newStatus: newStatus,
                reason: `Status alterado para ${newStatus} via OperationStatusPage`,
                source: 'OperationStatusPage'
            });

            await refreshTenant();
            await loadHistory();

            if (newStatus === 'suspended') {
                navigate('/app/suspended');
            } else if (newStatus === 'paused') {
                navigate('/app/paused');
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            Logger.error('OperationGate: Failed to update status', err as Error, {
                restaurantId: restaurant?.id,
                attemptedStatus: newStatus
            });
            alert('Erro ao atualizar status. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-400';
            case 'paused': return 'text-amber-400';
            case 'suspended': return 'text-red-400';
            default: return 'text-stone-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'OPERACIONAL';
            case 'paused': return 'PAUSADO';
            case 'suspended': return 'SUSPENSO';
            default: return 'DESCONHECIDO';
        }
    };

    return (
        <div className="min-h-screen bg-stone-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/app/settings')}
                        className="text-stone-400 hover:text-white mb-4"
                    >
                        ← Voltar para Configurações
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2">Status Operacional</h1>
                    <p className="text-stone-400">Gerencie o status operacional do sistema</p>
                </div>

                {/* Current Status Card */}
                <div className="bg-stone-800 border border-stone-700 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-stone-400 text-sm mb-1">Status Atual</p>
                            <p className={`text-2xl font-bold ${getStatusColor(currentStatus)}`}>
                                {getStatusLabel(currentStatus)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {currentStatus !== 'active' && (
                                <button
                                    onClick={() => handleStatusChange('active')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-medium rounded-lg disabled:opacity-50"
                                >
                                    Ativar
                                </button>
                            )}
                            {currentStatus !== 'paused' && (
                                <button
                                    onClick={() => handleStatusChange('paused')}
                                    disabled={loading || currentStatus === 'suspended'}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg disabled:opacity-50"
                                >
                                    Pausar
                                </button>
                            )}
                            {currentStatus !== 'suspended' && (
                                <button
                                    onClick={() => handleStatusChange('suspended')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-lg disabled:opacity-50"
                                >
                                    Suspender
                                </button>
                            )}
                        </div>
                    </div>

                    {restaurant?.operation_metadata?.reason && (
                        <div className="mt-4 p-3 bg-stone-900/50 rounded-lg">
                            <p className="text-xs text-stone-500 mb-1">Último motivo:</p>
                            <p className="text-sm text-stone-300">{restaurant.operation_metadata.reason}</p>
                        </div>
                    )}
                </div>

                {/* History */}
                <div className="bg-stone-800 border border-stone-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Histórico de Mudanças</h2>
                    {loadingHistory ? (
                        <p className="text-stone-400">Carregando histórico...</p>
                    ) : history.length === 0 ? (
                        <p className="text-stone-400">Nenhum histórico disponível ainda.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.map((entry) => (
                                <div key={entry.id} className="p-4 bg-stone-900/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-medium ${getStatusColor(entry.status)}`}>
                                            {getStatusLabel(entry.status)}
                                        </span>
                                        <span className="text-xs text-stone-500">
                                            {new Date(entry.created_at).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    {entry.reason && (
                                        <p className="text-sm text-stone-400 mt-1">{entry.reason}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 text-xs text-stone-600 text-center">
                    Opus 6.0 • OperationGate
                </div>
            </div>
        </div>
    );
};
