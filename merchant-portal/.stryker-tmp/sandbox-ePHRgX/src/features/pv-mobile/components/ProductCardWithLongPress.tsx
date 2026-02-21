/**
 * ProductCardWithLongPress — Enhanced product card with long-press for modifiers
 *
 * Gestures:
 * - TAP: Quick add to cart (no modifiers)
 * - LONG PRESS (500ms+): Open modifiers modal
 *
 * Visual feedback:
 * - Highlight on press
 * - Scale animation on release
 */
// @ts-nocheck


import { motion } from "framer-motion";
import { useState } from "react";
import {
  ModifiersModal,
  type ModifierGroup,
  type SelectedModifier,
} from "./ModifiersModal";

interface ProductCardWithLongPressProps {
  product: {
    id: string;
    name: string;
    price_cents: number;
    image_url?: string | null;
    modifiers?: ModifierGroup[];
  };
  fallbackEmoji?: string;
  onAdd: (modifiers?: SelectedModifier[]) => void;
  onLongPress?: () => void;
  /** Quantity in cart (shows badge when > 0) */
  cartQuantity?: number;
}

export function ProductCardWithLongPress({
  product,
  fallbackEmoji = "🍽️",
  onAdd,
  onLongPress,
  cartQuantity = 0,
}: ProductCardWithLongPressProps) {
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isModifiersOpen, setIsModifiersOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  const priceFormatted = `€${(product.price_cents / 100).toFixed(2)}`;
  const hasModifiers = product.modifiers && product.modifiers.length > 0;
  const inCart = cartQuantity > 0;

  const handlePointerDown = () => {
    setIsPressed(true);

    // Start long-press timer (500ms)
    const timer = setTimeout(() => {
      if (hasModifiers) {
        setIsModifiersOpen(true);
        onLongPress?.();
      }
    }, 500);

    setLongPressTimer(timer);
  };

  const handlePointerUp = () => {
    setIsPressed(false);

    // Cancel timer if released before 500ms
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);

      // Quick add (no modifiers)
      onAdd();
    }
  };

  const handlePointerLeave = () => {
    setIsPressed(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleConfirmModifiers = (selected: SelectedModifier[]) => {
    setIsModifiersOpen(false);
    onAdd(selected);
  };

  return (
    <>
      <motion.article
        className={`pvm-card pvm-card--interactive${
          inCart ? " pvm-card--in-cart" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        animate={{
          scale: isPressed ? 0.95 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        role="button"
        tabIndex={0}
        aria-label={`${product.name}, ${priceFormatted}${
          inCart ? `, ${cartQuantity} no carrinho` : ""
        }${hasModifiers ? ". Pressione e mantenha para opções" : ""}`}
      >
        {/* Cart quantity badge */}
        {inCart && <div className="pvm-card__cart-badge">{cartQuantity}</div>}

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

          {/* Tap indicator */}
          <div className="pvm-card__tap-hint">
            {hasModifiers ? "Pressione ↻" : "+"}
          </div>

          {/* Long-press indicator (appears on long press) */}
          {hasModifiers && isPressed && (
            <motion.div
              className="pvm-card__long-press-indicator"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <span className="pvm-card__long-press-icon">⚙️</span>
            </motion.div>
          )}
        </div>

        <div className="pvm-card__info">
          <h3 className="pvm-card__name">{product.name}</h3>
          <p className="pvm-card__price">{priceFormatted}</p>
          {hasModifiers && <p className="pvm-card__has-mods">Com opções</p>}
        </div>
      </motion.article>

      {/* Modifiers Modal */}
      {hasModifiers && product.modifiers && (
        <ModifiersModal
          isOpen={isModifiersOpen}
          productName={product.name}
          productPrice={product.price_cents}
          groups={product.modifiers}
          onConfirm={handleConfirmModifiers}
          onCancel={() => setIsModifiersOpen(false)}
        />
      )}
    </>
  );
}
