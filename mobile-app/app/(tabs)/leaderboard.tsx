/**
 * LeaderboardScreen - Ranking de Pontos
 * 
 * FASE 4 - Gamificação Interna
 * 
 * Mostra top 10 da equipe (semanal)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { gamificationService, LeaderboardEntry, UserScore } from '@/services/GamificationService';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';
import { useAppStaff } from '@/context/AppStaffContext';
import { useOrder } from '@/context/OrderContext';

export default function LeaderboardScreen() {
    const { activeRestaurant } = useRestaurant();
    const { session } = useAuth();
    const { operationalContext } = useAppStaff();
    // Usar restaurantId do OrderContext como fallback
    const restaurantId = activeRestaurant?.id || operationalContext.businessId;
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userScore, setUserScore] = useState<UserScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [weekly, setWeekly] = useState(true); // Toggle semanal/total

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

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isCurrentUser = item.userId === session?.user?.id;
        return (
            <View style={[
                styles.leaderboardItem,
                isCurrentUser && styles.currentUserItem
            ]}>
                <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{renderRankIcon(item.rank)}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                        {item.userName}
                    </Text>
                    <Text style={styles.levelText}>Nível {item.level}</Text>
                </View>
                <View style={styles.pointsContainer}>
                    <Text style={[styles.pointsText, isCurrentUser && styles.currentUserPoints]}>
                        {weekly ? item.weeklyPoints : item.points}
                    </Text>
                    <Text style={styles.pointsLabel}>pontos</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d4a574" />
                    <Text style={styles.loadingText}>Carregando ranking...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏆 Ranking</Text>
                <View style={styles.toggleContainer}>
                    <Text
                        style={[styles.toggleButton, weekly && styles.toggleButtonActive]}
                        onPress={() => setWeekly(true)}
                    >
                        Semanal
                    </Text>
                    <Text
                        style={[styles.toggleButton, !weekly && styles.toggleButtonActive]}
                        onPress={() => setWeekly(false)}
                    >
                        Total
                    </Text>
                </View>
            </View>

            {userScore && (
                <View style={styles.userScoreCard}>
                    <Text style={styles.userScoreTitle}>Sua Pontuação</Text>
                    <View style={styles.userScoreRow}>
                        <View style={styles.userScoreItem}>
                            <Text style={styles.userScoreValue}>{weekly ? userScore.weeklyPoints : userScore.totalPoints}</Text>
                            <Text style={styles.userScoreLabel}>Pontos</Text>
                        </View>
                        <View style={styles.userScoreItem}>
                            <Text style={styles.userScoreValue}>#{userScore.rank}</Text>
                            <Text style={styles.userScoreLabel}>Posição</Text>
                        </View>
                        <View style={styles.userScoreItem}>
                            <Text style={styles.userScoreValue}>Nível {userScore.level}</Text>
                            <Text style={styles.userScoreLabel}>Nível</Text>
                        </View>
                    </View>
                </View>
            )}

            <FlatList
                data={leaderboard}
                renderItem={renderItem}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum ranking disponível ainda</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    toggleButtonActive: {
        backgroundColor: '#d4a574',
        color: '#0a0a0a',
    },
    userScoreCard: {
        margin: 20,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d4a574',
    },
    userScoreTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#d4a574',
        marginBottom: 12,
    },
    userScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    userScoreItem: {
        alignItems: 'center',
    },
    userScoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    userScoreLabel: {
        fontSize: 12,
        color: '#888',
    },
    listContent: {
        padding: 20,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    currentUserItem: {
        borderWidth: 2,
        borderColor: '#d4a574',
        backgroundColor: '#2a1a0a',
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    currentUserName: {
        color: '#d4a574',
    },
    levelText: {
        fontSize: 12,
        color: '#888',
    },
    pointsContainer: {
        alignItems: 'flex-end',
    },
    pointsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    currentUserPoints: {
        color: '#d4a574',
    },
    pointsLabel: {
        fontSize: 12,
        color: '#888',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#888',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});
