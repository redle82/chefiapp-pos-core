import { useState } from 'react';
import { supabase } from '../../core/supabase';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { useSubscription } from '../../hooks/useSubscription';
import { DEFAULT_PLANS } from '../../../../billing-core/types';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';

export default function BillingPage() {
    const restaurantId = getTabIsolated('chefiapp_restaurant_id');
    const { subscription, loading, refetch } = useSubscription();
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCancel = async (immediately: boolean = false) => {
        if (!restaurantId || !subscription) return;

        if (!confirm(`Tem certeza que deseja cancelar sua assinatura${immediately ? ' imediatamente' : ' ao final do período'}?`)) {
            return;
        }

        setActionLoading(true);
        setError(null);

        try {
            const { error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
                body: {
                    restaurant_id: restaurantId,
                    immediately,
                }
            });

            if (cancelError) throw cancelError;

            await refetch();
        } catch (err: any) {
            console.error('[BillingPage] Error canceling subscription:', err);
            setError(err.message || 'Erro ao cancelar assinatura');
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePlan = async (newPlanId: string) => {
        if (!restaurantId || !subscription) return;

        const newPlan = DEFAULT_PLANS.find(p => p.plan_id === newPlanId);
        if (!newPlan) return;

        if (!confirm(`Tem certeza que deseja mudar para o plano ${newPlan.name}?`)) {
            return;
        }

        setActionLoading(true);
        setError(null);

        try {
            const { error: changeError } = await supabase.functions.invoke('change-plan', {
                body: {
                    restaurant_id: restaurantId,
                    new_plan_id: newPlanId,
                }
            });

            if (changeError) throw changeError;

            await refetch();
        } catch (err: any) {
            console.error('[BillingPage] Error changing plan:', err);
            setError(err.message || 'Erro ao mudar plano');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-10">Carregando...</div>;

    const currentPlan = subscription ? DEFAULT_PLANS.find(p => p.plan_id === subscription.plan_id) : null;
    const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL';
    const isCancelled = subscription?.status === 'CANCELLED';

    if (!subscription) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Card surface="layer2" padding="lg">
                    <Text size="lg" weight="bold" style={{ marginBottom: '16px' }}>
                        Nenhuma Assinatura Ativa
                    </Text>
                    <Text color="secondary" style={{ marginBottom: '24px' }}>
                        Você ainda não possui uma assinatura. Complete o onboarding para escolher um plano.
                    </Text>
                    <Button variant="primary" onClick={() => window.location.href = '/onboarding/billing'}>
                        Escolher Plano
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Assinatura & Planos</h1>
            <p className="text-gray-500 mb-8">Gerencie o plano do seu restaurante.</p>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <Card surface="layer2" padding="lg" style={{ marginBottom: '24px' }}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            ChefIApp {currentPlan?.name || subscription.plan_tier}
                        </h2>
                        <ul className="space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                            <li>Plano: <span className="font-bold">{currentPlan?.name || subscription.plan_tier}</span></li>
                            {subscription.current_period_end && (
                                <li>Próxima renovação: <span className="font-bold">
                                    {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                                </span></li>
                            )}
                            {subscription.trial_ends_at && subscription.status === 'TRIAL' && (
                                <li>Trial termina em: <span className="font-bold text-amber-600">
                                    {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                                </span></li>
                            )}
                            {subscription.cancelled_at && (
                                <li>Cancelamento: <span className="font-bold text-red-600">
                                    {new Date(subscription.cancelled_at).toLocaleDateString('pt-BR')}
                                </span></li>
                            )}
                        </ul>

                        <div className="flex items-center gap-3">
                            <StatusBadge status={subscription.status} />
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {isActive && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleCancel(false)}
                                    disabled={actionLoading}
                                    loading={actionLoading}
                                >
                                    Cancelar ao Final do Período
                                </Button>
                                <Button
                                    variant="critical"
                                    onClick={() => handleCancel(true)}
                                    disabled={actionLoading}
                                    loading={actionLoading}
                                >
                                    Cancelar Imediatamente
                                </Button>
                            </>
                        )}
                        {isCancelled && (
                            <Text color="secondary" size="sm">
                                Assinatura cancelada
                            </Text>
                        )}
                    </div>
                </div>
            </Card>

            {/* Upgrade/Downgrade Plans */}
            {isActive && (
                <Card surface="layer2" padding="lg">
                    <h3 className="text-xl font-bold mb-4">Mudar Plano</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {DEFAULT_PLANS.map((plan) => {
                            const isCurrentPlan = plan.plan_id === subscription.plan_id;
                            const isUpgrade = plan.price_cents > (currentPlan?.price_cents || 0);

                            return (
                                <Card
                                    key={plan.plan_id}
                                    surface={isCurrentPlan ? 'layer3' : 'layer1'}
                                    padding="md"
                                    hoverable={!isCurrentPlan}
                                    onClick={() => !isCurrentPlan && handleChangePlan(plan.plan_id)}
                                    style={{
                                        border: isCurrentPlan ? '2px solid #32d74b' : '1px solid rgba(255,255,255,0.1)',
                                        cursor: isCurrentPlan ? 'default' : 'pointer',
                                    }}
                                >
                                    <Text size="lg" weight="bold" style={{ marginBottom: '8px' }}>
                                        {plan.name}
                                    </Text>
                                    <Text size="xl" weight="bold" style={{ marginBottom: '16px' }}>
                                        €{(plan.price_cents / 100).toFixed(0)}/mês
                                    </Text>
                                    {isCurrentPlan && (
                                        <Text size="sm" style={{ color: '#32d74b', fontWeight: 600 }}>
                                            Plano Atual
                                        </Text>
                                    )}
                                    {!isCurrentPlan && (
                                        <Button
                                            variant={isUpgrade ? 'primary' : 'secondary'}
                                            size="sm"
                                            fullWidth
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleChangePlan(plan.plan_id);
                                            }}
                                            disabled={actionLoading}
                                        >
                                            {isUpgrade ? 'Upgrade' : 'Downgrade'}
                                        </Button>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'ACTIVE') return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-sm uppercase">Ativo</span>;
    if (status === 'TRIAL') return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-sm uppercase">Trial</span>;
    if (status === 'PAST_DUE') return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold text-sm uppercase">Pagamento Pendente</span>;
    if (status === 'SUSPENDED') return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold text-sm uppercase">Suspenso</span>;
    if (status === 'CANCELLED') return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold text-sm uppercase">Cancelado</span>;
    return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold text-sm uppercase">{status}</span>;
};
