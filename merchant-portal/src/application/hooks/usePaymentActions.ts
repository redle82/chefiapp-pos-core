/**
 * usePaymentActions — React hook wrapping PaymentUseCases with loading/error state.
 *
 * Provides stable callbacks (useCallback) so consumers do not re-render
 * unless loading or error changes. All orchestration lives in PaymentUseCases;
 * this hook only manages React state transitions.
 */

import { useCallback, useState } from "react";
import {
  processPayment,
  refundPayment,
  splitBill,
  type ProcessPaymentParams,
  type RefundPaymentParams,
  type SplitBillParams,
  type Result,
} from "../PaymentUseCases";
import type { SplitBillPart } from "../../core/orders/SplitBillService";
import type { ReconciliationReport } from "../../core/payment/PaymentReconciler";

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UsePaymentActionsReturn {
  processPayment: (params: ProcessPaymentParams) => Promise<Result<{ paymentIntentId: string; clientSecret: string }>>;
  refundPayment: (params: RefundPaymentParams) => Promise<Result<{ refundId: string; status: string; amount: number }>>;
  splitBill: (params: SplitBillParams) => Result<{ parts: SplitBillPart[] }>;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePaymentActions(): UsePaymentActionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withAsyncState = useCallback(
    async <T>(fn: () => Promise<Result<T>>): Promise<Result<T>> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn();
        if (!result.success && result.error) {
          setError(result.error);
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleProcessPayment = useCallback(
    (params: ProcessPaymentParams) => withAsyncState(() => processPayment(params)),
    [withAsyncState],
  );

  const handleRefundPayment = useCallback(
    (params: RefundPaymentParams) => withAsyncState(() => refundPayment(params)),
    [withAsyncState],
  );

  const handleSplitBill = useCallback(
    (params: SplitBillParams): Result<{ parts: SplitBillPart[] }> => {
      setError(null);
      const result = splitBill(params);
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    },
    [],
  );

  return {
    processPayment: handleProcessPayment,
    refundPayment: handleRefundPayment,
    splitBill: handleSplitBill,
    loading,
    error,
  };
}
