/**
 * MENU — Contrato Operacional
 *
 * FASE 4: Menu como Eixo de Produção
 * Ver docs/architecture/MENU_BUILDER_CONTRACT_V1.md para matriz, preset por tipo e UX.
 *
 * Menu não é só catálogo. É contrato operacional.
 * Cada item define comportamento do sistema:
 * - Tempo de preparo
 * - Estação (BAR / COZINHA)
 * - Impacto no KDS
 * - Impacto no cliente
 * - Impacto nos relatórios
 * Presets são ORE-governados; canon_id/system_provided permitem preset e canon sem alterar fluxo manual.
 */
// @ts-nocheck


/**
 * Tipo de menu (ajuda em métricas futuras)
 */
export type MenuType = "RESTAURANT" | "BAR" | "CAFE";

/**
 * Item do menu (produto com contrato operacional)
 */
export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description?: string | null;
  price_cents: number;

  // CONTRATO OPERACIONAL (obrigatório)
  station: "BAR" | "KITCHEN"; // Estação responsável
  prep_time_seconds: number; // Tempo de preparo em segundos (obrigatório)
  prep_category?: "drink" | "starter" | "main" | "dessert" | null;

  // Status
  available: boolean;

  // Preset/canon e marcas (opcional; ver MENU_BUILDER_CONTRACT_V1.md)
  canon_id?: string | null;
  system_provided?: boolean;
  brand_id?: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Categoria do menu
 */
export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

/**
 * Menu completo (categorias + itens)
 */
export interface Menu {
  restaurant_id: string;
  categories: MenuCategory[];
  items: MenuItem[];
}

/**
 * Input para criar/atualizar item do menu
 */
export interface MenuItemInput {
  id?: string;
  name: string;
  description?: string | null;
  price_cents: number;
  category_id?: string | null;

  // CONTRATO OPERACIONAL (obrigatório)
  station: "BAR" | "KITCHEN";
  prep_time_minutes: number; // Em minutos (mais fácil para usuário)
  prep_category?: "drink" | "starter" | "main" | "dessert";

  available?: boolean;

  // Preset/canon e marcas (opcional; ver MENU_BUILDER_CONTRACT_V1.md)
  canon_id?: string | null;
  system_provided?: boolean;
  brand_id?: string | null;
}

/**
 * Validação de item do menu
 */
export function validateMenuItemInput(item: MenuItemInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!item.name || item.name.trim().length === 0) {
    errors.push("Nome é obrigatório");
  }

  if (item.price_cents < 0) {
    errors.push("Preço deve ser maior ou igual a zero");
  }

  if (!item.station || (item.station !== "BAR" && item.station !== "KITCHEN")) {
    errors.push("Estação é obrigatória (BAR ou KITCHEN)");
  }

  if (!item.prep_time_minutes || item.prep_time_minutes <= 0) {
    errors.push("Tempo de preparo é obrigatório e deve ser maior que zero");
  }

  if (item.prep_time_minutes && item.prep_time_minutes > 60) {
    errors.push("Tempo de preparo não pode ser maior que 60 minutos");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
