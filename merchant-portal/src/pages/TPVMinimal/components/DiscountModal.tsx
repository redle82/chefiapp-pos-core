/**
 * DiscountModal — Modal for applying discounts and coupon codes at the POS.
 *
 * Two tabs:
 *   1. "Apply Discount" — percentage presets, custom %, fixed amount, employee toggle,
 *      list of active discount rules from the database.
 *   2. "Enter Coupon" — code input, validation feedback, preview.
 *
 * Dark theme with amber accents, matching POS palette.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";
import {
  getActiveDiscounts,
  calculateDiscountAmount,
  validateDiscountRules,
  type DiscountRule,
  type OrderItem as DiscountOrderItem,
} from "../../../core/discounts/DiscountService";
import {
  validateCoupon,
  type CouponValidationResult,
} from "../../../core/discounts/CouponService";
import { getTpvRestaurantId } from "../../../core/storage/installedDeviceStorage";

type DiscountMode = "percentage" | "fixed";
type ModalTab = "discount" | "coupon";

export interface DiscountModalProps {
  subtotalCents: number;
  currentDiscountCents: number;
  onApply: (discountCents: number, reason?: string) => void;
  onRemove: () => void;
  onClose: () => void;
  /** Cart items for discount rule validation. */
  cartItems?: Array<{
    product_id: string;
    category_id?: string;
    name: string;
    quantity: number;
    unit_price: number;
    line_total?: number;
  }>;
  /** Current operator role (for employee discount visibility). */
  operatorRole?: string;
}

const PERCENTAGE_PRESETS = [5, 10, 15, 20];
const ACCENT = "#f97316";

