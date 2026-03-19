/**
 * WasteLogModal — Modal for recording waste from the inventory page.
 *
 * Fields: product (search/select), quantity, unit, reason (dropdown),
 * notes, auto-calculated cost. Dark theme with amber accents.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import {
  WASTE_REASONS,
  wasteTrackingService,
  type WasteReason,
} from "../../../core/inventory/WasteTrackingService";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface IngredientOption {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number; // cents
}

interface LocationOption {
  id: string;
  name: string;
}

interface WasteLogModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9000,
  padding: 16,
};

const modal: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: 12,
  maxWidth: 520,
  width: "100%",
  maxHeight: "90vh",
  overflow: "auto",
  padding: 24,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#f5f5f5",
  marginBottom: 20,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#a3a3a3",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #404040",
  background: "#262626",
  color: "#e5e5e5",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  cursor: "pointer",
};

const fieldGroup: React.CSSProperties = {
  marginBottom: 16,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
};

const costBanner: React.CSSProperties = {
  background: "#292211",
  border: "1px solid #78350f",
  borderRadius: 8,
  padding: "10px 14px",
  marginBottom: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const costLabel: React.CSSProperties = {
  fontSize: 13,
  color: "#d97706",
  fontWeight: 500,
};

const costValue: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#fbbf24",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  background: "#d97706",
  color: "#1a1a1a",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  flex: 1,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid #404040",
  background: "transparent",
  color: "#a3a3a3",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WasteLogModal({ open, onClose, onSuccess }: WasteLogModalProps) {
  const { t } = useTranslation("operational");
  const { symbol: currencySymbol } = useCurrency();
  const { identity } = useRestaurantIdentity();
  const restaurantId =
    identity?.restaurantId || "00000000-0000-0000-0000-000000000100";

  // Data
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  // Form state
  const [ingredientId, setIngredientId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<WasteReason>("expired");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  // Load ingredients and locations
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        const [{ data: ingData }, { data: locData }, { data: stockData }] =
          await Promise.all([
            dockerCoreClient
              .from("gm_ingredients")
              .select("id, name, unit")
              .eq("restaurant_id", restaurantId)
              .order("name", { ascending: true }),
            dockerCoreClient
              .from("gm_locations")
              .select("id, name")
              .eq("restaurant_id", restaurantId)
              .order("name", { ascending: true }),
            dockerCoreClient
              .from("gm_stock_levels")
              .select("ingredient_id, unit_cost")
              .eq("restaurant_id", restaurantId),
          ]);

        // Build cost map from stock levels
        const costMap = new Map<string, number>();
        for (const s of stockData || []) {
          const cost = Number(s.unit_cost || 0);
          if (cost > 0) costMap.set(s.ingredient_id, cost);
        }

        setIngredients(
          (ingData || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            unit: i.unit || "unit",
            costPerUnit: costMap.get(i.id) || 0,
          })),
        );
        setLocations(
          (locData || []).map((l: any) => ({ id: l.id, name: l.name })),
        );
      } catch {
        // Silent load failure
      }
    };

    load();
  }, [open, restaurantId]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setIngredientId("");
      setLocationId("");
      setQuantity("");
      setReason("expired");
      setNotes("");
      setErrorMsg("");
      setSearch("");
    }
  }, [open]);

  const selectedIngredient = useMemo(
    () => ingredients.find((i) => i.id === ingredientId),
    [ingredients, ingredientId],
  );

  const qtyValue = parseFloat(quantity.replace(",", ".")) || 0;
  const estimatedCostCents =
    selectedIngredient
      ? Math.round(qtyValue * selectedIngredient.costPerUnit * 100)
      : 0;

  const filteredIngredients = useMemo(() => {
    if (!search.trim()) return ingredients;
    const q = search.toLowerCase();
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, search]);

  const canSubmit =
    ingredientId && qtyValue > 0 && reason && !saving;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setSaving(true);
      setErrorMsg("");

      try {
        await wasteTrackingService.recordWaste({
          restaurantId,
          ingredientId,
          locationId: locationId || undefined,
          quantity: qtyValue,
          unit: selectedIngredient?.unit || "unit",
          reason,
          costCents: estimatedCostCents,
          notes: notes.trim() || undefined,
        });

        onSuccess?.();
        onClose();
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : t("waste.errorRecording", { defaultValue: "Failed to record waste" }),
        );
      } finally {
        setSaving(false);
      }
    },
    [
      canSubmit,
      restaurantId,
      ingredientId,
      locationId,
      qtyValue,
      selectedIngredient,
      reason,
      estimatedCostCents,
      notes,
      onSuccess,
      onClose,
      t,
    ],
  );

  if (!open) return null;

  return (
    <div
      style={overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div style={modal}>
        <div style={titleStyle}>
          {t("waste.modalTitle", { defaultValue: "Log Waste" })}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Product search/select */}
          <div style={fieldGroup}>
            <label style={labelStyle}>
              {t("waste.fieldProduct", { defaultValue: "Product / Ingredient" })}
            </label>
            <input
              type="text"
              style={inputStyle}
              placeholder={t("waste.searchPlaceholder", {
                defaultValue: "Search ingredient...",
              })}
              value={ingredientId ? selectedIngredient?.name || "" : search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIngredientId("");
              }}
            />
            {!ingredientId && search.trim() && filteredIngredients.length > 0 && (
              <div
                style={{
                  background: "#262626",
                  border: "1px solid #404040",
                  borderRadius: 8,
                  maxHeight: 160,
                  overflow: "auto",
                  marginTop: 4,
                }}
              >
                {filteredIngredients.slice(0, 10).map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => {
                      setIngredientId(ing.id);
                      setSearch("");
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      color: "#e5e5e5",
                      fontSize: 13,
                      cursor: "pointer",
                      borderBottom: "1px solid #333",
                    }}
                  >
                    {ing.name}{" "}
                    <span style={{ color: "#737373", fontSize: 11 }}>
                      ({ing.unit})
                    </span>
                  </button>
                ))}
              </div>
            )}
            {ingredientId && (
              <button
                type="button"
                onClick={() => {
                  setIngredientId("");
                  setSearch("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#d97706",
                  fontSize: 12,
                  cursor: "pointer",
                  marginTop: 4,
                  padding: 0,
                }}
              >
                {t("waste.changeProduct", { defaultValue: "Change" })}
              </button>
            )}
          </div>

          {/* Quantity + Location row */}
          <div style={{ ...rowStyle, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                {t("waste.fieldQuantity", { defaultValue: "Quantity" })}
              </label>
              <input
                type="text"
                inputMode="decimal"
                style={inputStyle}
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {selectedIngredient && (
                <span
                  style={{ fontSize: 11, color: "#737373", marginTop: 2, display: "block" }}
                >
                  {selectedIngredient.unit}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                {t("waste.fieldLocation", { defaultValue: "Location" })}
              </label>
              <select
                style={selectStyle}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">
                  {t("waste.noLocation", { defaultValue: "-- Optional --" })}
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div style={fieldGroup}>
            <label style={labelStyle}>
              {t("waste.fieldReason", { defaultValue: "Reason" })}
            </label>
            <select
              style={selectStyle}
              value={reason}
              onChange={(e) => setReason(e.target.value as WasteReason)}
            >
              {WASTE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`waste.reason.${r}`, { defaultValue: r })}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div style={fieldGroup}>
            <label style={labelStyle}>
              {t("waste.fieldNotes", { defaultValue: "Notes (optional)" })}
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              placeholder={t("waste.notesPlaceholder", {
                defaultValue: "Additional details...",
              })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Cost banner */}
          <div style={costBanner}>
            <span style={costLabel}>
              {t("waste.estimatedCost", { defaultValue: "Estimated cost" })}
            </span>
            <span style={costValue}>
              {currencySymbol}
              {(estimatedCostCents / 100).toFixed(2)}
            </span>
          </div>

          {/* Error */}
          {errorMsg && (
            <p
              style={{
                color: "#ef4444",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {errorMsg}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              style={btnSecondary}
              onClick={onClose}
            >
              {t("waste.cancel", { defaultValue: "Cancel" })}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                ...btnPrimary,
                ...(!canSubmit ? btnDisabled : {}),
              }}
            >
              {saving
                ? t("waste.saving", { defaultValue: "Saving..." })
                : t("waste.save", { defaultValue: "Log Waste" })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
