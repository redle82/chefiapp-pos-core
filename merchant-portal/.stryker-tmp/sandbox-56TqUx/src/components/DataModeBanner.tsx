/**
 * DataModeBanner — CONTRATO_TRIAL_REAL: não mostrar "Dados de exemplo" como estado principal.
 *
 * Trial 14 dias é o modo de entrada; copy única por SystemState (SETUP/TRIAL/ACTIVE/SUSPENDED).
 * Este componente não exibe banner para evitar estado "trial" na UI.
 */
// @ts-nocheck


import type { DataMode } from "../context/RestaurantRuntimeContext";

export interface DataModeBannerProps {
  dataMode: DataMode;
}

export function DataModeBanner(_props: DataModeBannerProps) {
  return null;
}
