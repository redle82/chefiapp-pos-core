/**
 * Tipos para Impresoras — impressoras e rotas de impressão.
 */
// @ts-nocheck


export interface Printer {
  id: string;
  name: string;
  type: string; // kitchen, receipt, etc.
  connection: string; // usb, network, etc.
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
