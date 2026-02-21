/**
 * CONTRATOS CENTRALIZADOS — FASE 3.2
 * 
 * ÚNICA fonte de verdade para contratos de dados do sistema.
 * 
 * REGRAS:
 * - Todos os types/interfaces de dados devem vir daqui
 * - UI não deve definir seus próprios types de Order/OrderItem/OrderOrigin
 * - Core não deve duplicar types da UI
 */
// @ts-nocheck


export type { OrderOrigin } from './OrderOrigin';
export { normalizeOrderOrigin } from './OrderOrigin';

export type { OrderItem } from './OrderItem';

export type { Order } from './Order';

export type {
  OrderItemInput,
  CreateOrderSyncMetadata,
  CreateOrderResult,
  CreateOrderParams,
} from './CreateOrder';
