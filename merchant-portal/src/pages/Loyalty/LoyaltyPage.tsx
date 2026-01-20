/**
 * LoyaltyPage - Página de programa de fidelidade
 * 
 * FASE 3: UI para visualizar pontos e gerenciar recompensas
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import type { LoyaltyCard } from '../../core/loyalty/LoyaltyService';
import { supabase } from '../../core/supabase';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { useNavigate } from 'react-router-dom';

export const LoyaltyPage: React.FC = () => {
    const navigate = useNavigate();
    const { error } = useToast();
    const restaurantId = getTabIsolated('chefiapp_restaurant_id');

    const [cards, setCards] = useState<Array<LoyaltyCard & { customer?: any }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (restaurantId) {
            loadCards();
        }
    }, [restaurantId]);

    const loadCards = async () => {
        if (!restaurantId) return;

        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('loyalty_cards')
                .select('*, customer:gm_customers(*)')
                .eq('restaurant_id', restaurantId)
                .eq('status', 'active')
                .order('current_points', { ascending: false })
                .limit(50);

            if (fetchError) throw fetchError;

            setCards(data || []);
        } catch (err) {
            error('Erro ao carregar cartões: ' + (err instanceof Error ? err.message : 'Unknown'));
        } finally {
            setLoading(false);
        }
    };



    const getTierLabel = (tier: string) => {
        switch (tier) {
            case 'platinum': return 'Platina';
            case 'gold': return 'Ouro';
            case 'silver': return 'Prata';
            default: return tier;
        }
    };

    return (
        <AdminLayout
            sidebar={<AdminSidebar activePath="/app/loyalty" onNavigate={navigate} />}
            content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64 }}>
                    <div>
                        <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                            🎁 Programa de Fidelidade
                        </Text>
                        <Text size="sm" color="secondary">
                            Visualize pontos de fidelidade e gerencie recompensas
                        </Text>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <Card surface="base" padding="lg">
                            <Text size="sm" color="tertiary">Total de Cartões</Text>
                            <Text size="2xl" weight="bold">{cards.length}</Text>
                        </Card>
                        <Card surface="base" padding="lg">
                            <Text size="sm" color="tertiary">Pontos Totais Emitidos</Text>
                            <Text size="2xl" weight="bold">
                                {cards.reduce((sum, c) => sum + (c.points_earned || 0), 0).toFixed(0)}
                            </Text>
                        </Card>
                        <Card surface="base" padding="lg">
                            <Text size="sm" color="tertiary">Pontos Totais Resgatados</Text>
                            <Text size="2xl" weight="bold">
                                {cards.reduce((sum, c) => sum + (c.points_redeemed || 0), 0).toFixed(0)}
                            </Text>
                        </Card>
                    </div>

                    {/* Cards List */}
                    {loading ? (
                        <Card surface="base" padding="xl">
                            <Text size="sm" color="tertiary">Carregando cartões...</Text>
                        </Card>
                    ) : cards.length === 0 ? (
                        <Card surface="base" padding="xl">
                            <Text size="sm" color="tertiary" style={{ textAlign: 'center' }}>
                                Nenhum cartão de fidelidade ativo ainda
                            </Text>
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {cards.map((card) => (
                                <Card key={card.id} surface="base" padding="lg">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                <Text size="lg" weight="bold" color="primary">
                                                    {card.customer?.full_name || card.customer?.preferred_name || 'Cliente'}
                                                </Text>
                                                <Badge
                                                    status="ready"
                                                    label={`${getTierLabel(card.current_tier)} ★`}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                                                <div>
                                                    <Text size="xs" color="tertiary">Pontos Atuais</Text>
                                                    <Text size="xl" weight="bold">{card.current_points || 0}</Text>
                                                </div>
                                                <div>
                                                    <Text size="xs" color="tertiary">Pontos Ganhos</Text>
                                                    <Text size="md" weight="bold">{card.points_earned || 0}</Text>
                                                </div>
                                                <div>
                                                    <Text size="xs" color="tertiary">Pontos Resgatados</Text>
                                                    <Text size="md" weight="bold">{card.points_redeemed || 0}</Text>
                                                </div>
                                                {card.created_at && (
                                                    <div>
                                                        <Text size="xs" color="tertiary">Criado em</Text>
                                                        <Text size="sm" color="secondary">
                                                            {new Date(card.created_at).toLocaleDateString('pt-PT')}
                                                        </Text>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            }
        />
    );
};
