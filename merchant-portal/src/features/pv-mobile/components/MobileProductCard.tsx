/**
 * MobileProductCard — Compact product card for 2-column grid
 *
 * - Square image
 * - Name (1 line, truncated)
 * - Price
 * - Add button (+)
 */

import { useState } from "react";
import { useCurrency } from "../../../core/currency/useCurrency";

interface MobileProductCardProps {
  product: {
    id: string;
    name: string;
    price_cents: number;
    image_url?: string | null;
  };
  fallbackEmoji?: string;
  onAdd: () => void;
}

export function MobileProductCard({
  product,
  fallbackEmoji = "🍽️",
  onAdd,
}: MobileProductCardProps) {
  const { formatAmount } = useCurrency();
  const [imageError, setImageError] = useState(false);
  const priceFormatted = formatAmount(product.price_cents);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd();
  };

  return (
    <article className="pvm-card" onClick={onAdd}>
      <div className="pvm-card__image">
        {product.image_url && !imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="pvm-card__image-placeholder">{fallbackEmoji}</div>
        )}
        <button
          className="pvm-card__add"
          onClick={handleAddClick}
          aria-label={`Adicionar ${product.name}`}
        >
          +
        </button>
      </div>
      <div className="pvm-card__info">
        <h3 className="pvm-card__name">{product.name}</h3>
        <p className="pvm-card__price">{priceFormatted}</p>
      </div>
    </article>
  );
}
