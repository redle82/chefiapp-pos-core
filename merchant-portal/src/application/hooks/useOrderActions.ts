/**
 * useOrderActions — React hook wrapping OrderUseCases with loading/error state.
 *
 * Provides stable callbacks (useCallback) so consumers do not re-render
 * unless loading or error changes. All orchestration lives in OrderUseCases;
 * this hook only manages React state transitions.
 */

import { useCallback, useState } from "react";
import {
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  applyDiscount,
  cancelOrder,
  reopenOrder,
  type CreateOrderParams,
  type AddItemToOrderParams,
  type RemoveItemFromOrderParams,
  type ApplyDiscountParams,
  type CancelOrderParams,
  type ReopenOrderParams,
  type Result,
} from "../OrderUseCases";

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseOrderActionsReturn {
  createOrder: (params: CreateOrderParams) => Promise<Result<{ orderId: string; totalCents: number }>>;
  addItem: (params: AddItemToOrderParams) => Promise<Result<{ itemId: string }>>;
  removeItem: (params: RemoveItemFromOrderParams) => Promise<Result<null>>;
  applyDiscount: (params: ApplyDiscountParams) => Promise<Result<{ newTotal: number }>>;
  cancelOrder: (params: CancelOrderParams) => Promise<Result<null>>;
  reopenOrder: (params: ReopenOrderParams) => Promise<Result<null>>;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrderActions(): UseOrderActionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withState = useCallback(
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

  const handleCreateOrder = useCallback(
    (params: CreateOrderParams) => withState(() => createOrder(params)),
    [withState],
  );

  const handleAddItem = useCallback(
    (params: AddItemToOrderParams) => withState(() => addItemToOrder(params)),
    [withState],
  );

  const handleRemoveItem = useCallback(
    (params: RemoveItemFromOrderParams) => withState(() => removeItemFromOrder(params)),
    [withState],
  );

  const handleApplyDiscount = useCallback(
    (params: ApplyDiscountParams) => withState(() => applyDiscount(params)),
    [withState],
  );

  const handleCancelOrder = useCallback(
    (params: CancelOrderParams) => withState(() => cancelOrder(params)),
    [withState],
  );

  const handleReopenOrder = useCallback(
    (params: ReopenOrderParams) => withState(() => reopenOrder(params)),
    [withState],
  );

  return {
    createOrder: handleCreateOrder,
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    applyDiscount: handleApplyDiscount,
    cancelOrder: handleCancelOrder,
    reopenOrder: handleReopenOrder,
    loading,
    error,
  };
}
