/**
 * LeaderboardScreen - Ranking de Pontos
 *
 * FASE 4 - Gamificação Interna
 * UI/UX moderna: segmented pill, empty state, tokens visuais.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    Pressable,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, radius, spacing } from '@/constants/designTokens';
import { gamificationService, LeaderboardEntry, UserScore } from '@/services/GamificationService';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';
import { useAppStaff } from '@/context/AppStaffContext';

export default function LeaderboardScreen() {
    const { activeRestaurant } = useRestaurant();
    const { session } = useAuth();
    const { operationalContext } = useAppStaff();
    const restaurantId = activeRestaurant?.id || operationalContext.businessId;
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userScore, setUserScore] = useState<UserScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [weekly, setWeekly] = useState(true);

    useEffect(() => {
        if (restaurantId) {
            gamificationService.setRestaurantId(restaurantId);
            loadData();
        }
    }, [restaurantId, weekly]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leaderboardData, scoreData] = await Promise.all([
                gamificationService.getLeaderboard(10, weekly),
                session?.user?.id ? gamificationService.getUserScore(session.user.id) : Promise.resolve(null),
            ]);
            setLeaderboard(leaderboardData);
            setUserScore(scoreData);
        } catch (error) {
            console.error('[LeaderboardScreen] Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderRankIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const renderItem = ({ item }: { item: LeaderboardEntry }) => {
        const isCurrentUser = item.userId === session?.user?.id;
        return (
            <View style={[styles.card, isCurrentUser && styles.cardHighlight]}>
                <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{renderRankIcon(item.rank)}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, isCurrentUser && styles.userNameHighlight]}>
                        {item.userName}
                    </Text>
                    <Text style={styles.meta}>Nível {item.level}</Text>
                </View>
                <View style={styles.pointsWrap}>
                    <Text style={[styles.points, isCurrentUser && styles.pointsHighlight]}>
                        {weekly ? item.weeklyPoints : item.points}
                    </Text>
                    <Text style={styles.pointsSuffix}>pts</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={styles.loadingLabel}>Carregando ranking...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.segmented}>
                    <Pressable
                        style={[styles.segmentedOption, weekly && styles.segmentedOptionActive]}
                        onPress={() => setWeekly(true)}
                    >
                        <Text style={[styles.segmentedLabel, weekly && styles.segmentedLabelActive]}>
                            Semanal
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segmentedOption, !weekly && styles.segmentedOptionActive]}
                        onPress={() => setWeekly(false)}
                    >
                        <Text style={[styles.segmentedLabel, !weekly && styles.segmentedLabelActive]}>
                            Total
                        </Text>
                    </Pressable>
                </View>
            </View>

            {userScore && (
                <View style={styles.myScoreCard}>
                    <Text style={styles.myScoreTitle}>Sua pontuação</Text>
                    <View style={styles.myScoreRow}>
                        <View style={styles.myScoreCol}>
                            <Text style={styles.myScoreValue}>
                                {weekly ? userScore.weeklyPoints : userScore.totalPoints}
                            </Text>
                            <Text style={styles.myScoreMeta}>Pontos</Text>
                        </View>
                        <View style={styles.myScoreCol}>
                            <Text style={styles.myScoreValue}>#{userScore.rank}</Text>
                            <Text style={styles.myScoreMeta}>Posição</Text>
                        </View>
                        <View style={styles.myScoreCol}>
                            <Text style={styles.myScoreValue}>Nível {userScore.level}</Text>
                            <Text style={styles.myScoreMeta}>Nível</Text>
                        </View>
                    </View>
                </View>
            )}

            <FlatList
                data={leaderboard}
                renderItem={renderItem}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconWrap}>
                            <FontAwesome name="trophy" size={40} color={colors.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>Nenhum ranking disponível</Text>
                        <Text style={styles.emptySubtitle}>
                            Complete tarefas para subir no ranking
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing[6],
        paddingTop: spacing[3],
        paddingBottom: spacing[4],
    },
    segmented: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceOverlay,
        borderRadius: radius.full,
        padding: 4,
    },
    segmentedOption: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: spacing[4],
        borderRadius: radius.full,
        alignItems: 'center',
    },
    segmentedOptionActive: {
        backgroundColor: colors.accent,
    },
    segmentedLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    segmentedLabelActive: {
        color: colors.textInverse,
    },
    myScoreCard: {
        marginHorizontal: spacing[6],
        marginBottom: spacing[4],
        padding: spacing[4],
        backgroundColor: colors.surfaceOverlay,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: `${colors.accent}33`,
    },
    myScoreTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.accent,
        marginBottom: spacing[3],
    },
    myScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    myScoreCol: { alignItems: 'center' },
    myScoreValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    myScoreMeta: {
        fontSize: 12,
        color: colors.textMuted,
    },
    list: {
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[6],
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        marginBottom: spacing[3],
        backgroundColor: colors.surfaceOverlay,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHighlight: {
        borderColor: `${colors.accent}33`,
        backgroundColor: `${colors.accent}20`,
    },
    rankBadge: { width: 48, alignItems: 'center' },
    rankText: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    userInfo: { flex: 1, marginLeft: spacing[4] },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    userNameHighlight: { color: colors.accent },
    meta: { fontSize: 13, color: colors.textMuted },
    pointsWrap: { alignItems: 'flex-end' },
    points: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    pointsHighlight: { color: colors.accent },
    pointsSuffix: { fontSize: 12, color: colors.textMuted },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingLabel: {
        marginTop: spacing[4],
        fontSize: 15,
        color: colors.textSecondary,
    },
    empty: {
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surfaceOverlay,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    emptySubtitle: { fontSize: 14, color: colors.textMuted },
});
