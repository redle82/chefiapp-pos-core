/**
 * Tipos partilhados pelo menu visual (MenuCatalogPage, MenuDishCard, DishModal)
 * V2: badges, mediaPreview (micro-vídeo), mediaFull; restaurante com tagline e selos.
 */

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  allergens: string[];
  /** V2: selos por prato (chef, tripadvisor, mais_pedido, veggie, novidade) */
  badges?: string[];
  /** V2: URL de micro-vídeo (mp4/webm) ou imagem; fallback imageUrl */
  mediaPreview?: string;
  /** V2: URL de media para modal (vídeo ou imagem grande) */
  mediaFull?: string;
}

export interface CatalogCategory {
  id: string;
  title: string;
  items: CatalogItem[];
}

/** Restaurante para hero premium: tagline + selos flutuantes */
export interface MenuRestaurant {
  name: string;
  logoUrl?: string;
  heroMedia?: string;
  tagline?: string;
  /** Selos: chef, tripadvisor, recomendado, etc. */
  seals?: string[];
  language?: string;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
