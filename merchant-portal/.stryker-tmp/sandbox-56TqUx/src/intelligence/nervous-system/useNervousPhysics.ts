// @ts-nocheck
import { useMemo } from 'react';
import { useStaff } from '../../pages/AppStaff/context/StaffContext';
// FASE 3.3: TODO - useNervousPhysics deve receber orders via parâmetro
// Por enquanto, usando array vazio - será implementado na próxima fase
// import { useOrders } from '../../pages/TPV/context/OrderContext';
import { now as getNow } from './Clock';

export type DayPhase = 'morning' | 'peak' | 'lull';
export type NervousMode = 'wake' | 'flow' | 'sympathetic' | 'parasympathetic';

export interface NervousTelemetry {
    phase: DayPhase;
    mode: NervousMode;
    pressureScore: number; // 0-100
    energyLevel: number; // 0-100 (Decay from lastActivity)
    progressToIdle: number; // 0.0 - 1.0+
    idleThreshold: number;
}

import { getAdaptiveIdleThreshold } from './AdaptiveIdleEngine';

export const useNervousPhysics = (): NervousTelemetry => {
    const { lastActivityAt, activeRole, operationalContract, tasks } = useStaff();
    void activeRole;
    // FASE 3.3: TODO - orders deve vir via parâmetro ou hook próprio
    // Por enquanto, usando array vazio para não quebrar
    const orders: any[] = []; // TODO: Receber via parâmetro ou criar hook próprio

    const telemetry = useMemo(() => {
        const now = getNow();
        const elapsed = now - lastActivityAt;

        // ----------------------------------------------------------------
        // 1. PHASE (Metabolism)
        // ----------------------------------------------------------------
        const hour = new Date(now).getHours();
        let phase: DayPhase;
        if (hour < 11) phase = 'morning';
        else if ((hour >= 11 && hour < 14) || (hour >= 18 && hour < 21)) phase = 'peak';
        else phase = 'lull';

        // ----------------------------------------------------------------
        // 2. PRESSURE (Sympathetic Tone)
        // ----------------------------------------------------------------
        const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'preparing');
        const pressureScore = Math.min(activeOrders.length * 10, 100);
        const hasPressure = activeOrders.length > 0;

        // ----------------------------------------------------------------
        // 3. BRAIN STATE (Cognitive Load)
        // ----------------------------------------------------------------
        const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status === 'pending');
        const hasCritical = criticalTasks.length > 0;

        // ----------------------------------------------------------------
        // 4. THRESHOLD CALCULATION
        // ----------------------------------------------------------------
        const density = operationalContract?.mode === 'connected' ? 'high' : 'low';
        const threshold = getAdaptiveIdleThreshold({ hour, density, hasPressure });

        const progressToIdle = elapsed / threshold;

        // ----------------------------------------------------------------
        // 5. MODE DETERMINATION
        // ----------------------------------------------------------------
        let mode: NervousMode = 'wake';

        if (hasPressure || hasCritical) {
            mode = 'sympathetic';
        } else if (progressToIdle > 0.5) {
            // Approaching idle -> "Dreaming" (Parasympathetic)
            mode = 'parasympathetic';
        } else if (progressToIdle < 0.2 && elapsed < 5000) {
            // Just moved -> Wake
            mode = 'wake';
        } else {
            // In between -> Flow
            mode = 'flow';
        }

        return {
            phase,
            mode,
            pressureScore,
            energyLevel: Math.max(0, 100 - (elapsed / 200)), // Crude energy decay metric
            progressToIdle,
            idleThreshold: threshold
        };
    }, [lastActivityAt, orders, tasks, operationalContract, getNow()]); // Dep on getNow() implies external tick needed if not real-time

    return telemetry;
};
