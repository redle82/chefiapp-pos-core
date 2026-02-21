/**
 * Glovo Adapter - Export
 */
// @ts-nocheck


export { GlovoAdapter } from './GlovoAdapter';

export type {
  GlovoOrder,
  GlovoOrderItem,
  GlovoCustomer,
  GlovoDeliveryAddress,
  GlovoOrderStatus,
  GlovoConfig,
  GlovoOAuthTokenResponse,
} from './GlovoTypes';
export {
  isValidGlovoOrder,
  isPendingOrder,
  isCancelledOrder,
} from './GlovoTypes';