export function DiscountModal({
  subtotalCents,
  currentDiscountCents,
  onApply,
  onRemove,
  onClose,
  cartItems,
  operatorRole,
}: DiscountModalProps) {
  const { t } = useTranslation("tpv");
  const { formatAmount } = useCurrency();

  // Tab state
  const [activeTab, setActiveTab] = useState<ModalTab>("discount");

  // Discount tab state
  const [mode, setMode] = useState<DiscountMode>("percentage");
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [customPct, setCustomPct] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [reason, setReason] = useState("");

  // Active discount rules from DB
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [selectedRuleDiscount, setSelectedRuleDiscount] = useState(0);

  // Coupon tab state
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] =
    useState<CouponValidationResult | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);

  const restaurantId = getTpvRestaurantId() ?? "";

  // Load active discount rules on mount
  useEffect(() => {
    if (!restaurantId) return;
    setRulesLoading(true);
    getActiveDiscounts(restaurantId)
      .then((rules) =>
        setDiscountRules(rules.filter((r) => r.status === "active")),
      )
      .catch(() => setDiscountRules([]))
      .finally(() => setRulesLoading(false));
  }, [restaurantId]);

  // Convert cart items to DiscountOrderItem format
  const orderItems: DiscountOrderItem[] = (cartItems ?? []).map((i) => ({
    product_id: i.product_id,
    category_id: i.category_id,
    name: i.name,
    quantity: i.quantity,
    unit_price_cents: i.unit_price,
    line_total_cents: i.line_total ?? i.unit_price * i.quantity,
  }));

  // ── Manual discount calculation ──
  const computedDiscountCents = useCallback((): number => {
    if (selectedRuleId) return selectedRuleDiscount;
    if (mode === "percentage") {
      const pct = selectedPct ?? (customPct ? parseFloat(customPct) : 0);
      if (Number.isNaN(pct) || pct <= 0) return 0;
      const clamped = Math.min(pct, 100);
      return Math.round(subtotalCents * (clamped / 100));
    }
    const cents = fixedAmount ? Math.round(parseFloat(fixedAmount) * 100) : 0;
    if (Number.isNaN(cents) || cents <= 0) return 0;
    return Math.min(cents, subtotalCents);
  }, [
    mode,
    selectedPct,
    customPct,
    fixedAmount,
    subtotalCents,
    selectedRuleId,
    selectedRuleDiscount,
  ]);

  const discountPreview = computedDiscountCents();
  const isValid = discountPreview > 0;

  const activePct = selectedPct ?? (customPct ? parseFloat(customPct) : null);
  const exceedsMax =
    !selectedRuleId &&
    (mode === "percentage"
      ? activePct !== null && activePct > 100
      : fixedAmount
        ? Math.round(parseFloat(fixedAmount) * 100) > subtotalCents
        : false);

  const handleApply = () => {
    if (!isValid || exceedsMax) return;
    const discountReason =
      selectedRuleId
        ? discountRules.find((r) => r.id === selectedRuleId)?.name
        : reason.trim() || undefined;
    onApply(discountPreview, discountReason);
  };

  const handlePresetClick = (pct: number) => {
    setSelectedPct(pct);
    setCustomPct("");
    setSelectedRuleId(null);
  };

  const handleCustomPctChange = (value: string) => {
    setCustomPct(value);
    setSelectedPct(null);
    setSelectedRuleId(null);
  };

  const handleRuleSelect = (rule: DiscountRule) => {
    const validation = validateDiscountRules(
      rule,
      orderItems,
      subtotalCents,
    );
    if (!validation.valid) return;
    setSelectedRuleId(rule.id);
    setSelectedRuleDiscount(
      calculateDiscountAmount(rule, orderItems, subtotalCents),
    );
    setSelectedPct(null);
    setCustomPct("");
    setFixedAmount("");
  };

  // ── Coupon validation ──
  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !restaurantId) return;
    setCouponValidating(true);
    setCouponValidation(null);
    try {
      const result = await validateCoupon(
        couponCode.trim(),
        restaurantId,
        orderItems,
        subtotalCents,
      );
      setCouponValidation(result);
    } catch {
      setCouponValidation({
        valid: false,
        discountCents: 0,
        reason: "validation_error",
      });
    } finally {
      setCouponValidating(false);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponValidation?.valid) return;
    const couponReason = couponValidation.discount?.name ?? couponCode.trim();
    onApply(couponValidation.discountCents, couponReason);
  };

  // Coupon validation reason to human-readable message
  const getReasonMessage = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      coupon_not_found: t("discount.couponNotFound", "Coupon not found"),
      coupon_already_used: t("discount.couponAlreadyUsed", "Coupon already used"),
      coupon_expired: t("discount.couponExpired", "Coupon expired"),
      coupon_revoked: t("discount.couponRevoked", "Coupon revoked"),
      coupon_max_redemptions: t(
        "discount.couponMaxRedemptions",
        "Coupon redemption limit reached",
      ),
      discount_not_found: t("discount.discountNotFound", "Discount not found"),
      discount_inactive: t("discount.discountInactive", "Discount inactive"),
      discount_expired: t("discount.discountExpired", "Discount expired"),
      discount_not_started: t(
        "discount.discountNotStarted",
        "Discount not yet active",
      ),
      max_uses_reached: t("discount.maxUsesReached", "Maximum uses reached"),
      min_order_not_met: t(
        "discount.minOrderNotMet",
        "Minimum order amount not met",
      ),
      zero_discount: t("discount.zeroDiscount", "No applicable discount"),
      validation_error: t("discount.validationError", "Validation error"),
    };
    return reasonMap[reason] ?? reason;
  };

  // Discount type to human label
  const getTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      percentage: t("discount.typePercentage", "Percentage"),
      fixed: t("discount.typeFixed", "Fixed"),
      bogo: t("discount.typeBogo", "Buy One Get One"),
      bundle: t("discount.typeBundle", "Bundle"),
      employee: t("discount.typeEmployee", "Employee"),
      loyalty: t("discount.typeLoyalty", "Loyalty"),
    };
    return map[type] ?? type;
  };

  const canShowEmployeeDiscount =
    operatorRole === "manager" || operatorRole === "owner";

  return (
    <div
      data-testid="discount-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        data-testid="discount-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discount-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0a0a",
          border: "1px solid #27272a",
          borderRadius: 20,
          width: "min(480px, 94vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative",
        }}
      >
        {/* Title */}
        <h2
          id="discount-modal-title"
          style={{
            color: "#fafafa",
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {t("discount.title", "Apply Discount")}
        </h2>

        {/* Tab selector */}
        <div role="tablist" aria-label={t("discount.tabList", "Discount options")} style={{ display: "flex", gap: 0, borderBottom: "1px solid #27272a" }}>
          {(["discount", "coupon"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? `2px solid ${ACCENT}`
                    : "2px solid transparent",
                color: activeTab === tab ? "#fafafa" : "#71717a",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {tab === "discount"
                ? t("discount.tabDiscount", "Apply Discount")
                : t("discount.tabCoupon", "Enter Coupon")}
            </button>
          ))}
        </div>

        {/* ═══ DISCOUNT TAB ═══ */}
        {activeTab === "discount" && (
          <>
            {/* Active discount rules from DB */}
            {discountRules.length > 0 && (
              <div>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  {t("discount.activeDiscounts", "Active Discounts")}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 160,
                    overflowY: "auto",
                  }}
                >
                  {discountRules
                    .filter(
                      (r) =>
                        r.type !== "employee" ||
                        canShowEmployeeDiscount,
                    )
                    .map((rule) => {
                      const isSelected = selectedRuleId === rule.id;
                      const ruleValid = validateDiscountRules(
                        rule,
                        orderItems,
                        subtotalCents,
                      );
                      const ruleAmount = ruleValid.valid
                        ? calculateDiscountAmount(
                            rule,
                            orderItems,
                            subtotalCents,
                          )
                        : 0;
                      return (
                        <button
                          key={rule.id}
                          type="button"
                          disabled={!ruleValid.valid}
                          onClick={() => handleRuleSelect(rule)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 12px",
                            background: isSelected ? "#431407" : "#141414",
                            border: isSelected
                              ? `2px solid ${ACCENT}`
                              : "2px solid transparent",
                            borderRadius: 10,
                            cursor: ruleValid.valid
                              ? "pointer"
                              : "not-allowed",
                            opacity: ruleValid.valid ? 1 : 0.5,
                          }}
                        >
                          <div style={{ textAlign: "left" }}>
                            <div
                              style={{
                                color: "#fafafa",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              {rule.name}
                            </div>
                            <div
                              style={{
                                color: "#71717a",
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {getTypeLabel(rule.type)}
                              {rule.type === "percentage" &&
                                ` · ${rule.value}%`}
                              {rule.type === "fixed" &&
                                ` · ${formatAmount(rule.value)}`}
                            </div>
                          </div>
                          {ruleValid.valid && (
                            <span
                              style={{
                                color: ACCENT,
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              -{formatAmount(ruleAmount)}
                            </span>
                          )}
                          {!ruleValid.valid && ruleValid.reason && (
                            <span
                              style={{
                                color: "#ef4444",
                                fontSize: 11,
                              }}
                            >
                              {getReasonMessage(ruleValid.reason)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {rulesLoading && (
              <div style={{ color: "#71717a", fontSize: 12, textAlign: "center" }}>
                {t("discount.loadingRules", "Loading discounts...")}
              </div>
            )}

            {/* Separator if rules exist */}
            {discountRules.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid #1e1e1e",
                  paddingTop: 4,
                }}
              >
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  {t("discount.manualDiscount", "Manual Discount")}
                </div>
              </div>
            )}

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 8 }}>
              {(["percentage", "fixed"] as const).map((m) => {
                const isActive = mode === m && !selectedRuleId;
                return (
                  <button
                    key={m}
                    type="button"
                    data-testid={`mode-${m}`}
                    onClick={() => {
                      setMode(m);
                      setSelectedRuleId(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      background: isActive ? "#1e1e1e" : "transparent",
                      border: isActive
                        ? `2px solid ${ACCENT}`
                        : "2px solid #27272a",
                      borderRadius: 10,
                      color: isActive ? "#fafafa" : "#9ca3af",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {m === "percentage"
                      ? t("discount.percentage", "Percentage")
                      : t("discount.fixed", "Fixed Amount")}
                  </button>
                );
              })}
            </div>

            {/* Percentage mode */}
            {mode === "percentage" && !selectedRuleId && (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  {PERCENTAGE_PRESETS.map((pct) => {
                    const isSelected = selectedPct === pct && !customPct;
                    return (
                      <button
                        key={pct}
                        type="button"
                        data-testid={`preset-${pct}`}
                        onClick={() => handlePresetClick(pct)}
                        style={{
                          flex: 1,
                          padding: "14px 0",
                          background: isSelected ? "#431407" : "#141414",
                          border: isSelected
                            ? `2px solid ${ACCENT}`
                            : "2px solid transparent",
                          borderRadius: 10,
                          color: isSelected ? "#fafafa" : "#d4d4d8",
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: "pointer",
                        }}
                      >
                        {pct}%
                        <div
                          style={{
                            fontSize: 11,
                            color: "#71717a",
                            marginTop: 2,
                            fontWeight: 400,
                          }}
                        >
                          {formatAmount(
                            Math.round(subtotalCents * (pct / 100)),
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      color: "#9ca3af",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("discount.custom", "Custom")}:
                  </span>
                  <input
                    type="number"
                    data-testid="custom-pct-input"
                    aria-label={t("discount.customPercentage", "Custom percentage")}
                    min={0}
                    max={100}
                    step={1}
                    value={customPct}
                    onChange={(e) => handleCustomPctChange(e.target.value)}
                    placeholder="0"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      background: "#141414",
                      border: "1px solid #27272a",
                      borderRadius: 8,
                      color: "#fafafa",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <span style={{ color: "#9ca3af", fontSize: 15 }}>%</span>
                </div>
              </>
            )}

            {/* Fixed mode */}
            {mode === "fixed" && !selectedRuleId && (
              <div>
                <input
                  type="number"
                  data-testid="fixed-amount-input"
                  aria-label={t("discount.fixedAmount", "Fixed discount amount")}
                  min={0}
                  step={0.01}
                  value={fixedAmount}
                  onChange={(e) => {
                    setFixedAmount(e.target.value);
                    setSelectedRuleId(null);
                  }}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "#141414",
                    border: "1px solid #27272a",
                    borderRadius: 10,
                    color: "#fafafa",
                    fontSize: 18,
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Validation error */}
            {exceedsMax && (
              <div
                data-testid="validation-error"
                role="alert"
                style={{ color: "#ef4444", fontSize: 12, fontWeight: 500 }}
              >
                {t(
                  "discount.maxExceeded",
                  "Discount cannot exceed the total",
                )}
              </div>
            )}

            {/* Preview */}
            {discountPreview > 0 && !exceedsMax && (
              <div
                data-testid="discount-preview"
                style={{
                  background: "#141414",
                  padding: 14,
                  borderRadius: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ color: "#9ca3af", fontSize: 13 }}>
                    {t("discount.preview", {
                      amount: formatAmount(discountPreview),
                      defaultValue: "Discount: {{amount}}",
                    })}
                  </span>
                  <div style={{ color: "#71717a", fontSize: 11, marginTop: 2 }}>
                    {t("discount.newTotal", "New total")}:{" "}
                    {formatAmount(Math.max(0, subtotalCents - discountPreview))}
                  </div>
                </div>
                <span
                  style={{ color: ACCENT, fontSize: 18, fontWeight: 700 }}
                >
                  -{formatAmount(discountPreview)}
                </span>
              </div>
            )}

            {/* Reason input */}
            {!selectedRuleId && (
              <>
                <input
                  type="text"
                  data-testid="reason-input"
                  aria-label={t("discount.reason", "Reason (optional)")}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t(
                    "discount.reasonPlaceholder",
                    "E.g.: Employee discount, Happy Hour...",
                  )}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#141414",
                    border: "1px solid #27272a",
                    borderRadius: 10,
                    color: "#fafafa",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{ color: "#71717a", fontSize: 11, marginTop: -10 }}
                >
                  {t("discount.reason", "Reason (optional)")}
                </div>
              </>
            )}

            {/* Apply / Remove buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {currentDiscountCents > 0 && (
                <button
                  type="button"
                  data-testid="remove-discount-btn"
                  onClick={onRemove}
                  style={{
                    flex: 1,
                    padding: "14px 0",
                    background: "#1e1e1e",
                    border: "1px solid #dc2626",
                    borderRadius: 12,
                    color: "#dc2626",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("discount.remove", "Remove discount")}
                </button>
              )}
              <button
                type="button"
                data-testid="apply-discount-btn"
                disabled={!isValid || exceedsMax}
                onClick={handleApply}
                style={{
                  flex: 2,
                  padding: "14px 0",
                  background: isValid && !exceedsMax ? ACCENT : "#333",
                  border: "none",
                  borderRadius: 12,
                  color: isValid && !exceedsMax ? "#fff" : "#666",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor:
                    isValid && !exceedsMax ? "pointer" : "not-allowed",
                }}
              >
                {t("discount.apply", "Apply")}
              </button>
            </div>
          </>
        )}

        {/* ═══ COUPON TAB ═══ */}
        {activeTab === "coupon" && (
          <>
            <div
              style={{
                color: "#9ca3af",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {t(
                "discount.couponInstructions",
                "Enter a coupon code to apply a discount.",
              )}
            </div>

            {/* Code input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                data-testid="coupon-code-input"
                aria-label={t("discount.couponCodeLabel", "Coupon code")}
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponValidation(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleValidateCoupon()}
                placeholder={t(
                  "discount.couponPlaceholder",
                  "WELCOME20",
                )}
                autoFocus
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  background: "#141414",
                  border: "1px solid #27272a",
                  borderRadius: 10,
                  color: "#fafafa",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  outline: "none",
                }}
              />
              <button
                type="button"
                data-testid="validate-coupon-btn"
                disabled={!couponCode.trim() || couponValidating}
                onClick={handleValidateCoupon}
                style={{
                  padding: "14px 20px",
                  background:
                    couponCode.trim() && !couponValidating
                      ? ACCENT
                      : "#333",
                  border: "none",
                  borderRadius: 10,
                  color:
                    couponCode.trim() && !couponValidating
                      ? "#fff"
                      : "#666",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor:
                    couponCode.trim() && !couponValidating
                      ? "pointer"
                      : "not-allowed",
                  whiteSpace: "nowrap",
                }}
              >
                {couponValidating
                  ? t("discount.validating", "Validating...")
                  : t("discount.validateCoupon", "Apply")}
              </button>
            </div>

            {/* Validation result */}
            {couponValidation && (
              <div
                data-testid="coupon-validation-result"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: couponValidation.valid
                    ? "#052e16"
                    : "#1c1917",
                  border: couponValidation.valid
                    ? "1px solid #16a34a"
                    : "1px solid #7f1d1d",
                }}
              >
                {couponValidation.valid ? (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#4ade80",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {t("discount.couponValid", "Coupon valid!")}
                        </div>
                        {couponValidation.discount && (
                          <div
                            style={{
                              color: "#86efac",
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {couponValidation.discount.name}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          color: "#4ade80",
                          fontSize: 20,
                          fontWeight: 700,
                        }}
                      >
                        -{formatAmount(couponValidation.discountCents)}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#71717a",
                        fontSize: 11,
                        marginTop: 6,
                      }}
                    >
                      {t("discount.newTotal", "New total")}:{" "}
                      {formatAmount(
                        Math.max(
                          0,
                          subtotalCents - couponValidation.discountCents,
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {couponValidation.reason
                      ? getReasonMessage(couponValidation.reason)
                      : t(
                          "discount.couponInvalid",
                          "Invalid coupon code",
                        )}
                  </div>
                )}
              </div>
            )}

            {/* Apply coupon button (only when valid) */}
            {couponValidation?.valid && (
              <button
                type="button"
                data-testid="apply-coupon-btn"
                onClick={handleApplyCoupon}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  background: "#16a34a",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("discount.applyCoupon", "Apply Coupon")}{" "}
                (-{formatAmount(couponValidation.discountCents)})
              </button>
            )}

            {/* Remove existing discount */}
            {currentDiscountCents > 0 && (
              <button
                type="button"
                onClick={onRemove}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  background: "#1e1e1e",
                  border: "1px solid #dc2626",
                  borderRadius: 12,
                  color: "#dc2626",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("discount.remove", "Remove discount")}
              </button>
            )}
          </>
        )}

        {/* Close button */}
        <button
          type="button"
          data-testid="close-discount-btn"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Close"
        >
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}
