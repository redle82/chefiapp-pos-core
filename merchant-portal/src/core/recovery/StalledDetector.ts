/**
 * Stalled restaurant detection.
 * Classifies restaurants by inactivity duration.
 */

export type StalledLevel = "active" | "nudge" | "stalled" | "abandoned";

export interface StalledStatus {
  level: StalledLevel;
  isStalled: boolean;
  inactiveDurationMs: number;
  inactiveDurationHours: number;
  suggestedAction: string;
}

export interface StalledInput {
  lastActivityAt: number; // timestamp ms
  setupProgress: number; // 0-100
  isOperational: boolean;
}

// Thresholds in hours
const NUDGE_THRESHOLD_HOURS = 24;
const STALLED_THRESHOLD_HOURS = 72;
const ABANDONED_THRESHOLD_HOURS = 168; // 7 days

/**
 * Detect if a restaurant is stalled based on inactivity.
 * Only applies to non-operational restaurants.
 */
export function detectStalled(input: StalledInput): StalledStatus {
  // Operational restaurants are never stalled
  if (input.isOperational) {
    return {
      level: "active",
      isStalled: false,
      inactiveDurationMs: 0,
      inactiveDurationHours: 0,
      suggestedAction: "none",
    };
  }

  const now = Date.now();
  const inactiveDurationMs = now - input.lastActivityAt;
  const inactiveDurationHours = inactiveDurationMs / (1000 * 60 * 60);

  if (inactiveDurationHours >= ABANDONED_THRESHOLD_HOURS) {
    return {
      level: "abandoned",
      isStalled: true,
      inactiveDurationMs,
      inactiveDurationHours: Math.round(inactiveDurationHours),
      suggestedAction: `Restaurante abandonado (${Math.round(inactiveDurationHours / 24)} dias sem actividade). Considere contactar o cliente.`,
    };
  }

  if (inactiveDurationHours >= STALLED_THRESHOLD_HOURS) {
    return {
      level: "stalled",
      isStalled: true,
      inactiveDurationMs,
      inactiveDurationHours: Math.round(inactiveDurationHours),
      suggestedAction: `Restaurante parado ha ${Math.round(inactiveDurationHours / 24)} dias. Setup a ${input.setupProgress}%.`,
    };
  }

  if (inactiveDurationHours >= NUDGE_THRESHOLD_HOURS) {
    return {
      level: "nudge",
      isStalled: false,
      inactiveDurationMs,
      inactiveDurationHours: Math.round(inactiveDurationHours),
      suggestedAction: `Sem actividade ha ${Math.round(inactiveDurationHours)} horas. Enviar lembrete.`,
    };
  }

  return {
    level: "active",
    isStalled: false,
    inactiveDurationMs,
    inactiveDurationHours: Math.round(inactiveDurationHours),
    suggestedAction: "none",
  };
}

/**
 * Get a human-readable label for the stalled level.
 */
export function getStalledLabel(level: StalledLevel): string {
  const labels: Record<StalledLevel, string> = {
    active: "Activo",
    nudge: "Inactivo",
    stalled: "Parado",
    abandoned: "Abandonado",
  };
  return labels[level];
}
