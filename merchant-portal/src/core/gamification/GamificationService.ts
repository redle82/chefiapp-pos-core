/**
 * P6-8: Gamification Service
 * 
 * Serviço para gamificação de staff
 */

import { Logger } from '../logger';
import { supabase } from '../supabase';

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
    level: number;
    achievements: string[];
    rank: number;
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    points: number;
    level: number;
    rank: number;
}

class GamificationService {
    private achievements: Achievement[] = [
        { id: 'speed_demon', name: 'Demônio da Velocidade', description: 'Completou 10 pedidos em menos de 5 minutos', icon: '⚡', points: 100, category: 'speed' },
        { id: 'quality_master', name: 'Mestre da Qualidade', description: '100 pedidos sem reclamações', icon: '⭐', points: 150, category: 'quality' },
        { id: 'sales_champion', name: 'Campeão de Vendas', description: 'Vendeu €1000 em um dia', icon: '💰', points: 200, category: 'sales' },
        { id: 'team_player', name: 'Jogador de Equipe', description: 'Ajudou 5 colegas em um turno', icon: '🤝', points: 75, category: 'teamwork' },
        { id: 'innovator', name: 'Inovador', description: 'Sugeriu 3 melhorias implementadas', icon: '💡', points: 125, category: 'innovation' },
    ];

    /**
     * Award points to user
     */
    async awardPoints(userId: string, points: number, reason: string): Promise<void> {
        try {
            // Get current score
            const { data: currentScore } = await supabase
                .from('user_scores')
                .select('total_points, level')
                .eq('user_id', userId)
                .single();

            const newTotalPoints = (currentScore?.total_points || 0) + points;
            const newLevel = Math.floor(newTotalPoints / 1000) + 1; // Level up every 1000 points

            // Update score
            await supabase
                .from('user_scores')
                .upsert({
                    user_id: userId,
                    total_points: newTotalPoints,
                    level: newLevel,
                    last_updated: new Date().toISOString(),
                });

            // Log achievement
            Logger.info('Points awarded', { userId, points, reason, newTotalPoints, newLevel });
        } catch (err) {
            Logger.error('Failed to award points', err, { userId, points });
        }
    }

    /**
     * Check and award achievements
     */
    async checkAchievements(userId: string, stats: {
        ordersCompleted?: number;
        ordersWithoutComplaints?: number;
        dailySales?: number;
        colleaguesHelped?: number;
        suggestionsImplemented?: number;
    }): Promise<Achievement[]> {
        const newAchievements: Achievement[] = [];

        // Check each achievement
        for (const achievement of this.achievements) {
            let earned = false;

            switch (achievement.id) {
                case 'speed_demon':
                    earned = (stats.ordersCompleted || 0) >= 10;
                    break;
                case 'quality_master':
                    earned = (stats.ordersWithoutComplaints || 0) >= 100;
                    break;
                case 'sales_champion':
                    earned = (stats.dailySales || 0) >= 100000; // €1000 in cents
                    break;
                case 'team_player':
                    earned = (stats.colleaguesHelped || 0) >= 5;
                    break;
                case 'innovator':
                    earned = (stats.suggestionsImplemented || 0) >= 3;
                    break;
            }

            if (earned) {
                // Check if user already has this achievement
                const { data: existing } = await supabase
                    .from('user_achievements')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('achievement_id', achievement.id)
                    .single();

                if (!existing) {
                    // Award achievement
                    await supabase
                        .from('user_achievements')
                        .insert({
                            user_id: userId,
                            achievement_id: achievement.id,
                            earned_at: new Date().toISOString(),
                        });

                    // Award points
                    await this.awardPoints(userId, achievement.points, `Achievement: ${achievement.name}`);

                    newAchievements.push(achievement);
                }
            }
        }

        return newAchievements;
    }

    /**
     * Get user score
     */
    async getUserScore(userId: string): Promise<UserScore | null> {
        try {
            const { data: score } = await supabase
                .from('user_scores')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!score) return null;

            const { data: achievements } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', userId);

            // Get rank
            const { data: allScores } = await supabase
                .from('user_scores')
                .select('user_id, total_points')
                .order('total_points', { ascending: false });

            const rank = (allScores || []).findIndex(s => s.user_id === userId) + 1;

            return {
                userId: score.user_id,
                userName: score.user_name || 'User',
                totalPoints: score.total_points,
                level: score.level,
                achievements: (achievements || []).map(a => a.achievement_id),
                rank,
            };
        } catch (err) {
            Logger.error('Failed to get user score', err, { userId });
            return null;
        }
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
        try {
            const { data, error } = await supabase
                .from('user_scores')
                .select('user_id, user_name, total_points, level')
                .order('total_points', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return (data || []).map((score, index) => ({
                userId: score.user_id,
                userName: score.user_name || 'User',
                points: score.total_points,
                level: score.level,
                rank: index + 1,
            }));
        } catch (err) {
            Logger.error('Failed to get leaderboard', err);
            return [];
        }
    }
}

export const gamificationService = new GamificationService();
