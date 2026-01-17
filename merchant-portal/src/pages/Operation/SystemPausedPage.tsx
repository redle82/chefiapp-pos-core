import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../core/tenant/TenantContext';
import { supabase } from '../../core/supabase';
import { Logger } from '../../core/logger';

export const SystemPausedPage: React.FC = () => {
    const { restaurant, refreshTenant } = useTenant();
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);

    const handleResume = async () => {
        if (!restaurant?.id) return;
        setLoading(true);

        try {
            // Call the database function we created
            const { error } = await supabase.rpc('update_operation_status', {
                p_restaurant_id: restaurant.id,
                p_status: 'active',
                p_reason: 'User resumed via Paused Screen'
            });

            if (error) throw error;

            // Log operation status change
            Logger.info('OperationGate: Status changed to active', {
                restaurantId: restaurant.id,
                previousStatus: 'paused',
                newStatus: 'active',
                reason: 'User resumed via Paused Screen',
                source: 'SystemPausedPage'
            });

            await refreshTenant(); // Update local state
            navigate('/app/dashboard');
        } catch (err) {
            console.error('Failed to resume:', err);
            Logger.error('OperationGate: Failed to resume operation', err as Error, {
                restaurantId: restaurant?.id
            });
            alert('Erro ao retomar operação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
            <div className="bg-stone-800 border border-amber-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-amber-900/20">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⏸️</span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Operação Pausada</h1>
                <p className="text-stone-400 mb-8">
                    O sistema está temporariamente pausado. TPV e KDS estão bloqueados para evitar novos pedidos.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleResume}
                        disabled={loading}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Retomando...' : 'Retomar Operação Agora'}
                    </button>

                    <button
                        onClick={() => navigate('/app/settings')}
                        className="w-full py-4 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-xl transition-all"
                    >
                        Acessar Configurações
                    </button>
                </div>

                <div className="mt-8 text-xs text-stone-600">
                    Opus 6.0 • OperationGate
                </div>
            </div>
        </div>
    );
};
