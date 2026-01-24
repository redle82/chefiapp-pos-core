/**
 * AchievementsScreen - Conquistas
 * 
 * FASE 4 - Gamificação Interna
 * 
 * Mostra achievements desbloqueados e disponíveis
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { gamificationService, Achievement, UserScore } from '@/services/GamificationService';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';
import { useAppStaff } from '@/context/AppStaffContext';

export default function AchievementsScreen() {
    const { activeRestaurant } = useRestaurant();
    const { session } = useAuth();
    const { operationalContext } = useAppStaff();
    // Usar restaurantId do contexto como fallback
    const restaurantId = activeRestaurant?.id || operationalContext.businessId;
    const [userScore, setUserScore] = useState<UserScore | null>(null);
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (restaurantId) {
            gamificationService.setRestaurantId(restaurantId);
            loadData();
        }
    }, [restaurantId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [scoreData, achievements] = await Promise.all([
                session?.user?.id ? gamificationService.getUserScore(session.user.id) : Promise.resolve(null),
                Promise.resolve(gamificationService.getAchievements()),
            ]);
            setUserScore(scoreData);
            setAllAchievements(achievements);
        } catch (error) {
            console.error('[AchievementsScreen] Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const isUnlocked = (achievementId: string): boolean => {
        return userScore?.achievements.includes(achievementId) || false;
    };

    const renderAchievement = (achievement: Achievement) => {
        const unlocked = isUnlocked(achievement.id);
        return (
            <View style={[
                styles.achievementCard,
                unlocked && styles.achievementCardUnlocked
            ]}>
                <View style={styles.achievementIcon}>
                    <Text style={styles.achievementIconText}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementName, unlocked && styles.achievementNameUnlocked]}>
                        {achievement.name}
                    </Text>
                    <Text style={styles.achievementDescription}>
                        {achievement.description}
                    </Text>
                    <View style={styles.achievementFooter}>
                        <Text style={styles.achievementPoints}>
                            {achievement.points} pontos
                        </Text>
                        {unlocked && (
                            <Text style={styles.unlockedBadge}>✓ Desbloqueado</Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d4a574" />
                    <Text style={styles.loadingText}>Carregando conquistas...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const unlockedCount = userScore?.achievements.length || 0;
    const totalCount = allAchievements.length;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏅 Conquistas</Text>
                <Text style={styles.subtitle}>
                    {unlockedCount} de {totalCount} desbloqueadas
                </Text>
            </View>

            {userScore && (
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{userScore.totalPoints}</Text>
                        <Text style={styles.statLabel}>Pontos Totais</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>Nível {userScore.level}</Text>
                        <Text style={styles.statLabel}>Nível</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>#{userScore.rank}</Text>
                        <Text style={styles.statLabel}>Ranking</Text>
                    </View>
                </View>
            )}

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {allAchievements.map((achievement) => (
                    <View key={achievement.id}>
                        {renderAchievement(achievement)}
                    </View>
                ))}
            </ScrollView>
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        margin: 20,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#d4a574',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    achievementCard: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        opacity: 0.6,
    },
    achievementCardUnlocked: {
        opacity: 1,
        borderWidth: 2,
        borderColor: '#d4a574',
        backgroundColor: '#2a1a0a',
    },
    achievementIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    achievementIconText: {
        fontSize: 32,
    },
    achievementInfo: {
        flex: 1,
    },
    achievementName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    achievementNameUnlocked: {
        color: '#fff',
    },
    achievementDescription: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    achievementFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    achievementPoints: {
        fontSize: 12,
        color: '#d4a574',
        fontWeight: '600',
    },
    unlockedBadge: {
        fontSize: 12,
        color: '#32d74b',
        fontWeight: '600',
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
});
