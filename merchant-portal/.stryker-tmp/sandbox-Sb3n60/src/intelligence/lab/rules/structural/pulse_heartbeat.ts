import type { MentorshipRule } from '../types';

export const PULSE_HEARTBEAT_RULE: MentorshipRule = {
    id: 'rule_pulse_heartbeat',
    name: 'Pulse Heartbeat',
    description: 'Monitors the time since the last table interaction to detect abandonment.',
    tier: 'structural',
    status: 'active',

    check: (context: { lastInteractionAt: number }) => {
        if (!context?.lastInteractionAt) return null;

        const now = Date.now();
        const diffMinutes = (now - context.lastInteractionAt) / 1000 / 60;

        // CRITICAL: Orphan State (> 35 min)
        if (diffMinutes > 35) {
            return {
                ruleId: 'rule_pulse_heartbeat',
                severity: 'critical',
                message: 'Mesa órfã há mais de 35 minutos. Risco de perda de receita.',
            };
        }

        // WARNING: Digesting State (> 15 min)
        if (diffMinutes > 15) {
            return {
                ruleId: 'rule_pulse_heartbeat',
                severity: 'warning',
                message: 'Mesa silenciosa há 15 minutos. Sugerir nova bebida?',
            };
        }

        return null; // Efficient: No noise if everything is fine.
    }
};
