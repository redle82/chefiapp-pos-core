/**
 * LifecycleStateContext — Estado da jornada (Vida do Restaurante)
 *
 * Fonte única de verdade para "em que fase estamos" (VISITOR, BOOTSTRAP_*,
 * READY_TO_OPERATE). Ref: CONTRATO_VIDA_RESTAURANTE (v2).
 *
 * O estado é escrito por: FlowGate (rotas app) e PublicLifecycleSync (rotas públicas).
 * GlobalUIState lê daqui para expor lifecycleState.
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  deriveLifecycleState,
  type RestaurantLifecycleState,
} from "../core/lifecycle/LifecycleState";

export interface LifecycleStateContextValue {
  lifecycleState: RestaurantLifecycleState | null;
  setLifecycleState: (s: RestaurantLifecycleState | null) => void;
}

const defaultValue: LifecycleStateContextValue = {
  lifecycleState: null,
  setLifecycleState: () => {},
};

/** Contexto exportado para o Provider ser montado no entry (main_debug) com estado no mesmo módulo que createRoot. */
export const LifecycleStateContext =
  createContext<LifecycleStateContextValue>(defaultValue);

/** Provider controlado: recebe value do pai. Estado vive em main_debug.tsx para evitar duas instâncias de React. */
export function LifecycleStateProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: LifecycleStateContextValue;
}) {
  return (
    <LifecycleStateContext.Provider value={value}>
      {children}
    </LifecycleStateContext.Provider>
  );
}

export function useLifecycleStateContext(): LifecycleStateContextValue {
  const ctx = useContext(LifecycleStateContext);
  return ctx ?? defaultValue;
}

/** Rotas em que o lifecycle é definido fora do FlowGate (hasOrg = false). */
const PUBLIC_LIFECYCLE_PATHS = [
  "/",
  "/landing",
  "/pricing",
  "/features",
  "/auth",
  "/trial-guide",
  "/trial",
  "/login",
  "/signup",
  "/forgot-password",
  "/help/start-local",
  "/billing/success",
];

/**
 * Sincroniza o estado da jornada nas rotas públicas (/, /auth, etc.). /trial e /trial-guide redirecionam para /auth (Opção A).
 * Nas rotas app (/*), o FlowGate é a fonte de verdade.
 */
export function PublicLifecycleSync() {
  const { setLifecycleState } = useLifecycleStateContext();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!PUBLIC_LIFECYCLE_PATHS.includes(pathname)) return;

    // Nas rotas públicas não temos sessão nem membership; assumir hasOrg = false.
    const state = deriveLifecycleState({
      pathname,
      isAuthenticated: false,
      hasOrganization: false,
    });
    setLifecycleState(state);
  }, [pathname, setLifecycleState]);

  return null;
}
