/**
 * core/printing — Sistema de impressão ESC/POS para impressoras térmicas.
 *
 * Módulos:
 * - EscPosBuilder: Construtor de comandos binários ESC/POS
 * - WebUSBTransport: Comunicação USB via browser (Chrome/Edge)
 * - PrintService: Orquestrador de impressão com templates
 * - usePrinter: React hook para integração na UI
 * - Templates: Recibos de cliente, tickets de cozinha/bar, fecho de turno
 */

// Driver ESC/POS
export { EscPosBuilder } from './EscPosDriver';

// Transporte WebUSB
export { WebUSBTransport, isWebUSBSupported } from './WebUSBTransport';

// Serviço de impressão
export { PrintService } from './PrintService';

// React hook
export { usePrinter } from './usePrinter';
export type { UsePrinterReturn } from './usePrinter';

// Templates
export {
  buildOrderReceipt,
  buildKitchenTicket,
  buildBarTicket,
  buildShiftClosingReceipt,
} from './templates';
export type { KitchenOrder, KitchenOrderItem } from './templates';

// Tipos
export type {
  RestaurantIdentity,
  ShiftClosingData,
  KitchenStation,
  PrinterConnectionStatus,
} from './types';
export { PrinterError, KNOWN_PRINTER_VENDORS } from './types';
