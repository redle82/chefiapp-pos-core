/**
 * CartBottomSheet — Expandable bottom sheet cart for PV Mobile
 *
 * Collapsed: Shows item count + total (swipe up to expand)
 * Expanded: Full cart with items, quantities, totals, submit button (swipe down to collapse)
 *
 * Mobile-native features:
 * - Drag gestures with framer-motion
 * - 56px touch targets
 * - Thumb-zone optimized
 * - Phase 5: Inline modifier editing with FloatingModifierBar
 */
// @ts-nocheck


import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MobileCartItem, MobileCartProduct } from "../hooks/useMobileCart";
import type { Modifier, ModifierGroup } from "./ModifiersModal";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "./PaymentMethodSelector";

// Product type with modifier groups for inline editing
interface ProductWithModifierGroups
  extends Omit<MobileCartProduct, "modifiers"> {
  modifiers?: ModifierGroup[];
}

interface CartBottomSheetProps {
  items: MobileCartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  isSending: boolean;
  orderMode: "take_away" | "dine_in" | "delivery";
  selectedPaymentMethod: PaymentMethod | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClear: () => void;
  onSendToKitchen: (paymentMethod?: PaymentMethod) => void;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
  onUpdateItemModifiers?: (
    productId: string,
    modifiers: Array<{
      groupId: string;
      groupName: string;
      modifierId: string;
      name: string;
      priceDeltaCents: number;
    }>,
  ) => void;
  availableProducts?: MobileCartProduct[];
}

