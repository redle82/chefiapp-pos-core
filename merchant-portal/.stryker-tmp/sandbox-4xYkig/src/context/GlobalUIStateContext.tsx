/**
 * GlobalUIStateContext — Ponto de verdade para estados globais de UI (Dia 2)
 *
 * Deriva de RestaurantRuntimeContext e ShiftContext. Uma semântica única que
 * Portal, TPV e KDS podem consumir. Ver docs/product/GLOBAL_UI_STATE_MAP.md.
 *
 * Regras: não inventa estado; deriva de runtime e shift. Ordem de migração:
 * blocked → error → pilot → loading → empty.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { RestaurantLifecycleState } from "../core/lifecycle/LifecycleState";
import { useShift } from "../core/shift/ShiftContext";
import { useLifecycleStateContext } from "./LifecycleStateContext";
import { useRestaurantRuntime } from "./RestaurantRuntimeContext";

export type BillingStatus = "trial" | "active" | "past_due" | "suspended";

export interface GlobalUIState {
  /** Bloqueia interação principal (runtime ou carregamento da tela) */
  isLoadingCritical: boolean;
  /** Define loading da tela atual (TPV/KDS); true = a carregar. */
  setScreenLoading: (v: boolean) => void;
  /** Lista/dados vazios (não é erro) — reportado pela tela */
  isEmpty: boolean;
  /** Define empty da tela atual (ex.: lista de produtos vazia). */
  setScreenEmpty: (v: boolean) => void;
  /** Ação bloqueada: gate (não publicado) ou shift (caixa fechado) */
  isBlocked: boolean;
  /** Bloqueado por gate: restaurante não publicado */
  isBlockedByGate: boolean;
  /** Bloqueado por turno: caixa fechado (TPV) */
  isBlockedByShift: boolean;
  /** Erro apresentável ao utilizador (runtime ou screen) */
  isError: boolean;
  /** Mensagem de erro para exibir (runtime.error ou screenError) */
  errorMessage: string | null;
  /** Define erro da tela atual (TPV/KDS); null limpa. */
  setScreenError: (msg: string | null) => void;
  /** Modo piloto / em teste */
  isPilot: boolean;
  /** Conexão ao Docker Core está ativa */
  coreReachable: boolean;
  /** Estado de faturação (Trial, Activo, Atraso, Suspenso) */
  billingStatus: BillingStatus;
  /** Bloqueado por falta de pagamento (suspended) */
  isBillingBlocked: boolean;
  /** Trial expirado (billing_status=trial e now > trial_ends_at). Paywall "Período de trial terminado". */
  isTrialExpired: boolean;
  /** Aviso de faturação pendente (past_due) */
  isBillingWarning: boolean;
  /** Estado da jornada do restaurante (Vida do Restaurante). Ref: CONTRATO_VIDA_RESTAURANTE. */
  lifecycleState: RestaurantLifecycleState | null;
}

const defaultState: GlobalUIState = {
  isLoadingCritical: false,
  setScreenLoading: () => {},
  isEmpty: false,
  setScreenEmpty: () => {},
  isBlocked: false,
  isBlockedByGate: true,
  isBlockedByShift: true,
  isError: false,
  errorMessage: null,
  setScreenError: () => {},
  isPilot: false,
  coreReachable: true,
  billingStatus: "trial",
  isBillingBlocked: false,
  isTrialExpired: false,
  isBillingWarning: false,
  lifecycleState: null,
};

const GlobalUIStateContext = createContext<GlobalUIState>(defaultState);

export function GlobalUIStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { runtime } = useRestaurantRuntime();
  const shift = useShift();
  const { lifecycleState } = useLifecycleStateContext();
  const [screenError, setScreenErrorState] = useState<string | null>(null);
  const [screenLoading, setScreenLoadingState] = useState(false);
  const [screenEmpty, setScreenEmptyState] = useState(false);

  const setScreenError = useCallback((msg: string | null) => {
    setScreenErrorState(msg);
  }, []);
  const setScreenLoading = useCallback((v: boolean) => {
    setScreenLoadingState(v);
  }, []);
  const setScreenEmpty = useCallback((v: boolean) => {
    setScreenEmptyState(v);
  }, []);

  const value = useMemo<GlobalUIState>(() => {
    const isBlockedByGate = !(runtime?.isPublished ?? false);
    const isShiftOpen = shift?.isShiftOpen ?? false;
    const isBlockedByShift = !isShiftOpen;
    const isBlocked = isBlockedByGate || isBlockedByShift;
    const errorMessage = runtime?.error ?? screenError ?? null;
    const isError = !!errorMessage;
    const isLoadingCritical = (runtime?.loading ?? false) || screenLoading;

    return {
      isLoadingCritical,
      setScreenLoading,
      isEmpty: screenEmpty,
      setScreenEmpty,
      isBlocked,
      isBlockedByGate,
      isBlockedByShift,
      isError,
      errorMessage,
      setScreenError,
      /** CORREÇÃO 3: derivado de systemState (não productMode). Trial = fase piloto. */
      isPilot: runtime?.systemState === "TRIAL",
      coreReachable: runtime?.coreReachable ?? true,
      billingStatus: (function () {
        const billing = runtime?.billing_status;
        const trialExpired =
          billing === "trial" &&
          runtime?.trial_ends_at != null &&
          new Date() > new Date(runtime.trial_ends_at);
        if (trialExpired) return "past_due";
        if (billing === "canceled") return "suspended";
        if (billing === "past_due") return "past_due";
        if (billing === "trial") return "trial";
        if (billing === "active") return "active";
        if (runtime?.status === "suspended") return "suspended";
        if (runtime?.status === "past_due") return "past_due";
        if (runtime?.status === "active" && runtime?.plan === "basic")
          return "trial";
        return "active";
      })() as BillingStatus,
      isBillingBlocked:
        runtime?.billing_status === "canceled" ||
        runtime?.status === "suspended",
      isTrialExpired:
        runtime?.billing_status === "trial" &&
        runtime?.trial_ends_at != null &&
        new Date() > new Date(runtime.trial_ends_at),
      isBillingWarning:
        runtime?.billing_status === "past_due" ||
        runtime?.status === "past_due",
      lifecycleState,
    };
  }, [
    runtime,
    shift?.isShiftOpen,
    screenError,
    screenLoading,
    screenEmpty,
    lifecycleState,
    setScreenError,
    setScreenLoading,
    setScreenEmpty,
  ]);

  return (
    <GlobalUIStateContext.Provider value={value}>
      {children}
    </GlobalUIStateContext.Provider>
  );
}

export function useGlobalUIState(): GlobalUIState {
  const ctx = useContext(GlobalUIStateContext);
  return ctx ?? defaultState;
}
