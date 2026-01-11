import { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

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
                        <a
                            href={`${PAYMENT_LINK}?client_reference_id=${restaurantId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
                        >
                            Ativar Plano Pro
                        </a>
                    ) : (
                        <div className="flex flex-col items-end">
                            <button disabled className="bg-green-100 text-green-800 px-6 py-3 rounded-xl font-bold cursor-default mb-2">
                                Plano Ativo
                            </button>
                            <span className="text-xs text-green-600 font-mono">Assinatura Válida</span>
                        </div>
                    )}
                </div>

                {isPro && (
                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold mb-2">Gestão da Assinatura</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Sua assinatura renova automaticamente a cada mês. Você pode cancelar a qualquer momento sem custos adicionais.
                        </p>
                        <button
                            onClick={() => alert('Para gerenciar ou cancelar sua assinatura, acesse o link enviado para o seu email de faturamento ou contate suporte@chefiapp.com.')}
                            className="text-gray-500 hover:text-red-500 text-sm font-semibold underline transition-colors"
                        >
                            Cancelar ou Alterar Dados de Pagamento
                        </button>
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
