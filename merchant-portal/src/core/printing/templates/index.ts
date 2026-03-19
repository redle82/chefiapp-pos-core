/**
 * Templates de impressão ESC/POS — barrel export.
 */

export { buildOrderReceipt } from './OrderReceipt';
export { buildKitchenTicket } from './KitchenTicket';
export { buildBarTicket } from './BarTicket';
export { buildShiftClosingReceipt } from './ShiftClosingReceipt';

export type { KitchenOrder, KitchenOrderItem } from './KitchenTicket';
