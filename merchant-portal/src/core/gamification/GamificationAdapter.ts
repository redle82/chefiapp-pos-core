/**
 * GamificationAdapter — Docker Core persistence for gamification
 *
 * Replaces the legacy Supabase-based GamificationService.
 * XP multiplier logic is delegated to core-engine/pulse/GamificationService (pure).
 * Persistence operations use Docker Core (PostgREST) via dockerCoreClient.
 *
 * Architecture:
 *   core-engine/pulse/GamificationService → pure XP calculations (source of truth)
 *   GamificationAdapter → persistence + orchestration (this file)
 *   GamificationPanel/SessionXPWidget → UI consumers
 */

import {
  BASE_XP_PER_TASK,
  calculateXpMultiplier,
  createEmptyAccumulator,
  recordPulseReading,
  recordTaskCompletion,
  type XpAccumulator,
} from "../../../../core-engine/pulse/GamificationService";
import type { PulseZone } from "../../../../core-engine/pulse/PulseState";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";
import type { Achievement, LeaderboardEntry, UserScore } from "./types";

// ─── DB Row shapes (Docker Core / PostgREST) ────────────

/** Row shape returned by `user_scores` table. */
interface DbScoreRow {
  user_id: string;
  restaurant_id: string;
  user_name?: string;
  total_points: number;
  weekly_points?: number;
  level: number;
  last_updated?: string;
}

/** Row shape returned by `user_achievements` table. */
interface DbAchievementRow {
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

// ─── Achievement Registry (UI metadata) ─────────────────

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_flow_alto",
    name: "Primeiro Pico",
    description: "Completou a primeira tarefa em FLOW_ALTO",
    icon: "🔥",
    points: 10,
    category: "speed",
  },
  {
    id: "streak_5",
    name: "Ritmo Quente",
    description: "5 leituras consecutivas em FLOW_ALTO",
    icon: "⚡",
    points: 50,
    category: "speed",
  },
  {
    id: "streak_10",
    name: "Máquina de Pedidos",
    description: "10 leituras consecutivas em FLOW_ALTO",
    icon: "🚀",
    points: 100,
    category: "speed",
  },
  {
    id: "tasks_10",
    name: "Dez na Conta",
    description: "10 tarefas completadas no turno",
    icon: "🎯",
    points: 25,
    category: "quality",
  },
  {
    id: "tasks_25",
    name: "Velocista",
    description: "25 tarefas completadas no turno",
    icon: "💨",
    points: 75,
    category: "speed",
  },
  {
    id: "xp_100",
    name: "Centurião",
    description: "100 XP efetivo acumulado no turno",
    icon: "🏆",
    points: 100,
    category: "quality",
  },
  {
    id: "speed_demon",
    name: "Demônio da Velocidade",
    description: "Completou 10 pedidos em menos de 5 minutos",
    icon: "⚡",
    points: 100,
    category: "speed",
  },
  {
    id: "quality_master",
    name: "Mestre da Qualidade",
    description: "100 pedidos sem reclamações",
    icon: "⭐",
    points: 150,
    category: "quality",
  },
  {
    id: "team_player",
    name: "Jogador de Equipe",
    description: "Ajudou 5 colegas em um turno",
    icon: "🤝",
    points: 75,
    category: "teamwork",
  },
  {
    id: "innovator",
    name: "Inovador",
    description: "Sugeriu 3 melhorias implementadas",
    icon: "💡",
    points: 125,
    category: "innovation",
  },
];

// ─── Service Class ──────────────────────────────────────

class GamificationAdapter {
  private restaurantId: string | null = null;
  private accumulator: XpAccumulator = createEmptyAccumulator();

  // ── Setup ───────────────────────────────────────────

  setRestaurantId(restaurantId: string): void {
    this.restaurantId = restaurantId;
  }

  /** Reset shift accumulator (call at shift start). */
  resetAccumulator(): void {
    this.accumulator = createEmptyAccumulator();
  }

  /** Get current shift XP accumulator (for SessionXPWidget). */
  getAccumulator(): XpAccumulator {
    return this.accumulator;
  }

  // ── Pure Core-Engine Delegates ──────────────────────

