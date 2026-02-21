/**
 * Core Health Types
 *
 * Shared type definitions for the health monitoring subsystem.
 */

export type CoreHealthLevel = "healthy" | "degraded" | "critical";

export interface CoreHealthStatus {
  level: CoreHealthLevel;
  score: number; // 0-100
  issues: string[];
  lastCheckedAt: Date;
}

export interface HealthCheckResult {
  name: string;
  status: CoreHealthLevel;
  message?: string;
  duration?: number;
}
