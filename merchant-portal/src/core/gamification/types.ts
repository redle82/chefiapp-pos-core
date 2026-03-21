/**
 * Gamification Domain Types
 *
 * Unified type definitions for gamification across the platform.
 * Re-exports core-engine pure types and adds persistence-layer types.
 */

// Re-export pure types from core-engine
export type {
  Achievement as CoreAchievement,
  XpAccumulator,
  XpMultiplierResult,
} from "../../../../core-engine/pulse/GamificationService";

export type { PulseZone } from "../../../../core-engine/pulse/PulseState";

// ─── Persistence-layer types ────────────────────────────

/** A gamification achievement with UI metadata (icon, category, point value). */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: "speed" | "quality" | "sales" | "teamwork" | "innovation";
}

/** User score record as stored in the database. */
export interface UserScore {
  userId: string;
  userName: string;
  totalPoints: number;
  weeklyPoints: number;
  level: number;
  achievements: string[];
  rank: number;
}

/** Leaderboard entry for ranking display. */
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  points: number;
  weeklyPoints: number;
  level: number;
  rank: number;
}

/** Point transaction log entry. */
export interface PointTransaction {
  id: string;
  userId: string;
  restaurantId: string;
  points: number;
  reason: string;
  actionType?: string;
  createdAt: string;
}
