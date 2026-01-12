/**
 * P6-8: Gamification Panel Component
 * 
 * Componente para exibir gamificação de staff
 */

import React, { useState, useEffect } from 'react';
import { gamificationService, type UserScore, type LeaderboardEntry } from '../../../core/gamification/GamificationService';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Badge } from '../../../ui/design-system/primitives/Badge';

export const GamificationPanel: React.FC = () => {
    const [userScore, setUserScore] = useState<UserScore | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const userId = getTabIsolated('chefiapp_user_id');
        if (!userId) return;

        setLoading(true);
        try {
            const score = await gamificationService.getUserScore(userId);
            const board = await gamificationService.getLeaderboard(10);
            setUserScore(score);
            setLeaderboard(board);
        } catch (err) {
            console.error('[GamificationPanel] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Card surface="layer1" padding="lg"><Text>Carregando...</Text></Card>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User Score */}
            {userScore && (
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>🏆 Seu Score</Text>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <div>
                            <Text size="2xl" weight="bold">{userScore.totalPoints}</Text>
                            <Text size="sm" color="tertiary">Pontos</Text>
                        </div>
                        <div>
                            <Text size="xl" weight="bold">Nível {userScore.level}</Text>
                            <Text size="sm" color="tertiary">Rank #{userScore.rank}</Text>
                        </div>
                        <div>
                            <Text size="sm" weight="bold">Conquistas: {userScore.achievements.length}</Text>
                        </div>
                    </div>
                </Card>
            )}

            {/* Leaderboard */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>📊 Ranking</Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {leaderboard.map(entry => (
                        <div key={entry.userId} style={{ 
                            padding: 12, 
                            background: entry.rank <= 3 ? '#fff3cd' : '#f5f5f5', 
                            borderRadius: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <Text size="sm" weight="bold">#{entry.rank}</Text>
                                <Text size="sm">{entry.userName}</Text>
                                <Badge label={`Nível ${entry.level}`} size="xs" status="ready" />
                            </div>
                            <Text size="sm" weight="bold">{entry.points} pts</Text>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
