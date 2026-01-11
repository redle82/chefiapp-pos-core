import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../core/tenant/TenantContext';

/**
 * 🔴 SystemSuspendedPage (Opus 6.0)
 * 
 * Hard lock screen when system is suspended.
 * User cannot resume - must contact support.
 */
export const SystemSuspendedPage: React.FC = () => {
    const { restaurant } = useTenant();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
            <div className="bg-stone-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-red-900/20">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🔴</span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Sistema Suspenso</h1>
                <p className="text-stone-400 mb-4">
                    O sistema foi suspenso e não pode ser retomado automaticamente.
                </p>
                <p className="text-stone-500 text-sm mb-8">
                    Entre em contato com o suporte para resolver esta situação.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/app/settings')}
                        className="w-full py-4 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-xl transition-all"
                    >
                        Ver Configurações
                    </button>

                    <button
                        onClick={() => window.location.href = 'mailto:support@chefiapp.com?subject=Sistema Suspenso'}
                        className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl transition-all border border-red-500/30"
                    >
                        Contatar Suporte
                    </button>
                </div>

                {restaurant?.operation_metadata && (
                    <div className="mt-8 p-4 bg-stone-900/50 rounded-lg text-left">
                        <p className="text-xs text-stone-500 mb-2">Informações da Suspensão:</p>
                        <p className="text-xs text-stone-400">
                            {restaurant.operation_metadata.reason && (
                                <>Motivo: {restaurant.operation_metadata.reason}<br /></>
                            )}
                            {restaurant.operation_metadata.last_update && (
                                <>Data: {new Date(restaurant.operation_metadata.last_update).toLocaleString('pt-BR')}</>
                            )}
                        </p>
                    </div>
                )}

                <div className="mt-8 text-xs text-stone-600">
                    Opus 6.0 • OperationGate
                </div>
            </div>
        </div>
    );
};
