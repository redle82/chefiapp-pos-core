/**
 * DiscountsPage — Admin page for managing discount rules and coupon codes.
 *
 * Features:
 *   - List all discounts with status badges (active/paused/expired)
 *   - Create new discount via wizard
 *   - Edit / pause / delete discounts
 *   - Generate coupon codes for a discount
 *   - Usage analytics: times used, revenue impact
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { useCurrency } from "../../../../core/currency/useCurrency";
import {
  createDiscount,
  deleteDiscount,
  getActiveDiscounts,
  updateDiscount,
  type CreateDiscountInput,
  type DiscountRule,
  type DiscountStatus,
  type DiscountType,
} from "../../../../core/discounts/DiscountService";
import {
  generateCoupon,
  listCouponsForDiscount,
  type Coupon,
} from "../../../../core/discounts/CouponService";
import { getTpvRestaurantId } from "../../../../core/storage/installedDeviceStorage";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISCOUNT_TYPES: Array<{ value: DiscountType; labelKey: string }> = [
  { value: "percentage", labelKey: "discounts.typePercentage" },
  { value: "fixed", labelKey: "discounts.typeFixed" },
  { value: "bogo", labelKey: "discounts.typeBogo" },
  { value: "bundle", labelKey: "discounts.typeBundle" },
  { value: "employee", labelKey: "discounts.typeEmployee" },
  { value: "loyalty", labelKey: "discounts.typeLoyalty" },
];

const STATUS_COLORS: Record<DiscountStatus, string> = {
  active: "#10b981",
  paused: "#f59e0b",
  expired: "#ef4444",
  deleted: "#71717a",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiscountsPage() {
  const { t } = useTranslation("sidebar");
  const { formatAmount } = useCurrency();
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const installedId = getTpvRestaurantId();
  const restaurantId = installedId ?? runtime?.restaurant_id ?? "";

  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCouponsFor, setShowCouponsFor] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [generatingCoupon, setGeneratingCoupon] = useState(false);
  const [customCouponCode, setCustomCouponCode] = useState("");

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<DiscountType>("percentage");
  const [formValue, setFormValue] = useState("");
  const [formMinOrder, setFormMinOrder] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formValidFrom, setFormValidFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Load discounts
  const loadDiscounts = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const data = await getActiveDiscounts(restaurantId);
      setDiscounts(data);
    } catch {
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  // Load coupons for a discount
  const loadCoupons = useCallback(async (discountId: string) => {
    setCouponsLoading(true);
    try {
      const data = await listCouponsForDiscount(discountId);
      setCoupons(data);
    } catch {
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  const handleShowCoupons = (discountId: string) => {
    if (showCouponsFor === discountId) {
      setShowCouponsFor(null);
      return;
    }
    setShowCouponsFor(discountId);
    loadCoupons(discountId);
  };

  // Create discount
  const handleCreate = async () => {
    setFormError(null);
    if (!formName.trim()) {
      setFormError(t("discounts.errorNameRequired", "Name is required"));
      return;
    }
    const value = parseFloat(formValue);
    if (Number.isNaN(value) || value <= 0) {
      setFormError(t("discounts.errorValueRequired", "Value must be greater than 0"));
      return;
    }

    const input: CreateDiscountInput = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      type: formType,
      value:
        formType === "fixed"
          ? Math.round(value * 100) // Convert to cents
          : value,
      min_order_cents: formMinOrder
        ? Math.round(parseFloat(formMinOrder) * 100)
        : 0,
      max_uses: formMaxUses ? parseInt(formMaxUses, 10) : 0,
      valid_from: formValidFrom
        ? new Date(formValidFrom).toISOString()
        : undefined,
      valid_until: formValidUntil
        ? new Date(formValidUntil).toISOString()
        : null,
    };

    const result = await createDiscount(restaurantId, input);
    if (result) {
      resetForm();
      setCreating(false);
      await loadDiscounts();
    } else {
      setFormError(
        t("discounts.errorCreate", "Failed to create discount"),
      );
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormType("percentage");
    setFormValue("");
    setFormMinOrder("");
    setFormMaxUses("");
    setFormValidFrom(new Date().toISOString().slice(0, 10));
    setFormValidUntil("");
    setFormError(null);
  };

  // Toggle pause/active
  const handleToggleStatus = async (discount: DiscountRule) => {
    const newStatus: DiscountStatus =
      discount.status === "active" ? "paused" : "active";
    await updateDiscount(discount.id, { status: newStatus });
    await loadDiscounts();
  };

  // Delete discount
  const handleDelete = async (discountId: string) => {
    await deleteDiscount(discountId);
    await loadDiscounts();
  };

  // Generate coupon
  const handleGenerateCoupon = async (discountId: string) => {
    setGeneratingCoupon(true);
    try {
      await generateCoupon(restaurantId, discountId, {
        code: customCouponCode.trim() || undefined,
      });
      setCustomCouponCode("");
      await loadCoupons(discountId);
    } catch {
      // Error handled by service
    } finally {
      setGeneratingCoupon(false);
    }
  };

  // Value display for a discount
  const formatDiscountValue = (d: DiscountRule): string => {
    switch (d.type) {
      case "percentage":
      case "employee":
        return `${d.value}%`;
      case "fixed":
        return formatAmount(d.value);
      case "bogo":
        return `Buy ${d.bogo_buy_quantity ?? 2} Get ${d.bogo_get_quantity ?? 1}`;
      case "bundle":
        return d.bundle_price_cents
          ? formatAmount(d.bundle_price_cents)
          : "-";
      case "loyalty":
        return d.loyalty_discount_cents
          ? formatAmount(d.loyalty_discount_cents)
          : "-";
      default:
        return "-";
    }
  };

  return (
    <div style={{ padding: "0 24px 24px", maxWidth: 900 }}>
      <AdminPageHeader
        title={t("discounts.pageTitle", "Discounts & Coupons")}
        subtitle={t(
          "discounts.pageSubtitle",
          "Create and manage discount rules and coupon codes.",
        )}
      />

      {/* Create button */}
      {!creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{
            marginBottom: 20,
            padding: "10px 20px",
            background: "#f97316",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          + {t("discounts.createNew", "Create Discount")}
        </button>
      )}

      {/* Create form */}
      {creating && (
        <div
          style={{
            background: "#141414",
            border: "1px solid #27272a",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              color: "#fafafa",
              fontSize: 16,
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            {t("discounts.createTitle", "New Discount")}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {/* Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                {t("discounts.fieldName", "Name")} *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t(
                  "discounts.namePlaceholder",
                  "e.g. Happy Hour 20%",
                )}
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                {t("discounts.fieldDescription", "Description")}
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Type */}
            <div>
              <label style={labelStyle}>
                {t("discounts.fieldType", "Type")}
              </label>
              <select
                value={formType}
                onChange={(e) =>
                  setFormType(e.target.value as DiscountType)
                }
                style={inputStyle}
              >
                {DISCOUNT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {t(dt.labelKey, dt.value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div>
              <label style={labelStyle}>
                {formType === "percentage" || formType === "employee"
                  ? t("discounts.fieldPercentage", "Percentage (%)")
                  : t("discounts.fieldAmount", "Amount")}
              </label>
              <input
                type="number"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={
                  formType === "percentage" || formType === "employee"
                    ? "10"
                    : "5.00"
                }
                min={0}
                step={formType === "fixed" ? 0.01 : 1}
                style={inputStyle}
              />
            </div>

            {/* Min order */}
            <div>
              <label style={labelStyle}>
                {t("discounts.fieldMinOrder", "Min. Order Amount")}
              </label>
              <input
                type="number"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                style={inputStyle}
              />
            </div>

            {/* Max uses */}
            <div>
              <label style={labelStyle}>
                {t("discounts.fieldMaxUses", "Max Uses (0 = unlimited)")}
              </label>
              <input
                type="number"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
                placeholder="0"
                min={0}
                step={1}
                style={inputStyle}
              />
            </div>

            {/* Valid from */}
            <div>
              <label style={labelStyle}>
                {t("discounts.fieldValidFrom", "Valid From")}
              </label>
              <input
                type="date"
                value={formValidFrom}
                onChange={(e) => setFormValidFrom(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Valid until */}
            <div>
              <label style={labelStyle}>
                {t("discounts.fieldValidUntil", "Valid Until (optional)")}
              </label>
              <input
                type="date"
                value={formValidUntil}
                onChange={(e) => setFormValidUntil(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Error */}
          {formError && (
            <div
              style={{
                color: "#ef4444",
                fontSize: 13,
                marginTop: 12,
                padding: "8px 12px",
                background: "#1c1917",
                borderRadius: 8,
                border: "1px solid #7f1d1d",
              }}
            >
              {formError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                resetForm();
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "#1e1e1e",
                border: "1px solid #3f3f46",
                borderRadius: 10,
                color: "#d4d4d8",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t("discounts.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              style={{
                flex: 2,
                padding: "10px 0",
                background: "#f97316",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t("discounts.save", "Save Discount")}
            </button>
          </div>
        </div>
      )}

      {/* Discounts list */}
      {loading ? (
        <div style={{ color: "#71717a", fontSize: 14, padding: "20px 0" }}>
          {t("discounts.loading", "Loading discounts...")}
        </div>
      ) : discounts.length === 0 ? (
        <div
          style={{
            color: "#71717a",
            fontSize: 14,
            padding: "40px 0",
            textAlign: "center",
          }}
        >
          {t(
            "discounts.empty",
            "No discounts yet. Create your first discount to get started.",
          )}
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {discounts.map((d) => (
            <div key={d.id}>
              <div
                style={{
                  background: "#141414",
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Status badge */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: STATUS_COLORS[d.status],
                    flexShrink: 0,
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "#fafafa",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {d.name}
                  </div>
                  <div
                    style={{
                      color: "#71717a",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {d.type.toUpperCase()} · {formatDiscountValue(d)}
                    {d.min_order_cents > 0 &&
                      ` · Min: ${formatAmount(d.min_order_cents)}`}
                    {d.max_uses > 0 && ` · ${d.current_uses}/${d.max_uses} uses`}
                    {d.max_uses === 0 && ` · ${d.current_uses} uses`}
                  </div>
                  {d.valid_until && (
                    <div
                      style={{
                        color: "#71717a",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {t("discounts.expires", "Expires")}:{" "}
                      {new Date(d.valid_until).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleShowCoupons(d.id)}
                    title={t("discounts.coupons", "Coupons")}
                    style={actionBtnStyle}
                  >
                    {t("discounts.couponsBtn", "Coupons")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(d)}
                    title={
                      d.status === "active"
                        ? t("discounts.pause", "Pause")
                        : t("discounts.activate", "Activate")
                    }
                    style={{
                      ...actionBtnStyle,
                      borderColor:
                        d.status === "active" ? "#f59e0b" : "#10b981",
                      color:
                        d.status === "active" ? "#f59e0b" : "#10b981",
                    }}
                  >
                    {d.status === "active"
                      ? t("discounts.pause", "Pause")
                      : t("discounts.activate", "Activate")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    title={t("discounts.delete", "Delete")}
                    style={{
                      ...actionBtnStyle,
                      borderColor: "#dc2626",
                      color: "#dc2626",
                    }}
                  >
                    {t("discounts.delete", "Delete")}
                  </button>
                </div>
              </div>

              {/* Coupons panel (expandable) */}
              {showCouponsFor === d.id && (
                <div
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #27272a",
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <input
                      type="text"
                      value={customCouponCode}
                      onChange={(e) =>
                        setCustomCouponCode(
                          e.target.value.toUpperCase(),
                        )
                      }
                      placeholder={t(
                        "discounts.couponCodePlaceholder",
                        "Custom code (optional)",
                      )}
                      style={{
                        ...inputStyle,
                        flex: 1,
                        fontSize: 13,
                        padding: "8px 12px",
                        letterSpacing: 1,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateCoupon(d.id)}
                      disabled={generatingCoupon}
                      style={{
                        padding: "8px 16px",
                        background: "#f97316",
                        border: "none",
                        borderRadius: 8,
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: generatingCoupon
                          ? "not-allowed"
                          : "pointer",
                        opacity: generatingCoupon ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {generatingCoupon
                        ? t("discounts.generating", "Generating...")
                        : t("discounts.generateCoupon", "Generate Code")}
                    </button>
                  </div>

                  {couponsLoading ? (
                    <div
                      style={{
                        color: "#71717a",
                        fontSize: 12,
                      }}
                    >
                      {t("discounts.loadingCoupons", "Loading coupons...")}
                    </div>
                  ) : coupons.length === 0 ? (
                    <div
                      style={{
                        color: "#71717a",
                        fontSize: 12,
                      }}
                    >
                      {t("discounts.noCoupons", "No coupons generated yet.")}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {coupons.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            background: "#141414",
                            borderRadius: 8,
                          }}
                        >
                          <div>
                            <span
                              style={{
                                color: "#fafafa",
                                fontWeight: 700,
                                fontSize: 14,
                                letterSpacing: 2,
                                fontFamily: "monospace",
                              }}
                            >
                              {c.code}
                            </span>
                            <span
                              style={{
                                marginLeft: 12,
                                color: "#71717a",
                                fontSize: 11,
                              }}
                            >
                              {c.current_redemptions}
                              {c.max_redemptions > 0
                                ? `/${c.max_redemptions}`
                                : ""}{" "}
                              {t("discounts.used", "used")}
                            </span>
                          </div>
                          <span
                            style={{
                              color: STATUS_COLORS[c.status as DiscountStatus] ?? "#71717a",
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#9ca3af",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#0a0a0a",
  border: "1px solid #27272a",
  borderRadius: 8,
  color: "#fafafa",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
};

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#9ca3af",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
