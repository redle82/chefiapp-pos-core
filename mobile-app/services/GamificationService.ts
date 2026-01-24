/**
 * FASE 4: Gamification Service para Mobile App
 * 
 * Serviço para gamificação de staff (pontos, achievements, rankings)
 */

import { supabase } from './supabase';
import { logError } from './logging';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    category: 'speed' | 'quality' | 'sales' | 'teamwork' | 'innovation';
}

export interface UserScore {
    userId: string;
    userName: string;
    totalPoints: number;
    weeklyPoints: number;
    level: number;
    achievements: string[];
    rank: number;
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    points: number;
    weeklyPoints: number;
    level: number;
    rank: number;
}

// FASE 4: Achievements definidos conforme roadmap
const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_step',
        name: 'Primeiro Passo',
        description: 'Completar primeira tarefa',
        icon: '🎯',
        points: 10,
        category: 'speed'
    },
    {
        id: 'speed',
        name: 'Velocidade',
        description: 'Completar 10 tarefas em um turno',
        icon: '⚡',
        points: 50,
        category: 'speed'
    },
    {
        id: 'quality',
        name: 'Qualidade',
        description: '50 tarefas sem erro',
        icon: '⭐',
        points: 100,
        category: 'quality'
    },
    {
        id: 'sales',
        name: 'Vendas',
        description: 'Processar €100 em vendas',
        icon: '💰',
        points: 75,
        category: 'sales'
    },
    {
        id: 'team',
        name: 'Equipe',
        description: 'Ajudar 5 colegas',
        icon: '🤝',
        points: 25,
        category: 'teamwork'
    },
];

class GamificationService {
    private restaurantId: string | null = null;

    /**
     * Inicializar serviço com restaurant ID
     */
    setRestaurantId(restaurantId: string) {
        this.restaurantId = restaurantId;
    }

    /**
     * Atribuir pontos a um usuário
     */
    async awardPoints(userId: string, points: number, reason: string, actionType?: string): Promise<void> {
        if (!this.restaurantId) {
            console.warn('[GamificationService] Restaurant ID not set');
            return;
        }

        try {
            // Buscar score atual
            const { data: currentScore, error: fetchError } = await supabase
                .from('user_scores')
                .select('total_points, weekly_points, level')
                .eq('user_id', userId)
                .eq('restaurant_id', this.restaurantId)
                .single();

            const newTotalPoints = (currentScore?.total_points || 0) + points;
            const newWeeklyPoints = (currentScore?.weekly_points || 0) + points;
            const newLevel = Math.floor(newTotalPoints / 1000) + 1; // Level up every 1000 points

            // Atualizar ou criar score
            const { error: upsertError } = await supabase
                .from('user_scores')
                .upsert({
                    user_id: userId,
                    restaurant_id: this.restaurantId,
                    total_points: newTotalPoints,
                    weekly_points: newWeeklyPoints,
                    level: newLevel,
                    last_updated: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,restaurant_id'
                });

            if (upsertError) throw upsertError;

            // Registrar transação
            const { error: transactionError } = await supabase
                .from('point_transactions')
                .insert({
                    user_id: userId,
                    restaurant_id: this.restaurantId,
                    points,
                    reason,
                    action_type: actionType,
                });

            if (transactionError) {
                console.warn('[GamificationService] Failed to log transaction:', transactionError);
            }

            console.log('[GamificationService] Points awarded', { userId, points, reason, newTotalPoints, newLevel });
        } catch (err) {
            const errorMessage = typeof err === 'object' ? JSON.stringify(err) : String(err);
            const error = err instanceof Error ? err : new Error(errorMessage);
            logError(error, { userId, points, reason, actionType, rawError: errorMessage });
            console.error('[GamificationService] Failed to award points:', err);
        }
    }

