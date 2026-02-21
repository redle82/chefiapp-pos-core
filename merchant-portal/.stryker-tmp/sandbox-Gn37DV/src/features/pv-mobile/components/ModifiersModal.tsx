/**
 * ModifiersModal — Bottom sheet modal for product modifiers
 * Triggered by long-press on product card
 *
 * - Displays modifier groups
 * - Radio/checkbox selection based on group type
 * - Confirm to add to cart with modifiers
 */

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export interface ModifierGroup {
  id: string;
  name: string;
  multiselect: boolean; // true = checkbox, false = radio
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price_delta_cents: number;
}

interface ModifiersModalProps {
  isOpen: boolean;
  productName: string;
  productPrice: number;
  groups: ModifierGroup[];
  onConfirm: (selected: SelectedModifier[]) => void;
  onCancel: () => void;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  modifierId: string;
  name: string;
  priceDeltaCents: number;
}

export function ModifiersModal({
  isOpen,
  productName,
  productPrice,
  groups,
  onConfirm,
  onCancel,
}: ModifiersModalProps) {
  const [selection, setSelection] = useState<Map<string, string[]>>(new Map());

  // Handle modifier selection
  const toggleModifier = (
    groupId: string,
    modifierId: string,
    isMultiselect: boolean,
  ) => {
    const current = selection.get(groupId) ?? [];
    let updated: string[];

    if (isMultiselect) {
      // Checkbox: toggle in array
      updated = current.includes(modifierId)
        ? current.filter((id) => id !== modifierId)
        : [...current, modifierId];
    } else {
      // Radio: replace
      updated = current.includes(modifierId) ? [] : [modifierId];
    }

    const newSelection = new Map(selection);
    if (updated.length === 0) {
      newSelection.delete(groupId);
    } else {
      newSelection.set(groupId, updated);
    }
    setSelection(newSelection);
  };

  // Calculate total price
  const modifierPriceDelta = Array.from(selection.entries()).reduce(
    (sum, [groupId, modifierIds]) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return sum;

      return (
        sum +
        modifierIds.reduce((groupSum, modifierId) => {
          const mod = group.modifiers.find((m) => m.id === modifierId);
          return groupSum + (mod?.price_delta_cents ?? 0);
        }, 0)
      );
    },
    0,
  );

  const totalPrice = productPrice + modifierPriceDelta;

  // Build selected modifiers array
  const handleConfirm = () => {
    const selected: SelectedModifier[] = [];

    for (const [groupId, modifierIds] of selection.entries()) {
      const group = groups.find((g) => g.id === groupId);
      if (!group) continue;

      for (const modifierId of modifierIds) {
        const mod = group.modifiers.find((m) => m.id === modifierId);
        if (mod) {
          selected.push({
            groupId,
            groupName: group.name,
            modifierId,
            name: mod.name,
            priceDeltaCents: mod.price_delta_cents,
          });
        }
      }
    }

    onConfirm(selected);
    setSelection(new Map());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="pvm-modifiers-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Modal Sheet */}
          <motion.div
            className="pvm-modifiers-sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="pvm-modifiers-sheet__header">
              <h2 className="pvm-modifiers-sheet__title">{productName}</h2>
              <button
                className="pvm-modifiers-sheet__close"
                onClick={onCancel}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Groups */}
            <div className="pvm-modifiers-sheet__groups">
              {groups.length === 0 ? (
                <div className="pvm-modifiers-sheet__empty">
                  <p>Nenhuma opção disponível</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="pvm-modifiers-group">
                    <h3 className="pvm-modifiers-group__title">{group.name}</h3>
                    <div className="pvm-modifiers-group__items">
                      {group.modifiers.map((modifier) => {
                        const isSelected = (
                          selection.get(group.id) ?? []
                        ).includes(modifier.id);
                        const priceLabel =
                          modifier.price_delta_cents > 0
                            ? `+€${(modifier.price_delta_cents / 100).toFixed(
                                2,
                              )}`
                            : modifier.price_delta_cents < 0
                            ? `-€${Math.abs(
                                modifier.price_delta_cents / 100,
                              ).toFixed(2)}`
                            : null;

                        return (
                          <label
                            key={modifier.id}
                            className={`pvm-modifiers-item ${
                              isSelected ? "pvm-modifiers-item--selected" : ""
                            }`}
                          >
                            <input
                              type={group.multiselect ? "checkbox" : "radio"}
                              name={`group-${group.id}`}
                              checked={isSelected}
                              onChange={() =>
                                toggleModifier(
                                  group.id,
                                  modifier.id,
                                  group.multiselect,
                                )
                              }
                              className="pvm-modifiers-item__input"
                            />
                            <div className="pvm-modifiers-item__content">
                              <span className="pvm-modifiers-item__name">
                                {modifier.name}
                              </span>
                              {priceLabel && (
                                <span className="pvm-modifiers-item__price">
                                  {priceLabel}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pvm-modifiers-sheet__footer">
              <div className="pvm-modifiers-sheet__summary">
                <span className="pvm-modifiers-sheet__price-label">Total:</span>
                <span className="pvm-modifiers-sheet__price">
                  €{(totalPrice / 100).toFixed(2)}
                </span>
              </div>
              <button
                className="pvm-modifiers-sheet__confirm"
                onClick={handleConfirm}
              >
                ✓ Adicionar ao Carrinho
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