  /**
   * Record a task completion using core-engine pure logic.
   * Updates local accumulator and persists points to Docker Core.
   */
  async recordTask(
    userId: string,
    zone: PulseZone,
    xpPerTask: number = BASE_XP_PER_TASK,
  ): Promise<XpAccumulator> {
    const prev = this.accumulator;
    this.accumulator = recordTaskCompletion(prev, zone, xpPerTask);

    // Persist XP delta
    const xpDelta = this.accumulator.effectiveXp - prev.effectiveXp;
    if (xpDelta > 0) {
      await this.awardPoints(userId, Math.round(xpDelta), `task:${zone}`);
    }

    // Persist any new achievements
    const newAchievements = this.accumulator.achievements.filter(
      (a: string) => !prev.achievements.includes(a),
    );
    for (const achievementKey of newAchievements) {
      await this.persistAchievement(userId, achievementKey);
    }

    return this.accumulator;
  }

  /**
   * Record a pulse reading (no task, just streak tracking).
   */
  recordPulse(zone: PulseZone): XpAccumulator {
    this.accumulator = recordPulseReading(this.accumulator, zone);
    return this.accumulator;
  }

  /**
   * Get XP multiplier for current state (for UI display).
   */
  getMultiplier(zone: PulseZone) {
    return calculateXpMultiplier(zone, this.accumulator.altoStreak);
  }

  // ── Docker Core Persistence ─────────────────────────

  /**
   * Award points and persist to Docker Core.
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    actionType?: string,
  ): Promise<void> {
    if (!this.restaurantId) {
      Logger.warn("[GamificationAdapter] Restaurant ID not set");
      return;
    }

    try {
      // Fetch current score
      const { data: rawScore } = await dockerCoreClient
        .from("user_scores")
        .select("total_points, weekly_points, level")
        .eq("user_id", userId)
        .eq("restaurant_id", this.restaurantId)
        .single();

      const currentScore = rawScore as DbScoreRow | null;
      const newTotalPoints = (currentScore?.total_points ?? 0) + points;
      const newWeeklyPoints = (currentScore?.weekly_points ?? 0) + points;
      const newLevel = Math.floor(newTotalPoints / 1000) + 1;

      // Upsert score
      const { error: upsertError } = await dockerCoreClient
        .from("user_scores")
        .upsert(
          {
            user_id: userId,
            restaurant_id: this.restaurantId,
            total_points: newTotalPoints,
            weekly_points: newWeeklyPoints,
            level: newLevel,
            last_updated: new Date().toISOString(),
          },
          { onConflict: "user_id,restaurant_id" },
        );

      if (upsertError) throw upsertError;

      // Log transaction
      const { error: txError } = await dockerCoreClient
        .from("point_transactions")
        .insert({
          user_id: userId,
          restaurant_id: this.restaurantId,
          points,
          reason,
          action_type: actionType ?? reason.split(":")[0],
        });

      if (txError) {
        Logger.warn("[GamificationAdapter] Failed to log transaction", {
          error: txError,
        });
      }

      Logger.info("[GamificationAdapter] Points awarded", {
        userId,
        points,
        reason,
        newTotalPoints,
        newLevel,
      });
    } catch (err) {
      Logger.error("[GamificationAdapter] Failed to award points", err, {
        userId,
        points,
      });
    }
  }

  /**
   * Persist a newly unlocked achievement.
   */
  private async persistAchievement(
    userId: string,
    achievementKey: string,
  ): Promise<void> {
    if (!this.restaurantId) return;

    try {
      const { error } = await dockerCoreClient
        .from("user_achievements")
        .insert({
          user_id: userId,
          restaurant_id: this.restaurantId,
          achievement_id: achievementKey,
          earned_at: new Date().toISOString(),
        });

      if (error) {
        // May be duplicate — acceptable
        Logger.warn("[GamificationAdapter] Achievement insert issue", {
          achievementKey,
          error,
        });
      }

      // Award bonus points for the achievement
      const meta = ACHIEVEMENTS.find((a) => a.id === achievementKey);
      if (meta) {
        await this.awardPoints(
          userId,
          meta.points,
          `achievement:${meta.name}`,
          "achievement",
        );
      }
    } catch (err) {
      Logger.error("[GamificationAdapter] persistAchievement failed", err, {
        achievementKey,
      });
    }
  }

  // ── Queries ─────────────────────────────────────────

