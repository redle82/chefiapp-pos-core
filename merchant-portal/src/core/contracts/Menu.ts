/**
 * MENU — Contrato Operacional (re-export from domain, Fase 2)
 *
 * Fonte da verdade: src/domain/menu
 * Ver docs/architecture/MENU_BUILDER_CONTRACT_V1.md
 */

export type {
  MenuType,
  MenuItem,
  MenuCategory,
  Menu,
  MenuItemInput,
  MenuStation,
  PrepCategory,
} from "../../domain/menu";

export {
  validateMenuItemInput,
  prepMinutesToSeconds,
} from "../../domain/menu";

export type { MenuValidationResult } from "../../domain/menu";
