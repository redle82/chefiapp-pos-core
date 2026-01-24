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
            // Using gm_customers directly now (Phase 11)
            const { data, error: fetchError } = await supabase
                .from('gm_customers')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .gt('loyalty_points', 0) // Only show customers with points
                .order('loyalty_points', { ascending: false })
                .limit(50);

            if (fetchError) throw fetchError;

            // Map customers to the card structure expected by UI (or simplified)
            const mappedCards = (data || []).map(customer => ({
                id: customer.id, // acting as card ID
                customer_id: customer.id,
                restaurant_id: customer.restaurant_id,
                current_points: customer.loyalty_points,
                points_earned: customer.loyalty_points, // Simplified: assumption is current = earned for now unless we track redemption history separately
                points_redeemed: 0,
                current_tier: customer.loyalty_tier || 'bronze',
                status: 'active',
                created_at: customer.created_at,
                // Embed customer object for display
                customer: {
                    full_name: customer.name,
                    preferred_name: customer.name?.split(' ')[0],
                    phone: customer.phone
                }
            }));

            setCards(mappedCards as any);
        } catch (err) {
            error('Erro ao carregar clientes: ' + (err instanceof Error ? err.message : 'Unknown'));
        } finally {
            setLoading(false);
        }
    };

    const getTierLabel = (tier: string) => {
        switch (tier) {
            case 'platinum': return 'Platina';
            case 'gold': return 'Ouro';
            case 'silver': return 'Prata';
            default: return 'Bronze';
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
                            Visualize seus Top Clientes e seus pontos.
                        </Text>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <Card surface="base" padding="lg">
                            <Text size="sm" color="tertiary">Total de Clientes Fidelizados</Text>
                            <Text size="2xl" weight="bold">{cards.length}</Text>
                        </Card>
                        <Card surface="base" padding="lg">
                            <Text size="sm" color="tertiary">Pontos em Circulação</Text>
                            <Text size="2xl" weight="bold">
                                {cards.reduce((sum, c) => sum + (c.current_points || 0), 0).toFixed(0)}
                            </Text>
                        </Card>
                        <Card surface="base" padding="lg">
                            <Text size="sm" color="tertiary">Clientes VIP (Gold+)</Text>
                            <Text size="2xl" weight="bold">
                                {cards.filter(c => ['gold', 'platinum'].includes(c.current_tier)).length}
                            </Text>
                        </Card>
                    </div>

                    {/* Cards List */}
                    {loading ? (
                        <Card surface="base" padding="xl">
                            <Text size="sm" color="tertiary">Carregando dados...</Text>
                        </Card>
                    ) : cards.length === 0 ? (
                        <Card surface="base" padding="xl">
                            <Text size="sm" color="tertiary" style={{ textAlign: 'center' }}>
                                Nenhum cliente com pontos registrado ainda.
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
                                                    {card.customer?.full_name || 'Cliente'}
                                                </Text>
                                                <Badge
                                                    status={card.current_tier === 'platinum' ? 'ready' : card.current_tier === 'gold' ? 'warning' : 'neutral'}
                                                    label={`${getTierLabel(card.current_tier)} ★`}
                                                />
                                                <Text size="sm" color="tertiary">
                                                    {card.customer?.phone}
                                                </Text>
                                            </div>

                                            <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                                                <div>
                                                    <Text size="xs" color="tertiary">Pontos Atuais</Text>
                                                    <Text size="xl" weight="bold">{card.current_points || 0}</Text>
                                                </div>
                                                {card.created_at && (
                                                    <div>
                                                        <Text size="xs" color="tertiary">Cliente Desde</Text>
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
