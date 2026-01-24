import React, { useEffect, useState } from 'react';
import { LoyaltyService } from '../../../../core/loyalty/LoyaltyService';

interface RedeemPointsModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    restaurantId: string;
    customerName: string;
    currentPoints: number;
    onRedeemSuccess: () => void;
}

interface Reward {
    id: string;
    name: string;
    description: string;
    points_cost: number;
    reward_type: string;
}

export const RedeemPointsModal: React.FC<RedeemPointsModalProps> = ({
    isOpen,
    onClose,
    customerId,
    restaurantId,
    customerName,
    currentPoints,
    onRedeemSuccess
}) => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeemingId, setRedeemingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && restaurantId) {
            loadRewards();
        }
    }, [isOpen, restaurantId]);

    const loadRewards = async () => {
        try {
            setLoading(true);
            const data = await LoyaltyService.getAvailableRewards(restaurantId);
            setRewards(data);
        } catch (err) {
            console.error('Failed to load rewards', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (reward: Reward) => {
        if (currentPoints < reward.points_cost) return;
        if (!confirm(`Confirma resgatar "${reward.name}" por ${reward.points_cost} pontos?`)) return;

        try {
            setRedeemingId(reward.id);
            const result = await LoyaltyService.redeemPoints(
                restaurantId,
                customerId,
                reward.id,
                reward.points_cost
            );

            if (result.success) {
                alert('✅ Recompensa resgatada com sucesso!');
                onRedeemSuccess();
                onClose();
            } else {
                alert(`❌ Erro: ${result.error}`);
            }
        } catch (err) {
            console.error('Redemption failed', err);
            alert('Erro ao processar resgate.');
        } finally {
            setRedeemingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <header className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <div>
                        <h2 className="text-lg font-bold">Resgatar Pontos</h2>
                        <p className="text-sm opacity-90">{customerName}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm opacity-80">Saldo</div>
                        <div className="text-xl font-bold">{currentPoints} pts</div>
                    </div>
                </header>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Carregando recompensas...</div>
                    ) : rewards.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p className="text-4xl mb-2">🎁</p>
                            <p>Nenhuma recompensa ativa no momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rewards.map(reward => {
                                const canAfford = currentPoints >= reward.points_cost;
                                return (
                                    <div
                                        key={reward.id}
                                        className={`p-4 border rounded-lg flex justify-between items-center transition-all ${canAfford
                                                ? 'border-gray-200 dark:border-gray-600 hover:border-purple-500 hover:shadow-md bg-white dark:bg-gray-700'
                                                : 'border-gray-100 dark:border-gray-700 opacity-60 bg-gray-50 dark:bg-gray-800'
                                            }`}
                                    >
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{reward.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{reward.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRedeem(reward)}
                                            disabled={!canAfford || redeemingId !== null}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm ${canAfford
                                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                                                }`}
                                        >
                                            {redeemingId === reward.id ? '...' : `${reward.points_cost} pts`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Cancelar
                    </button>
                </footer>
            </div>
        </div>
    );
};
