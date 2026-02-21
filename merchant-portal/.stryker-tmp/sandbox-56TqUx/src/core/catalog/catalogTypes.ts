/**
 * Catálogo — Modelo de domínio para o Admin
 *
 * Importante: aqui modelamos a visão de \"Catálogo\" para o backoffice,
 * não o contrato operacional completo do Menu (ver core/contracts/Menu.ts).
 *
 * Princípios:
 * - Produto é único no sistema.
 * - Catálogos representam contextos/regras (visibilidade, preços, canais).
 * - Atribuições ligam marca/canal/plataforma a um catálogo.
 */
// @ts-nocheck


export type SalesChannel = "LOCAL" | "TAKEAWAY" | "DELIVERY";

export type ExternalPlatform = "UBER" | "GLOVO" | "JUSTEAT" | "SHOP";

export interface CatalogContext {
  id: string;
  /** Nome visível para o operador (ex.: \"Carta Principal\", \"Delivery Uber\" ) */
  name: string;
  /** Marca à qual o catálogo pertence; null = catálogo global */
  brandId: string | null;
  /** Canais em que este catálogo está potencialmente disponível */
  destinations: SalesChannel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogAssignment {
  /** ID sintético apenas para UI */
  id: string;
  brandId: string;
  channel: SalesChannel;
  platform?: ExternalPlatform;
  /** Catálogo selecionado para esta combinação; null = não configurado */
  catalogId: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  categoryId: string | null;
  /** Preço base em cêntimos (sem regras dinâmicas) */
  basePriceCents: number;
  isActive: boolean;
  /** Estação de preparo: BAR ou KITCHEN — alinhado com Menu Builder e KDS */
  station?: "BAR" | "KITCHEN";
  /** Impressora lógica ou fila de saída (quando configurado) */
  printerId?: string | null;
  modifierGroupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  createdAt: string;
  updatedAt: string;
}

export interface Modifier {
  id: string;
  groupId: string;
  name: string;
  /** Delta de preço em cêntimos (pode ser negativo) */
  priceDeltaCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComboItemRef {
  productId: string;
  quantity: number;
  /** Opcionalmente, grupos de modificadores incluídos neste slot */
  includedModifierGroupIds?: string[];
}

export interface Combo {
  id: string;
  name: string;
  /** Preço total fixo do combo em cêntimos */
  priceCents: number;
  isActive: boolean;
  items: ComboItemRef[];
  createdAt: string;
  updatedAt: string;
}

export type TranslatableEntityType =
  | "product"
  | "category"
  | "modifier"
  | "modifierGroup"
  | "combo";

export interface TranslationItem {
  id: string;
  entityType: TranslatableEntityType;
  entityId: string;
  /** Código ISO do idioma, ex.: 'es-ES', 'en-GB', 'pt-PT' */
  locale: string;
  /** Campo traduzido (ex.: 'name', 'description') */
  field: string;
  /** Texto traduzido */
  value: string;
  createdAt: string;
  updatedAt: string;
}
