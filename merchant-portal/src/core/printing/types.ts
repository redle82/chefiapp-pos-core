/**
 * Tipos para o sistema de impressão ESC/POS.
 *
 * Define contratos partilhados entre driver, transportes e templates.
 */

/** Identidade do restaurante para cabeçalhos de recibo */
export interface RestaurantIdentity {
  name: string;
  address?: string;
  nif?: string;
  phone?: string;
  logoUrl?: string;
}

/** Dados de fecho de turno para impressão */
export interface ShiftClosingData {
  restaurantName: string;
  operatorName: string;
  terminalId?: string;
  openedAt: Date;
  closedAt: Date;
  totalOrders: number;
  /** Receita por método de pagamento: { "Dinheiro": 5000, "Cartão": 12300 } (em cêntimos) */
  revenueByMethod: Record<string, number>;
  /** Dinheiro em caixa (em cêntimos) */
  cashInDrawer: number;
  /** Saldo esperado (em cêntimos) */
  expectedBalance: number;
  /** Saldo real contado (em cêntimos) */
  actualBalance: number;
}

/** Estação de preparação (filtro para tickets) */
export type KitchenStation = 'KITCHEN' | 'BAR';

/** Vendor IDs conhecidos de impressoras térmicas */
export const KNOWN_PRINTER_VENDORS: Record<string, number> = {
  EPSON: 0x04b8,
  STAR: 0x0519,
  CITIZEN: 0x1d90,
  BIXOLON: 0x1504,
  SEWOO: 0x0dd4,
  CUSTOM: 0x0dd4,
} as const;

/** Estado da ligação da impressora */
export type PrinterConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Erro específico de impressão */
export class PrinterError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_CONNECTED'
      | 'SEND_FAILED'
      | 'USB_NOT_SUPPORTED'
      | 'PERMISSION_DENIED'
      | 'DEVICE_NOT_FOUND'
      | 'TEMPLATE_ERROR',
  ) {
    super(message);
    this.name = 'PrinterError';
  }
}
