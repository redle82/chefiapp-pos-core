/**
 * LoyaltyService - Serviço para gerenciar programa de fidelidade
 * 
 * FASE 3: Integração completa com TPV
 */

import { supabase } from '../supabase';
import { Decimal } from 'decimal.js';

export interface LoyaltyCard {
    id: string;
    restaurant_id: string;
    customer_id?: string;
    card_type: 'physical' | 'digital';
    current_tier: 'silver' | 'gold' | 'platinum';
    current_points: number;
    points_earned: number;
    points_redeemed: number;
    status: 'active' | 'suspended' | 'expired';
    created_at: string;
    tier_upgraded_at?: string;
    expires_at?: string;
}

export interface LoyaltyTierConfig {
    id: string;
    restaurant_id: string;
    points_per_euro: number;
    silver_threshold: number;
    gold_threshold: number;
    platinum_threshold: number;
}

export class LoyaltyService {
    /**
     * Buscar ou criar cartão de fidelidade
     */
    static async findOrCreateCard(
        restaurantId: string,
        customerId?: string,
        phone?: string,
        email?: string
    ): Promise<LoyaltyCard> {
        // Se tem customer_id, buscar cartão existente
        if (customerId) {
            const { data: existing } = await supabase
                .from('loyalty_cards')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('customer_id', customerId)
                .single();

            if (existing) return existing;
        }

        // Criar novo cartão
        const { data: newCard, error } = await supabase
            .from('loyalty_cards')
            .insert({
                restaurant_id: restaurantId,
                customer_id: customerId || null,
                card_type: 'digital',
                current_tier: 'silver',
                current_points: 0,
                points_earned: 0,
                points_redeemed: 0,
                status: 'active',
            })
            .select()
            .single();

        if (error) throw error;
        return newCard;
    }

    /**
     * Obter configuração de tiers
     */
    static async getTierConfig(restaurantId: string): Promise<LoyaltyTierConfig> {
        const { data, error } = await supabase
            .from('loyalty_tier_configs')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Criar config padrão se não existir
            const { data: defaultConfig } = await supabase
                .from('loyalty_tier_configs')
                .insert({
                    restaurant_id: restaurantId,
                    points_per_euro: 1.0,
                    silver_threshold: 0,
                    gold_threshold: 100,
                    platinum_threshold: 500,
                })
                .select()
                .single();

            return defaultConfig!;
        }

        if (error) throw error;
        return data!;
    }

    /**
     * Adicionar pontos após pedido
     */
    static async awardPointsForOrder(
        restaurantId: string,
        orderId: string,
        orderTotalCents: number,
        customerId?: string,
        phone?: string,
        email?: string
    ): Promise<{ pointsAwarded: number; newTotal: number; tier: string }> {
        // Buscar ou criar cartão
        const card = await this.findOrCreateCard(restaurantId, customerId, phone, email);

        // Obter config
        const config = await this.getTierConfig(restaurantId);

        // Calcular pontos (1 ponto por euro, arredondado)
        const orderTotalEuros = orderTotalCents / 100;
        const pointsEarned = Math.floor(orderTotalEuros * config.points_per_euro);

        // Atualizar pontos
        const newPoints = (card.current_points || 0) + pointsEarned;
        const newPointsEarned = (card.points_earned || 0) + pointsEarned;

        // Calcular novo tier
        const newTier = this.calculateTier(newPoints, config);
        const tierUpgraded = newTier !== card.current_tier;

        // Atualizar cartão
        const { error: updateError } = await supabase
            .from('loyalty_cards')
            .update({
                current_points: newPoints,
                points_earned: newPointsEarned,
                current_tier: newTier,
                tier_upgraded_at: tierUpgraded ? new Date().toISOString() : card.tier_upgraded_at,
                updated_at: new Date().toISOString(),
            })
            .eq('id', card.id);

        if (updateError) throw updateError;

        return {
            pointsAwarded: pointsEarned,
            newTotal: newPoints,
            tier: newTier,
        };
    }

    /**
     * Calcular tier baseado em pontos
     */
    private static calculateTier(points: number, config: LoyaltyTierConfig): 'silver' | 'gold' | 'platinum' {
        if (points >= config.platinum_threshold) return 'platinum';
        if (points >= config.gold_threshold) return 'gold';
        return 'silver';
    }

    /**
     * Obter cartão do cliente
     */
    static async getCustomerCard(
        restaurantId: string,
        customerId: string
    ): Promise<LoyaltyCard | null> {
        const { data, error } = await supabase
            .from('loyalty_cards')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('customer_id', customerId)
            .single();

        if (error && error.code === 'PGRST116') return null;
        if (error) throw error;
        return data;
    }
}
