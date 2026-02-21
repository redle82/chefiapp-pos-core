import type { InventoryItem } from './InventoryTypes';

// ------------------------------------------------------------------
// 🕵️ COUNT REFLEX ENGINE (THE TRUTH SEEKER)
// ------------------------------------------------------------------
// "Se o humano não conta, o sistema alucina."
// ------------------------------------------------------------------

export interface CountMission {
    id: string;
    itemId: string;
    itemName: string;
    role: string; // Who counts
    reason: 'routine_audit' | 'critical_low' | 'pre_purchase_check';
    priority: 'high' | 'normal';
}

export const generateCountMissions = (items: InventoryItem[]): CountMission[] => {
    const missions: CountMission[] = [];
    const now = new Date();
    const currentDay = now.getDay();
    // const currentHour = now.getHours();

    items.forEach(item => {
        const lifecycle = item.lifecycle;
        const audit = lifecycle.auditRule;

        if (!audit) return;

        let shouldCount = false;
        let reason: CountMission['reason'] = 'routine_audit';

        // 1. CRITICAL LOW CHECK (Always verify before panic)
        if (item.currentStock <= lifecycle.criticalLevel) {
            // Check if we counted recently (e.g. within 24h)
            const recentlyCounted = item.lifecycle.lastCountedAt && (Date.now() - item.lifecycle.lastCountedAt < 86400000);
            if (!recentlyCounted) {
                shouldCount = true;
                reason = 'critical_low';
            }
        }

        // 2. PRE-PURCHASE CHECK (For Calendar Items)
        if (audit.type === 'pre_purchase' && lifecycle.restockRule.type === 'calendar') {
            if (lifecycle.restockRule.dayOfWeek === currentDay) {
                // It's buying day! Must count before ordering.
                shouldCount = true;
                reason = 'pre_purchase_check';
            }
        }

        // 3. ROUTINE AUDITS
        if (audit.type === 'daily') {
            const countedToday = item.lifecycle.lastCountedAt && (new Date(item.lifecycle.lastCountedAt).getDate() === now.getDate());
            if (!countedToday) {
                shouldCount = true;
                reason = 'routine_audit';
            }
        }

        if (shouldCount) {
            missions.push({
                id: `mission-count-${item.id}-${Date.now()}`,
                itemId: item.id,
                itemName: item.name,
                role: lifecycle.responsibleRole,
                reason: reason,
                priority: reason === 'critical_low' ? 'high' : 'normal'
            });
        }
    });

    return missions;
};