  /**
   * Get user score from Docker Core.
   */
  async getUserScore(userId: string): Promise<UserScore | null> {
    if (!this.restaurantId) {
      Logger.warn("[GamificationAdapter] Restaurant ID not set");
      return null;
    }

    try {
      const { data: rawScore, error: scoreError } = await dockerCoreClient
        .from("user_scores")
        .select("*")
        .eq("user_id", userId)
        .eq("restaurant_id", this.restaurantId)
        .single();

      if (scoreError || !rawScore) return null;
      const score = rawScore as unknown as DbScoreRow;

      const { data: rawAchievements } = await dockerCoreClient
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId)
        .eq("restaurant_id", this.restaurantId);

      const achievements = (rawAchievements ??
        []) as unknown as DbAchievementRow[];

      // Calculate rank
      const { data: rawAllScores } = await dockerCoreClient
        .from("user_scores")
        .select("user_id, total_points")
        .eq("restaurant_id", this.restaurantId)
        .order("total_points", { ascending: false });

      const allScores = (rawAllScores ?? []) as unknown as DbScoreRow[];
      const rank = allScores.findIndex((s) => s.user_id === userId) + 1;

      return {
        userId: score.user_id,
        userName: score.user_name ?? "User",
        totalPoints: score.total_points,
        weeklyPoints: score.weekly_points ?? 0,
        level: score.level,
        achievements: achievements.map((a) => a.achievement_id),
        rank,
      };
    } catch (err) {
      Logger.error("[GamificationAdapter] getUserScore failed", err, {
        userId,
      });
      return null;
    }
  }

  /**
   * Get leaderboard from Docker Core.
   */
  async getLeaderboard(
    limit: number = 10,
    weekly: boolean = false,
  ): Promise<LeaderboardEntry[]> {
    if (!this.restaurantId) {
      Logger.warn("[GamificationAdapter] Restaurant ID not set");
      return [];
    }

    try {
      const orderBy = weekly ? "weekly_points" : "total_points";
      const { data, error } = await dockerCoreClient
        .from("user_scores")
        .select("user_id, user_name, total_points, weekly_points, level")
        .eq("restaurant_id", this.restaurantId)
        .order(orderBy, { ascending: false })
        .limit(limit);

      if (error) throw error;

      const scores = (data ?? []) as unknown as DbScoreRow[];
      return scores.map((score, index) => ({
        userId: score.user_id,
        userName: score.user_name ?? "User",
        points: score.total_points,
        weeklyPoints: score.weekly_points ?? 0,
        level: score.level,
        rank: index + 1,
      }));
    } catch (err) {
      Logger.error("[GamificationAdapter] getLeaderboard failed", err);
      return [];
    }
  }

  /**
   * Get all available achievements with UI metadata.
   */
  getAchievements(): Achievement[] {
    return ACHIEVEMENTS;
  }

  /**
   * Check and award achievements based on arbitrary stats
   * (legacy compat — prefer recordTask() for pulse-based achievements).
   */
  async checkAchievements(
    userId: string,
    stats: {
      tasksCompleted?: number;
      tasksWithoutError?: number;
      totalSalesCents?: number;
      colleaguesHelped?: number;
      suggestionsImplemented?: number;
    },
  ): Promise<Achievement[]> {
    if (!this.restaurantId) return [];

    const newAchievements: Achievement[] = [];

    try {
      // Fetch already-unlocked achievements
      const { data: existing } = await dockerCoreClient
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId)
        .eq("restaurant_id", this.restaurantId);

      const existingList = (existing ?? []) as unknown as DbAchievementRow[];
      const unlockedIds = new Set(existingList.map((a) => a.achievement_id));

      // Check stat-based achievements
      const checks: Array<{ id: string; earned: boolean }> = [
        {
          id: "speed_demon",
          earned: (stats.tasksCompleted ?? 0) >= 10,
        },
        {
          id: "quality_master",
          earned: (stats.tasksWithoutError ?? 0) >= 100,
        },
        {
          id: "team_player",
          earned: (stats.colleaguesHelped ?? 0) >= 5,
        },
        {
          id: "innovator",
          earned: (stats.suggestionsImplemented ?? 0) >= 3,
        },
      ];

      for (const { id, earned } of checks) {
        if (!earned || unlockedIds.has(id)) continue;
        await this.persistAchievement(userId, id);
        const meta = ACHIEVEMENTS.find((a) => a.id === id);
        if (meta) newAchievements.push(meta);
      }
    } catch (err) {
      Logger.error("[GamificationAdapter] checkAchievements failed", err);
    }

    return newAchievements;
  }
}

/** Singleton instance — replaces legacy gamificationService. */
export const gamificationService = new GamificationAdapter();
