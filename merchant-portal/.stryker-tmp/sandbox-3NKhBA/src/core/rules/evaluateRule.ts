// @ts-nocheck
type Pulse = {
    restaurant_id: string;
    created_at: string;
};

type Rule = {
    id: string;
    trigger: {
        threshold_minutes: number;
        [key: string]: any;
    };
};

/**
 * Pure function to evaluate "Silêncio Mortal" rule.
 * 
 * @param lastPulse The last pulse object from the restaurant.
 * @param rule The rule configuration.
 * @param now Reference time (dependency injection for testing).
 * @returns Evaluation result.
 */
export function evaluateSilenceRule(
    lastPulse: Pulse | null,
    rule: Rule,
    now = new Date()
): { triggered: boolean; silenceMinutes: number } {
    // If no pulse ever exists, we treat it as infinite silence (trigger immediately)
    // In practice, this handles "New Restaurant that never started"
    if (!lastPulse) {
        return { triggered: true, silenceMinutes: Infinity };
    }

    const last = new Date(lastPulse.created_at);
    const diffMs = now.getTime() - last.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    return {
        triggered: diffMinutes > rule.trigger.threshold_minutes,
        silenceMinutes: diffMinutes
    };
}
