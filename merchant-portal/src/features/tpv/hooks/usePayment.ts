/**
 * Hook: usePayment
 *
 * Hook principal para gerenciar fluxo de pagamento.
 * Usa o domain layer para cálculos e o infra layer para providers.
 */

import {
  calculateGrandTotal,
  calculateTip,
  parseToCents,
  type Currency,
  type PaymentMethod,
  type PaymentStep,
} from "@domain/payment";
import { useCallback, useMemo, useReducer } from "react";
import { getProvider } from "../../../infra/payments";
import type { CreatePaymentResult } from "../../../infra/payments/interface";

/** Estado do hook de pagamento */
interface PaymentState {
  method: PaymentMethod | null;
  step: PaymentStep;
  processing: boolean;
  error: string | null;
  tipPercent: number | null;
  customTip: string;
  cashTendered: string;
  mbwayPhone: string;
  checkoutId: string | null;
  checkoutUrl: string | null;
  qrCodeUrl: string | null;
  clientSecret: string | null;
  timeRemaining: number;
}

/** Ações do reducer */
type PaymentAction =
  | { type: "SET_METHOD"; method: PaymentMethod | null }
  | { type: "SET_STEP"; step: PaymentStep }
  | { type: "SET_PROCESSING"; processing: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_TIP_PERCENT"; percent: number | null }
  | { type: "SET_CUSTOM_TIP"; value: string }
  | { type: "SET_CASH_TENDERED"; value: string }
  | { type: "SET_MBWAY_PHONE"; phone: string }
  | { type: "SET_CHECKOUT"; result: CreatePaymentResult }
  | { type: "SET_TIME_REMAINING"; seconds: number }
  | { type: "RESET" };

/** Estado inicial */
const initialState: PaymentState = {
  method: null,
  step: "idle",
  processing: false,
  error: null,
  tipPercent: null,
  customTip: "",
  cashTendered: "",
  mbwayPhone: "",
  checkoutId: null,
  checkoutUrl: null,
  qrCodeUrl: null,
  clientSecret: null,
  timeRemaining: 600,
};

/** Reducer */
function paymentReducer(
  state: PaymentState,
  action: PaymentAction,
): PaymentState {
  switch (action.type) {
    case "SET_METHOD":
      return {
        ...initialState,
        method: action.method,
      };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_PROCESSING":
      return { ...state, processing: action.processing };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_TIP_PERCENT":
      return { ...state, tipPercent: action.percent, customTip: "" };
    case "SET_CUSTOM_TIP":
      return { ...state, customTip: action.value, tipPercent: null };
    case "SET_CASH_TENDERED":
      return { ...state, cashTendered: action.value };
    case "SET_MBWAY_PHONE":
      return { ...state, mbwayPhone: action.phone };
    case "SET_CHECKOUT":
      return {
        ...state,
        checkoutId: action.result.checkoutId || null,
        checkoutUrl: action.result.checkoutUrl || null,
        qrCodeUrl: action.result.qrCodeUrl || null,
        clientSecret: action.result.clientSecret || null,
      };
    case "SET_TIME_REMAINING":
      return { ...state, timeRemaining: action.seconds };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

/** Parâmetros do hook */
interface UsePaymentParams {
  orderId: string;
  orderTotal: number;
  restaurantId: string;
  currency: string;
  onSuccess?: (method: string, paymentId?: string, tipCents?: number) => void;
}

/**
 * Hook para gerenciar fluxo de pagamento.
 */
export function usePayment(params: UsePaymentParams) {
  const { orderId, orderTotal, restaurantId, currency, onSuccess } = params;
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  const tipCents = useMemo(
    () => calculateTip(orderTotal, state.tipPercent, state.customTip),
    [orderTotal, state.tipPercent, state.customTip],
  );

  const grandTotal = useMemo(
    () => calculateGrandTotal(orderTotal, tipCents),
    [orderTotal, tipCents],
  );

  const cashCents = useMemo(
    () => parseToCents(state.cashTendered),
    [state.cashTendered],
  );

  const changeCents = useMemo(
    () => cashCents - grandTotal,
    [cashCents, grandTotal],
  );

  const setMethod = useCallback((method: PaymentMethod | null) => {
    dispatch({ type: "SET_METHOD", method });
  }, []);

  const setTipPercent = useCallback((percent: number | null) => {
    dispatch({ type: "SET_TIP_PERCENT", percent });
  }, []);

  const setCustomTip = useCallback((value: string) => {
    dispatch({ type: "SET_CUSTOM_TIP", value });
  }, []);

  const setCashTendered = useCallback((value: string) => {
    dispatch({ type: "SET_CASH_TENDERED", value });
  }, []);

  const setMbwayPhone = useCallback((phone: string) => {
    dispatch({ type: "SET_MBWAY_PHONE", phone });
  }, []);

  const createPayment = useCallback(async () => {
    if (!state.method) return;

    const provider = getProvider(state.method);
    if (!provider) {
      dispatch({ type: "SET_ERROR", error: "Provider não encontrado" });
      return;
    }

    dispatch({ type: "SET_PROCESSING", processing: true });
    dispatch({ type: "SET_STEP", step: "creating" });
    dispatch({ type: "SET_ERROR", error: null });

    try {
      const result = await provider.createPayment({
        orderId,
        amount: grandTotal,
        currency: currency as Currency,
        restaurantId,
        description: `Pedido ${orderId.slice(-6)}`,
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao criar pagamento");
      }

      dispatch({ type: "SET_CHECKOUT", result });
      dispatch({ type: "SET_STEP", step: "ready" });

      if (state.method === "cash") {
        onSuccess?.(state.method, result.paymentId || undefined, tipCents);
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
      dispatch({ type: "SET_STEP", step: "failed" });
    } finally {
      dispatch({ type: "SET_PROCESSING", processing: false });
    }
  }, [
    state.method,
    orderId,
    grandTotal,
    currency,
    restaurantId,
    tipCents,
    onSuccess,
  ]);

  const pollStatus = useCallback(async () => {
    if (!state.method || !state.checkoutId) return;

    const provider = getProvider(state.method);
    if (!provider) return;

    dispatch({ type: "SET_STEP", step: "polling" });

    try {
      const status = await provider.getPaymentStatus(state.checkoutId);

      if (status.status === "completed") {
        dispatch({ type: "SET_STEP", step: "completed" });
        onSuccess?.(state.method, status.paymentId, tipCents);
      } else if (status.status === "expired") {
        dispatch({ type: "SET_STEP", step: "expired" });
        dispatch({ type: "SET_ERROR", error: "Pagamento expirado" });
      } else if (status.status === "failed") {
        dispatch({ type: "SET_STEP", step: "failed" });
        dispatch({
          type: "SET_ERROR",
          error: status.error || "Pagamento falhou",
        });
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        error:
          error instanceof Error ? error.message : "Erro ao verificar status",
      });
    }
  }, [state.method, state.checkoutId, tipCents, onSuccess]);

  const cancel = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    tipCents,
    grandTotal,
    cashCents,
    changeCents,
    setMethod,
    setTipPercent,
    setCustomTip,
    setCashTendered,
    setMbwayPhone,
    createPayment,
    pollStatus,
    cancel,
  };
}
