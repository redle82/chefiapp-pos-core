/**
 * OperationalContext — Contrato de UI Operacional (OUC)
 *
 * Toda tela do ChefIApp OS recebe este contexto quando roda dentro do Shell.
 * Ver: docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
 */
// @ts-nocheck


import { createContext, useContext, type ReactNode } from "react";

export type SystemMode = "trial" | "pilot" | "live";
export type OperationalRole = "owner" | "manager" | "staff";
export type UIDensity = "compact" | "standard";

export interface OperationalContextValue {
  /** Módulo ativo na árvore (ex: "tasks", "tpv", "kds"). */
  activeModule: string | null;
  /** Modo do sistema (trial / piloto / ao vivo). */
  systemMode: SystemMode;
  /** Papel do utilizador. */
  role: OperationalRole | null;
  /** Densidade de UI (opcional). */
  uiDensity: UIDensity;
  /** ID do restaurante (obrigatório em contexto operacional). */
  restaurantId: string | null;
}

const defaultContext: OperationalContextValue = {
  activeModule: null,
  systemMode: "trial",
  role: null,
  uiDensity: "standard",
  restaurantId: null,
};

export const OperationalContext =
  createContext<OperationalContextValue>(defaultContext);

export function useOperationalContext(): OperationalContextValue {
  return useContext(OperationalContext);
}

/** Provider: injeta o contexto para todos os painéis do OS. */
export function OperationalContextProvider({
  value,
  children,
}: {
  value: OperationalContextValue;
  children: ReactNode;
}) {
  return (
    <OperationalContext.Provider value={value}>
      {children}
    </OperationalContext.Provider>
  );
}