    /**
     * Verificar e atribuir achievements
     */
    async checkAchievements(userId: string, stats: {
        tasksCompleted?: number;
        tasksCompletedThisShift?: number;
        tasksWithoutError?: number;
        totalSalesCents?: number;
        colleaguesHelped?: number;
    }): Promise<Achievement[]> {
        if (!this.restaurantId) {
            console.warn('[GamificationService] Restaurant ID not set');
            return [];
        }

        const newAchievements: Achievement[] = [];

        try {
            // Buscar achievements já desbloqueados
            const { data: existingAchievements } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', userId)
                .eq('restaurant_id', this.restaurantId);

            const unlockedIds = new Set((existingAchievements || []).map(a => a.achievement_id));

            // Verificar cada achievement
            for (const achievement of ACHIEVEMENTS) {
                if (unlockedIds.has(achievement.id)) continue; // Já desbloqueado

                let earned = false;

                switch (achievement.id) {
                    case 'first_step':
                        earned = (stats.tasksCompleted || 0) >= 1;
                        break;
                    case 'speed':
                        earned = (stats.tasksCompletedThisShift || 0) >= 10;
                        break;
                    case 'quality':
                        earned = (stats.tasksWithoutError || 0) >= 50;
                        break;
                    case 'sales':
                        earned = (stats.totalSalesCents || 0) >= 10000; // €100 em centavos
                        break;
                    case 'team':
                        earned = (stats.colleaguesHelped || 0) >= 5;
                        break;
                }

                if (earned) {
                    // Atribuir achievement
                    const { error: insertError } = await supabase
                        .from('user_achievements')
                        .insert({
                            user_id: userId,
                            restaurant_id: this.restaurantId,
                            achievement_id: achievement.id,
                            earned_at: new Date().toISOString(),
                        });

                    if (insertError) {
                        console.warn('[GamificationService] Failed to insert achievement:', insertError);
                        continue;
                    }

                    // Atribuir pontos do achievement
                    await this.awardPoints(userId, achievement.points, `Achievement: ${achievement.name}`, 'achievement');

                    newAchievements.push(achievement);
                }
            }
        } catch (err) {
            const errorMessage = typeof err === 'object' ? JSON.stringify(err) : String(err);
            const error = err instanceof Error ? err : new Error(errorMessage);
            logError(error, { userId, stats, rawError: errorMessage });
            console.error('[GamificationService] Failed to check achievements:', err);
        }

        return newAchievements;
    }

    /**
     * Obter score do usuário
     */
    async getUserScore(userId: string): Promise<UserScore | null> {
        if (!this.restaurantId) {
            console.warn('[GamificationService] Restaurant ID not set');
            return null;
        }

        try {
            const { data: score, error: scoreError } = await supabase
                .from('user_scores')
                .select('*')
                .eq('user_id', userId)
                .eq('restaurant_id', this.restaurantId)
                .single();

            if (scoreError || !score) return null;

            const { data: achievements } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', userId)
                .eq('restaurant_id', this.restaurantId);

            // Calcular rank
            const { data: allScores } = await supabase
                .from('user_scores')
                .select('user_id, total_points')
                .eq('restaurant_id', this.restaurantId)
                .order('total_points', { ascending: false });

            const rank = (allScores || []).findIndex(s => s.user_id === userId) + 1;

            return {
                userId: score.user_id,
                userName: score.user_name || 'User',
                totalPoints: score.total_points,
                weeklyPoints: score.weekly_points,
                level: score.level,
                achievements: (achievements || []).map(a => a.achievement_id),
                rank,
            };
        } catch (err) {
            const errorMessage = typeof err === 'object' ? JSON.stringify(err) : String(err);
            const error = err instanceof Error ? err : new Error(errorMessage);
            logError(error, { userId, rawError: errorMessage });
            return null;
        }
    }

    /**
     * Obter leaderboard (top 10 semanal)
     */
    async getLeaderboard(limit: number = 10, weekly: boolean = true): Promise<LeaderboardEntry[]> {
        if (!this.restaurantId) {
            console.warn('[GamificationService] Restaurant ID not set');
            return [];
        }

        try {
            const orderBy = weekly ? 'weekly_points' : 'total_points';
            const { data, error } = await supabase
                .from('user_scores')
                .select('user_id, user_name, total_points, weekly_points, level')
                .eq('restaurant_id', this.restaurantId)
                .order(orderBy, { ascending: false })
                .limit(limit);

            if (error) throw error;

            return (data || []).map((score, index) => ({
                userId: score.user_id,
                userName: score.user_name || 'User',
                points: score.total_points,
                weeklyPoints: score.weekly_points,
                level: score.level,
                rank: index + 1,
            }));
        } catch (err) {
            const errorMessage = typeof err === 'object' ? JSON.stringify(err) : String(err);
            const error = err instanceof Error ? err : new Error(errorMessage);
            logError(error, { limit, weekly, rawError: errorMessage });
            console.error('[GamificationService] getLeaderboard error:', errorMessage);
            return [];
        }
    }

    /**
     * Obter todos os achievements disponíveis
     */
    getAchievements(): Achievement[] {
        return ACHIEVEMENTS;
    }
}

export const gamificationService = new GamificationService();
