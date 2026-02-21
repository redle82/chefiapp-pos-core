// @ts-nocheck

export type PressureStatus = 'calm' | 'tension' | 'peak';

export interface PressureMetrics {
    ordersLastWindow: number; // 15 min
    avgPrepTimeMinutes: number; // Est.
    activeStaff: number;
    pressureIndex: number;
    status: PressureStatus;
}

/**
 * Calculates Operational Pressure
 * Index = (Orders * PrepTime) / Staff
 */
export function calculatePressure(
    ordersLast15Min: number,
    activeStaff: number,
    avgPrepTimeMinutes: number = 10 // Default estimation
): PressureMetrics {
    const staff = Math.max(activeStaff, 1);

    // Formula: Workload units per person
    const workload = ordersLast15Min * avgPrepTimeMinutes;
    const index = parseFloat((workload / staff).toFixed(2));

    let status: PressureStatus = 'calm';

    // Thresholds (Heuristic)
    // < 15 mins of work queued per person = Calm
    // 15 - 30 mins = Tension
    // > 30 mins = Peak (Backlog growing faster than prep)

    if (index < 15) {
        status = 'calm';
    } else if (index < 30) {
        status = 'tension';
    } else {
        status = 'peak';
    }

    return {
        ordersLastWindow: ordersLast15Min,
        avgPrepTimeMinutes,
        activeStaff: staff,
        pressureIndex: index,
        status
    };
}
