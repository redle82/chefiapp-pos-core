/**
 * GloriaFood Integration Module
 * 
 * Export público para uso no sistema.
 */

export { GloriaFoodAdapter, createGloriaFoodAdapter } from './GloriaFoodAdapter';
export type { GloriaFoodConfig } from './GloriaFoodAdapter';

export type {
  GloriaFoodWebhookPayload,
  GloriaFoodOrder,
  GloriaFoodOrderItem,
  GloriaFoodCustomer,
  GloriaFoodAddress,
  GloriaFoodPayment,
  GloriaFoodDelivery,
  GloriaFoodEventType,
} from './GloriaFoodTypes';

export { 
  isValidGloriaFoodPayload, 
  isNewOrderEvent, 
  isCancellationEvent 
} from './GloriaFoodTypes';
