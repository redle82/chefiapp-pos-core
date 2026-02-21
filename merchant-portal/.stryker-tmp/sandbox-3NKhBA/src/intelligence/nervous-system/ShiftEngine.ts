// @ts-nocheck
export type HealTrafficLight = 'green' | 'yellow' | 'red';

export interface ShiftMetrics {
    activeStaff: number;
    activeTasks: number;
    loadIndex: number; // tasks / staff
    status: HealTrafficLight;
}

/**
 * Calculates the Human Load Index
 * Formula: Load = Active Tasks / Active Staff
 */
export function calculateShiftLoad(activeTasks: number, activeStaffCount: number): ShiftMetrics {
    // Prevent division by zero: if 0 staff, but tasks exist, load is infinite (cap at 10 for safety)
    const staff = Math.max(activeStaffCount, 1);

    const loadIndex = parseFloat((activeTasks / staff).toFixed(2));

    let status: HealTrafficLight = 'green';

    if (loadIndex <= 1.0) {
        status = 'green';
    } else if (loadIndex <= 2.0) {
        status = 'yellow'; // Attention
    } else {
        status = 'red'; // Overload
    }

    return {
        activeStaff: staff,
        activeTasks,
        loadIndex,
        status
    };
}
