// @ts-nocheck
import { SystemEvents } from '../../core/events/SystemEvents';
import { GlobalEventStore } from '../../core/events/EventStore'; // Phase 14
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../core/storage/TabIsolatedStorage';

export type MetabolicAuditEntry = {
    type: 'METABOLIC_AUDIT';
    pulseId: string;
    timestamp: number;
    tickRate: number;
    note?: string;
};

const KEY = 'chef.metabolic.audit.v1';
const MAX = 300; // ring buffer (Keep last 300 beats ~2.5 hours at 30s)

export const MetabolicAudit = {
    append(entry: MetabolicAuditEntry) {
        try {
            const raw = getTabIsolated(KEY);
            const list: MetabolicAuditEntry[] = raw ? JSON.parse(raw) : [];
            list.push(entry);
            // Ring Buffer Logic: Trim oldest
            const trimmed = list.length > MAX ? list.slice(list.length - MAX) : list;
            setTabIsolated(KEY, JSON.stringify(trimmed));
        } catch {
            // Silence > Lie: Storage failure should not stop the heart.
        }

        SystemEvents.emit('metabolic:audit', entry);

        // 🏗️ PHASE 14: LONG-TERM MEMORY (EventStore)
        // Fire-and-forget: The heart doesn't wait for the pen.
        GlobalEventStore.append({
            eventId: crypto.randomUUID(),
            type: 'METABOLIC_PULSE_LOGGED',
            payload: entry,
            meta: {
                timestamp: entry.timestamp,
                actorId: 'metabolic-clock',
                sessionId: 'session_1', // TODO
                version: 1
            },
        }).catch(err => console.error('[MetabolicAudit] Persist failed:', err));
    },

    read(): MetabolicAuditEntry[] {
        try {
            const raw = getTabIsolated(KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    clear() {
        try {
            removeTabIsolated(KEY);
        } catch { }
    },
};
