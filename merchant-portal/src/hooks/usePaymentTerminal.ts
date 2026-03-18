/**
 * usePaymentTerminal Hook
 *
 * React hook para gestão do terminal de pagamento (Stripe Terminal).
 * Encapsula inicialização, descoberta de leitores, conexão e cobrança.
 */

import { useCallback, useRef, useState } from "react";
import type { ReaderInfo } from "../infra/payments/providers/stripeTerminal";
import { stripeTerminalProvider } from "../infra/payments/providers/stripeTerminal";

// ─── Types ──────────────────────────────────────────────────────────

export type TerminalStatus =
  | "idle"
  | "discovering"
  | "connecting"
  | "collecting"
  | "processing";

export interface PaymentResult {
  success: boolean;
  paymentId: string | null;
  error?: string;
}

export interface UsePaymentTerminalReturn {
  /** Whether the Terminal SDK is initialized */
  isInitialized: boolean;
  /** Whether a reader is connected */
  isReaderConnected: boolean;
  /** Info about the connected reader */
  readerInfo: ReaderInfo | null;
  /** Current terminal status */
  status: TerminalStatus;

  /** Initialize the Terminal SDK */
  initialize: () => Promise<void>;
  /** Discover nearby readers */
  discoverReaders: (
    method?: "simulated" | "internet",
  ) => Promise<ReaderInfo[]>;
  /** Connect to a specific reader */
  connectReader: (reader: ReaderInfo) => Promise<void>;
  /** Disconnect from current reader */
  disconnectReader: () => Promise<void>;

  /** Collect a payment from the connected reader */
  collectPayment: (
    amountCents: number,
    orderId: string,
    currency?: string,
    restaurantId?: string,
  ) => Promise<PaymentResult>;
  /** Cancel the current payment collection */
  cancelPayment: () => Promise<void>;

  /** Current error message */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function usePaymentTerminal(): UsePaymentTerminalReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReaderConnected, setIsReaderConnected] = useState(false);
  const [readerInfo, setReaderInfo] = useState<ReaderInfo | null>(null);
  const [status, setStatus] = useState<TerminalStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Ref to track if a collection is in progress (for cancel)
  const collectingRef = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initialize = useCallback(async () => {
    try {
      setError(null);
      await stripeTerminalProvider.initialize();
      setIsInitialized(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao inicializar terminal";
      setError(message);
      throw err;
    }
  }, []);

  const discoverReaders = useCallback(
    async (
      method: "simulated" | "internet" = "internet",
    ): Promise<ReaderInfo[]> => {
      try {
        setError(null);
        setStatus("discovering");
        const readers = await stripeTerminalProvider.discoverReaders(method);
        setStatus("idle");
        return readers;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Falha ao descobrir leitores";
        setError(message);
        setStatus("idle");
        throw err;
      }
    },
    [],
  );

  const connectReader = useCallback(async (reader: ReaderInfo) => {
    try {
      setError(null);
      setStatus("connecting");
      await stripeTerminalProvider.connectReader(reader);
      setIsReaderConnected(true);
      setReaderInfo(stripeTerminalProvider.getReaderInfo());
      setStatus("idle");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Falha ao conectar ao leitor";
      setError(message);
      setStatus("idle");
      throw err;
    }
  }, []);

  const disconnectReader = useCallback(async () => {
    try {
      setError(null);
      await stripeTerminalProvider.disconnectReader();
      setIsReaderConnected(false);
      setReaderInfo(null);
      setStatus("idle");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Falha ao desconectar leitor";
      setError(message);
      throw err;
    }
  }, []);

  const collectPayment = useCallback(
    async (
      amountCents: number,
      orderId: string,
      currency = "EUR",
      restaurantId = "",
    ): Promise<PaymentResult> => {
      try {
        setError(null);
        setStatus("collecting");
        collectingRef.current = true;

        const result = await stripeTerminalProvider.createPayment({
          orderId,
          amount: amountCents,
          currency: currency.toUpperCase() as "EUR" | "USD" | "GBP",
          restaurantId,
        });

        collectingRef.current = false;
        setStatus(result.success ? "idle" : "idle");

        if (!result.success) {
          setError(result.error ?? "Pagamento falhou");
        }

        return {
          success: result.success,
          paymentId: result.paymentId,
          error: result.error,
        };
      } catch (err) {
        collectingRef.current = false;
        const message =
          err instanceof Error ? err.message : "Erro ao cobrar pagamento";
        setError(message);
        setStatus("idle");
        return {
          success: false,
          paymentId: null,
          error: message,
        };
      }
    },
    [],
  );

  const cancelPayment = useCallback(async () => {
    try {
      if (collectingRef.current) {
        await stripeTerminalProvider.cancelCollect();
        collectingRef.current = false;
      }
      setStatus("idle");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao cancelar";
      setError(message);
    }
  }, []);

  return {
    isInitialized,
    isReaderConnected,
    readerInfo,
    status,
    initialize,
    discoverReaders,
    connectReader,
    disconnectReader,
    collectPayment,
    cancelPayment,
    error,
    clearError,
  };
}
