/**
 * usePrinter — React hook para impressão ESC/POS via WebUSB.
 *
 * Gere o ciclo de vida da ligação à impressora e expõe métodos
 * de impressão reactivos com estado de ligação.
 *
 * Uso:
 * ```tsx
 * function PrintButton() {
 *   const { isConnected, connect, testPrint, deviceName } = usePrinter();
 *
 *   return (
 *     <div>
 *       {isConnected
 *         ? <p>Ligado a: {deviceName}</p>
 *         : <button onClick={connect}>Ligar impressora</button>
 *       }
 *       <button onClick={testPrint} disabled={!isConnected}>Teste</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PrintService } from './PrintService';
import { WebUSBTransport, isWebUSBSupported } from './WebUSBTransport';
import type { RestaurantIdentity, ShiftClosingData, KitchenStation, PrinterConnectionStatus } from './types';
import { PrinterError } from './types';
import type { Order } from '@/domain/order/types';
import type { KitchenOrder } from './templates/KitchenTicket';

/** Resultado do hook usePrinter */
export interface UsePrinterReturn {
  /** Estado da ligação */
  status: PrinterConnectionStatus;
  /** Atalho: status === 'connected' */
  isConnected: boolean;
  /** true se o browser suporta WebUSB */
  isSupported: boolean;
  /** Nome da impressora ligada */
  deviceName: string | null;
  /** Último erro ocorrido */
  lastError: string | null;
  /** Liga a uma impressora USB (abre diálogo de selecção) */
  connect: () => Promise<void>;
  /** Desliga da impressora */
  disconnect: () => Promise<void>;
  /** Imprime recibo do cliente */
  printReceipt: (order: Order, restaurant: RestaurantIdentity, paymentMethod?: string) => Promise<void>;
  /** Imprime ticket de cozinha ou bar */
  printKitchenTicket: (order: KitchenOrder, station?: KitchenStation) => Promise<void>;
  /** Imprime recibo de fecho de turno */
  printShiftClosing: (data: ShiftClosingData) => Promise<void>;
  /** Abre a gaveta de dinheiro */
  openDrawer: (pin?: 0 | 1) => Promise<void>;
  /** Imprime recibo de teste */
  testPrint: () => Promise<void>;
}

/**
 * Hook React para impressão ESC/POS via WebUSB.
 *
 * Mantém uma instância singleton do PrintService durante o ciclo de vida
 * do componente. Desliga automaticamente ao desmontar.
 */
export function usePrinter(): UsePrinterReturn {
  const [status, setStatus] = useState<PrinterConnectionStatus>('disconnected');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const transportRef = useRef<WebUSBTransport>(new WebUSBTransport());
  const serviceRef = useRef<PrintService>(new PrintService(transportRef.current));

  const supported = isWebUSBSupported();

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      transportRef.current.disconnect().catch(() => {});
    };
  }, []);

  const connect = useCallback(async () => {
    if (!supported) {
      setLastError('WebUSB nao suportado neste browser. Use Chrome, Edge ou Opera.');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setLastError(null);
      await serviceRef.current.connect();
      setDeviceName(serviceRef.current.getDeviceName());
      setStatus('connected');
    } catch (err) {
      const message = err instanceof PrinterError ? err.message : String(err);
      setLastError(message);
      setStatus('error');
    }
  }, [supported]);

  const disconnect = useCallback(async () => {
    try {
      await serviceRef.current.disconnect();
    } catch {
      // Ignorar erros de desligação
    } finally {
      setStatus('disconnected');
      setDeviceName(null);
      setLastError(null);
    }
  }, []);

  const printReceipt = useCallback(async (
    order: Order,
    restaurant: RestaurantIdentity,
    paymentMethod?: string,
  ) => {
    try {
      setLastError(null);
      await serviceRef.current.printOrderReceipt(order, restaurant, paymentMethod);
    } catch (err) {
      const message = err instanceof PrinterError ? err.message : String(err);
      setLastError(message);
      throw err;
    }
  }, []);

  const printKitchenTicket = useCallback(async (
    order: KitchenOrder,
    station: KitchenStation = 'KITCHEN',
  ) => {
    try {
      setLastError(null);
      await serviceRef.current.printKitchenTicket(order, station);
    } catch (err) {
      const message = err instanceof PrinterError ? err.message : String(err);
      setLastError(message);
      throw err;
    }
  }, []);

  const printShiftClosing = useCallback(async (data: ShiftClosingData) => {
    try {
      setLastError(null);
      await serviceRef.current.printShiftClosing(data);
    } catch (err) {
      const message = err instanceof PrinterError ? err.message : String(err);
      setLastError(message);
      throw err;
    }
  }, []);

  const openDrawer = useCallback(async (pin: 0 | 1 = 0) => {
    try {
      setLastError(null);
      await serviceRef.current.openCashDrawer(pin);
    } catch (err) {
      const message = err instanceof PrinterError ? err.message : String(err);
      setLastError(message);
      throw err;
    }
  }, []);

  const testPrint = useCallback(async () => {
    try {
      setLastError(null);
      await serviceRef.current.testPrint();
    } catch (err) {
      const message = err instanceof PrinterError ? err.message : String(err);
      setLastError(message);
      throw err;
    }
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    isSupported: supported,
    deviceName,
    lastError,
    connect,
    disconnect,
    printReceipt,
    printKitchenTicket,
    printShiftClosing,
    openDrawer,
    testPrint,
  };
}
