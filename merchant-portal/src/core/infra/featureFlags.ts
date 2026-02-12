/**
 * FEATURE FLAGS — GLOBAL CONTROL
 *
 * Enables/disables system capabilities without code changes.
 *
 * CRITICAL FLAGS:
 * - ENABLE_COGNITIVE_LAYER: Master switch for InsForge integration
 * - ENABLE_EVENT_BUS: Control event publishing
 * - ENABLE_AI_SUGGESTIONS: AI recommendations in UI
 *
 * USAGE:
 * if (!featureFlags.ENABLE_COGNITIVE_LAYER) return;
 */

export interface FeatureFlags {
  // ============================================================================
  // COGNITIVE LAYER
  // ============================================================================

  /**
   * Master switch for InsForge (Cognitive Backend)
   *
   * When FALSE:
   * - No events sent to InsForge
   * - No AI suggestions in UI
   * - No analytics queries to InsForge
   * - System runs on Core only (100% offline capable)
   *
   * When TRUE:
   * - Events published to InsForge
   * - AI features enabled
   * - Analytics enhanced
   */
  ENABLE_COGNITIVE_LAYER: boolean;

  /**
   * Controls event publishing to event bus
   *
   * When FALSE:
   * - Core operations continue normally
   * - No events published
   * - Zero cognitive layer interaction
   */
  ENABLE_EVENT_BUS: boolean;

  /**
   * Controls AI suggestions in UI
   *
   * When FALSE:
   * - UI hides AI suggestions
   * - No loading states for AI
   * - No network calls to cognitive layer
   */
  ENABLE_AI_SUGGESTIONS: boolean;

  /**
   * Controls analytics queries to InsForge
   *
   * When FALSE:
   * - Analytics use Docker Core only
   * - No enhanced insights
   * - Faster queries (local)
   */
  ENABLE_COGNITIVE_ANALYTICS: boolean;

  // ============================================================================
  // OPERATIONAL FLAGS
  // ============================================================================

  /**
   * Enable retry logic for failed events
   */
  ENABLE_EVENT_RETRY: boolean;

  /**
   * Enable dead letter queue for failed events
   */
  ENABLE_DEAD_LETTER_QUEUE: boolean;

  /**
   * Enable event logging (performance impact)
   */
  ENABLE_EVENT_LOGGING: boolean;

  /**
   * Enable event metrics collection
   */
  ENABLE_EVENT_METRICS: boolean;

  // ============================================================================
  // EXPERIMENTAL FLAGS
  // ============================================================================

  /**
   * Enable real-time event streaming (WebSocket)
   */
  ENABLE_REALTIME_EVENTS: boolean;

  /**
   * Enable event batching (reduce network calls)
   */
  ENABLE_EVENT_BATCHING: boolean;
}

// ============================================================================
// DEFAULT FLAGS (Production Safe)
// ============================================================================

const DEFAULT_FLAGS: FeatureFlags = {
  // Cognitive layer OFF by default (opt-in)
  ENABLE_COGNITIVE_LAYER: false,
  ENABLE_EVENT_BUS: false,
  ENABLE_AI_SUGGESTIONS: false,
  ENABLE_COGNITIVE_ANALYTICS: false,

  // Operational features ON (reliable)
  ENABLE_EVENT_RETRY: true,
  ENABLE_DEAD_LETTER_QUEUE: true,
  ENABLE_EVENT_LOGGING: true,
  ENABLE_EVENT_METRICS: true,

  // Experimental features OFF (not battle-tested)
  ENABLE_REALTIME_EVENTS: false,
  ENABLE_EVENT_BATCHING: false,
};

// ============================================================================
// ENVIRONMENT OVERRIDES
// ============================================================================

function loadFlagsFromEnv(): Partial<FeatureFlags> {
  const env = import.meta.env;

  return {
    ENABLE_COGNITIVE_LAYER: env.VITE_ENABLE_COGNITIVE_LAYER === "true",
    ENABLE_EVENT_BUS: env.VITE_ENABLE_EVENT_BUS === "true",
    ENABLE_AI_SUGGESTIONS: env.VITE_ENABLE_AI_SUGGESTIONS === "true",
    ENABLE_COGNITIVE_ANALYTICS: env.VITE_ENABLE_COGNITIVE_ANALYTICS === "true",
    ENABLE_EVENT_RETRY: env.VITE_ENABLE_EVENT_RETRY !== "false", // default true
    ENABLE_DEAD_LETTER_QUEUE: env.VITE_ENABLE_DEAD_LETTER_QUEUE !== "false",
    ENABLE_EVENT_LOGGING: env.VITE_ENABLE_EVENT_LOGGING !== "false",
    ENABLE_EVENT_METRICS: env.VITE_ENABLE_EVENT_METRICS !== "false",
    ENABLE_REALTIME_EVENTS: env.VITE_ENABLE_REALTIME_EVENTS === "true",
    ENABLE_EVENT_BATCHING: env.VITE_ENABLE_EVENT_BATCHING === "true",
  };
}

// ============================================================================
// RUNTIME FLAGS (can be modified at runtime)
// ============================================================================

class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();

  constructor() {
    this.flags = {
      ...DEFAULT_FLAGS,
      ...loadFlagsFromEnv(),
    };

    // Log current flags on init
    console.log("[FEATURE_FLAGS] Initialized:", this.flags);
  }

  /**
   * Get current flag value
   */
  get<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
    return this.flags[flag];
  }

  /**
   * Get all flags
   */
  getAll(): Readonly<FeatureFlags> {
    return { ...this.flags };
  }

  /**
   * Set flag at runtime (for emergency toggles)
   */
  set<K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]): void {
    const oldValue = this.flags[flag];
    this.flags[flag] = value;

    console.warn(`[FEATURE_FLAGS] Changed ${flag}: ${oldValue} → ${value}`);

    // Notify listeners
    this.listeners.forEach((listener) => listener(this.getAll()));
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emergency kill switch for cognitive layer
   */
  disableCognitiveLayer(): void {
    console.error("[FEATURE_FLAGS] 🚨 EMERGENCY: Disabling cognitive layer");
    this.set("ENABLE_COGNITIVE_LAYER", false);
    this.set("ENABLE_EVENT_BUS", false);
    this.set("ENABLE_AI_SUGGESTIONS", false);
    this.set("ENABLE_COGNITIVE_ANALYTICS", false);
  }

  /**
   * Enable cognitive layer (safe activation)
   */
  enableCognitiveLayer(): void {
    console.log("[FEATURE_FLAGS] ✅ Enabling cognitive layer");
    this.set("ENABLE_COGNITIVE_LAYER", true);
    this.set("ENABLE_EVENT_BUS", true);
    this.set("ENABLE_AI_SUGGESTIONS", true);
    this.set("ENABLE_COGNITIVE_ANALYTICS", true);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const featureFlagManager = new FeatureFlagManager();

// Convenient exports
export const featureFlags = featureFlagManager.getAll();

// Helper functions
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlagManager.get(flag);
}

export function isCognitiveLayerEnabled(): boolean {
  return featureFlagManager.get("ENABLE_COGNITIVE_LAYER");
}

// Emergency controls (for debugging/incidents)
export function disableCognitiveLayer(): void {
  featureFlagManager.disableCognitiveLayer();
}

export function enableCognitiveLayer(): void {
  featureFlagManager.enableCognitiveLayer();
}
