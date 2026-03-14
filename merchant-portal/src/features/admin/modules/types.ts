/**
 * Tipos para o Hub Módulos (ativar/abrir módulos).
 * Ref: plano página_mis_productos_módulos
 */

export type ModuleStatus =
  | "active"
  | "inactive"
  | "needs_setup"
  | "locked";

export type PrimaryAction =
  | "Activate"
  | "Configure"
  | "Open"
  | "Upgrade"
  | "ManageDevices";

export interface Module {
  id: string;
  name: string;
  description: string;
  status: ModuleStatus;
  icon: string;
  primaryAction: PrimaryAction;
  secondaryAction?: "Desactivar";
  dependencies?: string[];
  /** Bloco para ordenação: "essenciais" | "canais" */
  block?: "essenciais" | "canais";
}
