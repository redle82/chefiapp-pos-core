/**
 * achievementEvents — lightweight pub/sub for achievement unlock notifications.
 *
 * Using a plain callback registry (no external dep) so it works in both
 * React-context consumers and non-context services like GamificationService.
 */

import type { Achievement } from "../services/GamificationService";

type AchievementUnlockCallback = (achievement: Achievement) => void;

const _listeners = new Set<AchievementUnlockCallback>();

/**
 * Subscribe to achievement unlock events.
 * Returns an unsubscribe function — call it in a `useEffect` cleanup.
 */
export function onAchievementUnlocked(
  cb: AchievementUnlockCallback,
): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

/**
 * Emit an achievement unlock event.
 * Call this whenever `checkAchievements()` returns new achievements.
 */
export function emitAchievementUnlocked(achievement: Achievement): void {
  _listeners.forEach((cb) => cb(achievement));
}