export function CartBottomSheet({
  items,
  itemCount,
  subtotal,
  tax,
  total,
  isSending,
  orderMode,
  selectedPaymentMethod,
  onUpdateQuantity,
  onClear,
  onSendToKitchen,
  onPaymentMethodChange,
  onUpdateItemModifiers,
  availableProducts = [],
}: CartBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animateBadge, setAnimateBadge] = useState(false);
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<
    string | null
  >(null);
  const prevCount = useRef(itemCount);
  const dragControls = useDragControls();

  // Animate badge when item count increases (no auto-open — let user add multiple products)
  useEffect(() => {
    if (itemCount > prevCount.current && itemCount > 0) {
      // Only animate badge, don't auto-open (user can swipe up to view cart)
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 300);
      return () => clearTimeout(timer);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  const handleSubmit = useCallback(() => {
    // Phase 6: Pass payment method for dine_in orders
    if (orderMode === "dine_in" && selectedPaymentMethod) {
      onSendToKitchen(selectedPaymentMethod);
    } else {
      onSendToKitchen();
    }
    setIsOpen(false);
  }, [orderMode, selectedPaymentMethod, onSendToKitchen]);

  // Drag threshold (pixels) - swipe up > 50px to open, down > 50px to close
  const handleDragEnd = (_event: unknown, info: { offset: { y: number } }) => {
    if (!isOpen && info.offset.y < -50) {
      // Swipe up to open
      setIsOpen(true);
    } else if (isOpen && info.offset.y > 50) {
      // Swipe down to close
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Collapsed bar - swipe up to expand */}
      {!isOpen && (
        <motion.div
          className="pvm-cart-collapsed"
          onClick={() => setIsOpen(true)}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
        >
          <div className="pvm-cart-collapsed__info">
            <span
              className={`pvm-cart-collapsed__badge ${
                animateBadge ? "pvm-cart-collapsed__badge--bounce" : ""
              }`}
            >
              {itemCount}
            </span>
            <span className="pvm-cart-collapsed__text">
              {itemCount === 0
                ? "Carrinho vazio"
                : itemCount === 1
                ? "1 item"
                : `${itemCount} itens`}
            </span>
          </div>
          <span className="pvm-cart-collapsed__total">
            €{(total / 100).toFixed(2)}
          </span>
        </motion.div>
      )}

      {/* Overlay */}
      <motion.div
        className="pvm-sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Expanded sheet - swipe down to collapse */}
      <motion.div
        className="pvm-sheet"
        initial={{ y: "100%" }}
        animate={{ y: isOpen ? "0%" : "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <div
          className="pvm-sheet__handle"
          onPointerDown={(e) => dragControls.start(e)}
          role="button"
          tabIndex={0}
          aria-label="Arrastar para fechar"
        />

        <div className="pvm-sheet__header">
          <h2 className="pvm-sheet__title">Carrinho ({itemCount})</h2>
          {items.length > 0 && (
            <button className="pvm-sheet__clear" onClick={onClear}>
              Limpar
            </button>
          )}
        </div>

        <div className="pvm-sheet__items">
          {items.length === 0 ? (
            <div className="pvm-sheet__empty">
              <span className="pvm-sheet__empty-icon">🛒</span>
              <p>Carrinho vazio</p>
              <p className="pvm-cart-item__hint">
                Toque num produto para adicionar
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.product_id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onTapModifiers={() =>
                  setSelectedItemForModifiers(item.product_id)
                }
                isSelected={selectedItemForModifiers === item.product_id}
              />
            ))
          )}
        </div>

        {/* Phase 5: FloatingModifierBar for inline editing */}
        <AnimatePresence>
          {selectedItemForModifiers && (
            <FloatingModifierBar
              item={
                items.find((i) => i.product_id === selectedItemForModifiers)!
              }
              product={
                availableProducts.find(
                  (p) => p.id === selectedItemForModifiers,
                ) as ProductWithModifierGroups | undefined
              }
              onClose={() => setSelectedItemForModifiers(null)}
              onUpdateModifiers={(newModifiers) => {
                onUpdateItemModifiers?.(selectedItemForModifiers, newModifiers);
                setSelectedItemForModifiers(null);
              }}
            />
          )}
        </AnimatePresence>

        <div className="pvm-sheet__footer">
          <div className="pvm-sheet__totals">
            <div className="pvm-sheet__row">
              <span>Subtotal</span>
              <span>€{(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="pvm-sheet__row">
              <span>IVA (5%)</span>
              <span>€{(tax / 100).toFixed(2)}</span>
            </div>
            <div className="pvm-sheet__row pvm-sheet__row--total">
              <span>Total</span>
              <span>€{(total / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Phase 6: Payment method selector (only for dine_in) */}
          {orderMode === "dine_in" && (
            <PaymentMethodSelector
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={onPaymentMethodChange || (() => {})}
            />
          )}

          <button
            className="pvm-sheet__submit"
            onClick={handleSubmit}
            disabled={
              items.length === 0 ||
              isSending ||
              (orderMode === "dine_in" && !selectedPaymentMethod)
            }
          >
            {isSending ? "Enviando..." : "🔥 Enviar para Cozinha"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ═══ Cart Item Row ═══ */
interface CartItemProps {
  item: MobileCartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onTapModifiers?: () => void;
  isSelected?: boolean;
}

function CartItem({
  item,
  onUpdateQuantity,
  onTapModifiers,
  isSelected,
}: CartItemProps) {
  return (
    <div
      className={`pvm-cart-item ${isSelected ? "pvm-cart-item--selected" : ""}`}
    >
      <div className="pvm-cart-item__image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} />
        ) : (
          <div className="pvm-cart-item__image-placeholder">🍽️</div>
        )}
      </div>
      <div className="pvm-cart-item__info">
        <p className="pvm-cart-item__name">{item.name}</p>
        <p className="pvm-cart-item__price">
          €{(item.unit_price / 100).toFixed(2)}
        </p>
        {/* Phase 5: Show modifiers */}
        {item.modifiers && item.modifiers.length > 0 && (
          <div className="pvm-cart-item__modifiers">
            {item.modifiers.map((mod) => (
              <span
                key={`${mod.groupId}-${mod.modifierId}`}
                className="pvm-cart-item__modifier-tag"
              >
                {mod.name}
              </span>
            ))}
          </div>
        )}
        {/* Phase 5: Tap-to-edit affordance */}
        {onTapModifiers && (
          <button
            className="pvm-cart-item__edit-modifiers"
            onClick={onTapModifiers}
            aria-label="Editar modificadores"
          >
            ✎ Modificadores
          </button>
        )}
      </div>
      <div className="pvm-cart-item__controls">
        <button
          className="pvm-cart-item__btn"
          onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <span className="pvm-cart-item__qty">{item.quantity}</span>
        <button
          className="pvm-cart-item__btn"
          onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
    </div>
  );
}
/* ═══ Phase 5: FloatingModifierBar ═══ */
interface FloatingModifierBarProps {
  item: MobileCartItem;
  product?: ProductWithModifierGroups;
  onClose: () => void;
  onUpdateModifiers: (
    newModifiers: Array<{
      groupId: string;
      groupName: string;
      modifierId: string;
      name: string;
      priceDeltaCents: number;
    }>,
  ) => void;
}

function FloatingModifierBar({
  item,
  product,
  onClose,
  onUpdateModifiers,
}: FloatingModifierBarProps) {
  const [selectedModifiers, setSelectedModifiers] = useState(
    item.modifiers || [],
  );

  // TODO: Proper ModifierGroup[] fetching needed for inline editing
  // Current product.modifiers is empty array - FloatingModifierBar disabled until proper implementation
  if (!product?.modifiers || product.modifiers.length === 0) {
    return null;
  }

  const handleModifierToggle = (
    groupId: string,
    groupName: string,
    modifierId: string,
    modifierName: string,
    priceDeltaCents: number,
    isExclusive: boolean,
  ) => {
    setSelectedModifiers((prev) => {
      let newMods = [...prev];

      if (isExclusive) {
        // Radio: remove other modifiers in same group
        newMods = newMods.filter((m) => m.groupId !== groupId);
        newMods.push({
          groupId,
          groupName,
          modifierId,
          name: modifierName,
          priceDeltaCents,
        });
      } else {
        // Checkbox: toggle
        const exists = newMods.find((m) => m.modifierId === modifierId);
        if (exists) {
          newMods = newMods.filter((m) => m.modifierId !== modifierId);
        } else {
          newMods.push({
            groupId,
            groupName,
            modifierId,
            name: modifierName,
            priceDeltaCents,
          });
        }
      }

      return newMods;
    });
  };

  const handleConfirm = () => {
    onUpdateModifiers(selectedModifiers);
  };

  return (
    <motion.div
      className="pvm-floating-modifier-bar"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="pvm-floating-modifier-bar__header">
        <h3>Editar Modificadores</h3>
        <button
          className="pvm-floating-modifier-bar__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="pvm-floating-modifier-bar__content">
        {product.modifiers.map((group) => {
          const groupModifiers = group.modifiers || [];
          const isExclusive = !group.multiselect; // multiselect: false = exclusive (radio)

          return (
            <div key={group.id} className="pvm-floating-modifier-group">
              <p className="pvm-floating-modifier-group__label">
                {group.name}
                {isExclusive && " (1 escolha)"}
              </p>
              <div className="pvm-floating-modifier-group__items">
                {groupModifiers.map((mod: Modifier) => {
                  const isSelected = selectedModifiers.some(
                    (m) => m.modifierId === mod.id,
                  );
                  return (
                    <button
                      key={mod.id}
                      className={`pvm-floating-modifier-item ${
                        isSelected ? "pvm-floating-modifier-item--selected" : ""
                      }`}
                      onClick={() =>
                        handleModifierToggle(
                          group.id,
                          group.name,
                          mod.id,
                          mod.name,
                          mod.price_delta_cents || 0,
                          isExclusive,
                        )
                      }
                    >
                      <span className="pvm-floating-modifier-item__checkbox">
                        {isExclusive ? "◯" : "☐"}
                      </span>
                      <span className="pvm-floating-modifier-item__name">
                        {mod.name}
                      </span>
                      {mod.price_delta_cents && mod.price_delta_cents > 0 && (
                        <span className="pvm-floating-modifier-item__price">
                          +€{(mod.price_delta_cents / 100).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pvm-floating-modifier-bar__footer">
        <button
          className="pvm-floating-modifier-bar__btn pvm-floating-modifier-bar__btn--secondary"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="pvm-floating-modifier-bar__btn pvm-floating-modifier-bar__btn--primary"
          onClick={handleConfirm}
        >
          ✓ Confirmar
        </button>
      </div>
    </motion.div>
  );
}
