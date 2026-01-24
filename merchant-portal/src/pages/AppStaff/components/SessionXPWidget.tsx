import React, { useMemo } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { colors } from '../../../ui/design-system/tokens/colors';
import type { Task } from '../context/StaffCoreTypes';

interface SessionXPWidgetProps {
    tasks: Task[];
    shiftStart?: number | null;
}

/**
 * SessionXPWidget
 * Phase 3: Gamification (Reward)
 * Displays XP earned during the current shift based on completed tasks.
 * XP Calculation:
 *  - Base: 10 XP per task completed
 *  - Priority Bonus: +5 (attention), +10 (urgent), +20 (critical)
 *  - Speed Bonus: (future) +10 if completed under expected time
 */
export const SessionXPWidget: React.FC<SessionXPWidgetProps> = ({ tasks, shiftStart }) => {

    const { sessionXP, completedCount, streakCount, level } = useMemo(() => {
        // Filter tasks completed during this session
        const sessionTasks = tasks.filter(t =>
            t.status === 'done' &&
            shiftStart &&
            t.createdAt >= shiftStart // Simple proxy: task was created during shift
        );

        let xp = 0;
        let streak = 0;
        let lastCompletionTime = 0;

        sessionTasks.forEach(task => {
            // Base XP
            let taskXP = 10;

            // Priority Bonus
            switch (task.priority) {
                case 'attention': taskXP += 5; break;
                case 'urgent': taskXP += 10; break;
                case 'critical': taskXP += 20; break;
            }

            // Streak Check (completed within 5 min of last)
            const completedAt = task.completedAt || task.createdAt; // Fallback
            if (lastCompletionTime && (completedAt - lastCompletionTime) < 5 * 60 * 1000) {
                streak++;
                taskXP += streak * 2; // Streak multiplier
            } else {
                streak = 0;
            }
            lastCompletionTime = completedAt;

            xp += taskXP;
        });

        // Simple Level: 1 level per 50 XP
        const currentLevel = Math.floor(xp / 50) + 1;

        return {
            sessionXP: xp,
            completedCount: sessionTasks.length,
            streakCount: streak,
            level: currentLevel
        };
    }, [tasks, shiftStart]);

    const xpToNextLevel = 50 - (sessionXP % 50);
    const progressPercent = ((sessionXP % 50) / 50) * 100;

    return (
        <Card surface="layer2" padding="md" style={{
            background: `linear-gradient(135deg, ${colors.action.base}10, ${colors.success.base}10)`,
            border: `1px solid ${colors.action.base}30`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text size="lg" weight="black" color="action">⚡ {sessionXP} XP</Text>
                    <Badge status="ready" label={`Nível ${level}`} size="sm" />
                </div>
                {streakCount > 1 && (
                    <Badge status="warning" label={`🔥 ${streakCount}x Streak`} size="sm" />
                )}
            </div>

            {/* Progress Bar */}
            <div style={{
                height: 6,
                backgroundColor: colors.border.subtle,
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 4
            }}>
                <div style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: colors.action.base,
                    borderRadius: 3,
                    transition: 'width 0.3s ease'
                }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text size="xs" color="tertiary">{completedCount} tarefas concluídas</Text>
                <Text size="xs" color="secondary">{xpToNextLevel} XP para Nível {level + 1}</Text>
            </div>
        </Card>
    );
};
