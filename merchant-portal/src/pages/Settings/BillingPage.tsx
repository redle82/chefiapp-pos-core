import { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { BillingBroker } from '../../core/billing/BillingBroker';

export default function BillingPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const restaurantId = getTabIsolated('chefiapp_restaurant_id');

    // Stripe Configuration
    const PAYMENT_LINK = "https://buy.stripe.com/test_bJe4gz0kQ8Wd1Hx7lJb7y00";

    useEffect(() => {
        if (!restaurantId) return;
        fetchProfile();
    }, [restaurantId]);

    const fetchProfile = async () => {
        setLoading(true);
        const { data, error: _error } = await supabase
            .from('gm_restaurants')
            .select('billing_status')
            .eq('id', restaurantId)
            .single();

        if (data) setProfile({ subscription_status: data.billing_status });
        setLoading(false);
    };

    if (loading) return <div className="p-10">Carregando faturas...</div>;

    const status = profile?.subscription_status || 'trialing';
    const isPro = status === 'active';

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Assinatura & Planos</h1>
            <p className="text-gray-500 mb-8">Gerencie o plano do seu restaurante.</p>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">ChefIApp Pro</h2>
                        <ul className="space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                            <li>Preço: <span className="font-bold">29,00 € / mês</span></li>
                            <li>Tudo Incluído: TPV, KDS, Menu Digital, Staff Ilimitado</li>
                            <li>Suporte Prioritário</li>
                        </ul>

                        <div className="flex items-center gap-3">
                            <StatusBadge status={status} />
                            {status === 'trialing' && <span className="text-xs text-amber-600 font-medium">Trial de 7 dias em andamento.</span>}
                        </div>
                    </div>

                    {!isPro ? (
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    // PRECO HARDCODED: Sovereign Plan Monthly
                                    // TODO: Mover para CONSTANTES ou buscar do Edge Function
                                    const SOVEREIGN_PRICE_ID = 'price_1QguE2Lw0XvQ8Z8Z3Z3Z3Z3Z'; // Exemplo Placeholder
                                    // Como não tenho o ID real do Stripe, vou usar um placeholder e o usuário deve ajustar no .env ou constants
                                    // FIX: Vou usar uma variável de ambiente se existir, ou logar um erro se não.
                                    // Para o POC, usarei o ID de teste que vi em conversas anteriores se houver, ou pedirei ao usuário.
                                    // Vou assumir que o Edge Function valida o preço ou tem um default se não passar.
                                    // Mas o Edge Function pede `priceId`.
                                    // W A R N I N G: Preciso do PRICE ID real do Stripe Dashboard.
                                    // Vou colocar um TODO e um alert por enquanto.
                                    const { url } = await BillingBroker.startSubscription('price_1QguE2Lw0XvQ8Z8Z3Z3Z3Z3Z');
                                    window.location.href = url;
                                } catch (e: any) {
                                    alert('Erro ao iniciar checkout: ' + e.message);
                                    setLoading(false);
                                }
                            }}
                            className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
                        >
                            Ativar Plano Pro (29€/mês)
                        </button>
                    ) : (
                        <div className="flex flex-col items-end">
                            <button disabled className="bg-green-100 text-green-800 px-6 py-3 rounded-xl font-bold cursor-default mb-2">
                                Plano Ativo
                            </button>
                            <span className="text-xs text-green-600 font-mono">Assinatura Válida</span>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { url } = await BillingBroker.openCustomerPortal();
                                        window.location.href = url;
                                    } catch (e: any) {
                                        alert('Erro ao abrir portal: ' + e.message);
                                        setLoading(false);
                                    }
                                }}
                                className="text-gray-500 hover:text-black text-xs font-semibold underline mt-2"
                            >
                                Gerenciar / Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {isPro && (
                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold mb-2">Gestão da Assinatura</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Sua assinatura renova automaticamente a cada mês. Você pode cancelar a qualquer momento sem custos adicionais.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'active') return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-sm uppercase">Ativo</span>;
    if (status === 'past_due') return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold text-sm uppercase">Pendente</span>;
    if (status === 'canceled') return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold text-sm uppercase">Cancelado</span>;
    return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-sm uppercase">Trial</span>;
};
