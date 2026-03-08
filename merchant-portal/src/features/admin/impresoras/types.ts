/**
 * Tipos para Impresoras — impressoras e rotas de impressão.
 */

export interface Printer {
  id: string;
  name: string;
  type: string; // kitchen, receipt, etc.
  connection: string; // usb, network, etc.
  /** Network printer IP address (e.g. 192.168.1.100) */
  ip?: string | null;
  /** Network printer port (default 9100 for thermal) */
  port?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrintRoute {
  id: string;
  name: string;
  printerId: string;
  trigger: string; // order_type, category, etc.
  createdAt: string;
  updatedAt: string;
}
