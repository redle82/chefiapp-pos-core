/**
 * MobileProductGrid — 2-column product grid for mobile
 *
 * - Uses ProductCardWithLongPress for long-press modifier support
 * - Category emojis
 * - Empty state handling
 */

import type { MobileCartItem } from "../hooks/useMobileCart";
import type { ModifierGroup, SelectedModifier } from "./ModifiersModal";
import { ProductCardWithLongPress } from "./ProductCardWithLongPress";

export interface MobileProduct {
  id: string;
  name: string;
  price_cents: number;
  image_url?: string | null;
  category_name?: string;
  category_id?: string;
  modifiers?: ModifierGroup[];
}

interface MobileProductGridProps {
  products: MobileProduct[];
  onAddProduct: (
    product: MobileProduct,
    modifiers?: SelectedModifier[],
  ) => void;
  /** Cart items to show quantity badges */
  cartItems?: MobileCartItem[];
}

// Category to emoji mapping
const CATEGORY_EMOJIS: Record<string, string> = {
  tapas: "🥗",
  entradas: "🥗",
  pizzas: "🍕",
  burgers: "🍔",
  hamburguer: "🍔",
  gastroburger: "🍔",
  carnes: "🥩",
  peixes: "🐟",
  sobremesas: "🍰",
  desserts: "🍰",
  bebidas: "🍹",
  drinks: "🍹",
  saladas: "🥗",
  massas: "🍝",
  sopas: "🍲",
};

function getCategoryEmoji(categoryName?: string): string {
  if (!categoryName) return "🍽️";
  const key = categoryName.toLowerCase();
  for (const [pattern, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (key.includes(pattern)) return emoji;
  }
  return "🍽️";
}

export function MobileProductGrid({
  products,
  onAddProduct,
  cartItems = [],
}: MobileProductGridProps) {
  // Build map of product_id -> quantity for quick lookup
  const cartQuantityMap = new Map<string, number>();
  for (const item of cartItems) {
    cartQuantityMap.set(item.product_id, item.quantity);
  }

  if (products.length === 0) {
    return (
      <div className="pvm-grid pvm-empty-state">
        <div className="pvm-empty-state__content">
          <span className="pvm-empty-state__icon">🔍</span>
          <p className="pvm-empty-state__text">Nenhum produto encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pvm-grid">
      {products.map((product) => (
        <ProductCardWithLongPress
          key={product.id}
          product={product}
          fallbackEmoji={getCategoryEmoji(product.category_name)}
          onAdd={(modifiers) => onAddProduct(product, modifiers)}
          cartQuantity={cartQuantityMap.get(product.id)}
        />
      ))}
    </div>
  );
}
