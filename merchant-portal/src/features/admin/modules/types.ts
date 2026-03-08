/**
 * Tipos para o Hub Módulos (ativar/abrir módulos).
 * Ref: plano página_mis_productos_módulos
 */

export type ModuleStatus = "active" | "inactive" | "needs_setup" | "locked";

export type PrimaryAction = "Activate" | "Configure" | "Open" | "Upgrade";

export interface Module {
  id: string;
  name: string;
  description: string;
  platform?: "desktop" | "mobile" | "web";
  status: ModuleStatus;
  icon: string;
  primaryAction: PrimaryAction;
  primaryLabelOverride?: string;
  deviceStatusLabel?: string;
  secondaryAction?: "Desactivar";
  dependencies?: string[];
  /** Bloco para ordenação: "essenciais" | "canais" */
  block?: "essenciais" | "canais";
}
