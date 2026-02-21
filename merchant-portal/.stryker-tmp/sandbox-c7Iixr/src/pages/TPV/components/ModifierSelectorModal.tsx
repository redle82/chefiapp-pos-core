import React, { useCallback, useMemo, useState } from "react";
import type {
  Modifier,
  ModifierGroup,
} from "../../../core/catalog/catalogTypes";

/** Selected modifier snapshot stored with order item */
export interface SelectedModifier {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  priceDeltaCents: number;
}

interface ModifierSelectorModalProps {
  /** Product being added */
  productName: string;
  /** Groups linked to this product */
  groups: ModifierGroup[];
  /** All modifiers (will be filtered by groupId) */
  modifiers: Modifier[];
  /** Confirm selection */
  onConfirm: (selected: SelectedModifier[]) => void;
  /** Cancel / close */
  onCancel: () => void;
}

/**
 * Modal de seleção de modificadores.
 * Exibido ao adicionar produto com modifierGroupIds > 0 no TPV.
 */
export const ModifierSelectorModal: React.FC<ModifierSelectorModalProps> = ({
  productName,
  groups,
  modifiers,
  onConfirm,
  onCancel,
}) => {
  // Track selected modifier ids per group
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group modifiers by groupId
  const modsByGroup = useMemo(() => {
    const map = new Map<string, Modifier[]>();
    for (const m of modifiers) {
      if (!m.isActive) continue;
      const list = map.get(m.groupId) || [];
      list.push(m);
      map.set(m.groupId, list);
    }
    return map;
  }, [modifiers]);

  // Validation: check min/max per group
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    for (const g of groups) {
      const groupMods = modsByGroup.get(g.id) || [];
      const selectedCount = groupMods.filter((m) =>
        selectedIds.has(m.id),
      ).length;
      if (selectedCount < g.min) {
        errors.push(`"${g.name}" requer mínimo ${g.min} opção(ões)`);
      }
    }
    return errors;
  }, [groups, modsByGroup, selectedIds]);

  const canConfirm = validationErrors.length === 0;

  const toggleModifier = useCallback(
    (mod: Modifier, group: ModifierGroup) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(mod.id)) {
          next.delete(mod.id);
        } else {
          // Enforce max: if single-select (max=1), deselect others in group
          if (group.max === 1) {
            const groupMods = modsByGroup.get(group.id) || [];
            for (const gm of groupMods) next.delete(gm.id);
          } else {
            // Check if at max
            const groupMods = modsByGroup.get(group.id) || [];
            const currentCount = groupMods.filter((m) => next.has(m.id)).length;
            if (currentCount >= group.max) return prev; // at max
          }
          next.add(mod.id);
        }
        return next;
      });
    },
    [modsByGroup],
  );

  const handleConfirm = () => {
    if (!canConfirm) return;
    const selected: SelectedModifier[] = [];
    for (const g of groups) {
      const groupMods = modsByGroup.get(g.id) || [];
      for (const m of groupMods) {
        if (selectedIds.has(m.id)) {
          selected.push({
            id: m.id,
            name: m.name,
            groupId: g.id,
            groupName: g.name,
            priceDeltaCents: m.priceDeltaCents,
          });
        }
      }
    }
    onConfirm(selected);
  };

  const totalDelta = useMemo(() => {
    let sum = 0;
    for (const m of modifiers) {
      if (selectedIds.has(m.id)) sum += m.priceDeltaCents;
    }
    return sum;
  }, [modifiers, selectedIds]);

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Modificadores</h3>
          <p className="mt-0.5 text-sm text-gray-500">{productName}</p>
        </div>

        {/* Body — scrollable */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {groups.map((group) => {
            const groupMods = modsByGroup.get(group.id) || [];
            if (groupMods.length === 0) return null;
            const selectedCount = groupMods.filter((m) =>
              selectedIds.has(m.id),
            ).length;
            const isRequired = group.min > 0;

            return (
              <div key={group.id} className="mb-5 last:mb-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {group.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {isRequired ? "Obrigatório" : "Opcional"} · {selectedCount}/
                    {group.max}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {groupMods.map((mod) => {
                    const isSelected = selectedIds.has(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                          isSelected
                            ? "border-violet-500 bg-violet-50 text-violet-900"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleModifier(mod, group)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-violet-500 bg-violet-500 text-white"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                          <span>{mod.name}</span>
                        </div>
                        {mod.priceDeltaCents !== 0 && (
                          <span
                            className={`text-xs font-medium ${
                              mod.priceDeltaCents > 0
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {mod.priceDeltaCents > 0 ? "+" : ""}
                            {(mod.priceDeltaCents / 100).toFixed(2)} €
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

        {/* Footer */}
        <div className="border-t px-5 py-3">
          {validationErrors.length > 0 && (
            <p className="mb-2 text-xs text-red-500">{validationErrors[0]}</p>
          )}
          {totalDelta !== 0 && (
            <p className="mb-2 text-xs text-gray-500">
              Delta: {totalDelta > 0 ? "+" : ""}
              {(totalDelta / 100).toFixed(2)} €
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                canConfirm
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "cursor-not-allowed bg-gray-300"
              }`}
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
