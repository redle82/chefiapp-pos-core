/**
 * Types for Config Tree components
 */
// @ts-nocheck


export type ConfigSection =
  | "general"
  | "ubicaciones"
  | "identity"
  | "location"
  | "schedule"
  | "menu"
  | "inventory"
  | "people"
  | "payments"
  | "integrations"
  | "status";

/** Grupos da árvore de config (CONFIG_WEB_UX). */
export type ConfigSectionGroup =
  | "Basics"
  | "Operação"
  | "Comercial"
  | "Publicação"
  | "Avançado"
  | "Outros";

export interface ConfigSectionConfig {
  id: ConfigSection | string;
  label: string;
  icon: string;
  description?: string;
  path: string;
  /** Grupo para separadores na sidebar (docs/contracts/CONFIG_WEB_UX.md). */
  group?: ConfigSectionGroup;
  children?: ConfigSectionConfig[];
}
