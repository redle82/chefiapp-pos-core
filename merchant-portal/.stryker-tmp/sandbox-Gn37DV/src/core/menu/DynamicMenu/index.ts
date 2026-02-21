/**
 * DYNAMIC MENU - MAIN EXPORT
 * 
 * Central export point for the Dynamic Contextual Menu system.
 */

export { DynamicMenuService } from './DynamicMenuService';
export { useDynamicMenu } from './hooks/useDynamicMenu';
export {
    calculateDynamicScore,
    calculateBatchScores,
    getCurrentTimeSlot
} from './scoring';

export type {
    ProductDynamics,
    ScoreWeights,
    TimeSlotConfig,
    MenuSettings,
    DynamicMenuResponse,
    ProductWithScore,
    CategoryWithProducts,
    TimeSlot,
    ScoreComponents
} from './types';
