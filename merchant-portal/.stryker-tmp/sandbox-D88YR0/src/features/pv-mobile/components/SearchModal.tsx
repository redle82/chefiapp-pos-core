/**
 * SearchModal — Fullscreen search modal for products
 */

import { useEffect, useRef, useState } from "react";

interface MobileProduct {
  id: string;
  name: string;
  price_cents: number;
  image_url?: string | null;
  category_name?: string;
  category_id?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MobileProduct[];
  onSelectProduct: (product: MobileProduct) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const filtered = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (product: MobileProduct) => {
    onSelectProduct(product);
    setQuery("");
    onClose();
  };

  return (
    <div
      className={`pvm-search-modal ${isOpen ? "pvm-search-modal--open" : ""}`}
    >
      <div className="pvm-search-modal__header">
        <input
          ref={inputRef}
          type="text"
          className="pvm-search-modal__input"
          placeholder="Pesquisar produtos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="pvm-search-modal__cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>

      <div className="pvm-search-modal__results">
        {query.trim() && filtered.length === 0 && (
          <div className="pvm-search-modal__no-results">
            <span className="pvm-search-modal__no-results-icon">🔍</span>
            <p>Nenhum produto encontrado</p>
          </div>
        )}

        {filtered.map((product) => (
          <div
            key={product.id}
            className="pvm-cart-item pvm-search-modal__result-item"
            onClick={() => handleSelect(product)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleSelect(product)}
            aria-label={`Adicionar ${product.name}`}
          >
            <div className="pvm-cart-item__image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="pvm-cart-item__image-placeholder">🍽️</div>
              )}
            </div>
            <div className="pvm-cart-item__info">
              <p className="pvm-cart-item__name">{product.name}</p>
              <p className="pvm-cart-item__price">
                €{(product.price_cents / 100).toFixed(2)}
              </p>
            </div>
            <span
              className="pvm-card__add pvm-search-modal__result-add"
              aria-hidden="true"
            >
              +
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
