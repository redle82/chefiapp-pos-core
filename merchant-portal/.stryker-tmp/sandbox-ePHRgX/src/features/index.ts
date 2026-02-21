/**
 * Features Index - Exportações centralizadas
 * 
 * Facilita importações: import { useShiftsByDate } from '@/features'
 */
// @ts-nocheck


// Schedule
export { useShiftsByDate, useCurrentShift } from './schedule/hooks/useShifts';
export * from './schedule/services/scheduleService';

// Tasks
export { useTasks, useUpdateTaskStatus } from './tasks/hooks/useTasks';

// Operation
export { useActiveOrders, useKDSByStation } from './operation/hooks/useOperation';
