import { SystemEvents } from '../../core/events/SystemEvents';
import { MetabolicAudit } from './MetabolicAudit';

export interface MetabolicPulse {
    type: 'METABOLIC_PULSE';
    id: string;
    timestamp: number;
    tickRate: number;
}

export class MetabolicClock {
    private static intervalId: ReturnType<typeof setInterval> | null = null;
    private static tickRateMs = 30000;
    private static running = false;

    static start(tickRateMs: number = 30000) {
        if (this.running || this.intervalId) {
            console.warn('[MetabolicClock] Clock already running. Ignoring start().');
            return;
        }
        this.tickRateMs = tickRateMs;
        this.running = true;

        SystemEvents.emit('metabolic:clock_started', { tickRateMs });

        MetabolicAudit.append({
            type: 'METABOLIC_AUDIT',
            pulseId: 'clock_started',
            timestamp: Date.now(),
            tickRate: this.tickRateMs,
            note: 'clock_started',
        });

        this.intervalId = setInterval(() => this.pulse(), this.tickRateMs);
    }

    static stop() {
        if (!this.intervalId) return;

        clearInterval(this.intervalId);
        this.intervalId = null;
        this.running = false;

        SystemEvents.emit('metabolic:clock_stopped', {});

        MetabolicAudit.append({
            type: 'METABOLIC_AUDIT',
            pulseId: 'clock_stopped',
            timestamp: Date.now(),
            tickRate: this.tickRateMs,
            note: 'clock_stopped',
        });
    }

    static forcePulse() {
        this.pulse();
    }

    private static pulse() {
        const id =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `pulse_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const payload: MetabolicPulse = {
            type: 'METABOLIC_PULSE',
            id,
            timestamp: Date.now(),
            tickRate: this.tickRateMs,
        };

        // 1. Emite o pulso (reflexos, inventory, etc.)
        SystemEvents.emit('metabolic:pulse', payload);

        // 2. 🧾 Audit Trail (Protocol 13.2)
        MetabolicAudit.append({
            type: 'METABOLIC_AUDIT',
            pulseId: payload.id,
            timestamp: payload.timestamp,
            tickRate: payload.tickRate,
        });
    }
}
