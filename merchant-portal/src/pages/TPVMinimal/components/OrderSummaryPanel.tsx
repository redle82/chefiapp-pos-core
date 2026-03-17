/**
 * OrderSummaryPanel — Right panel: mode tabs, cart items, summary, action buttons.
 * Ref: POS reference with segmented mode tabs at top, "Clear All" in orange,
 *      two action buttons side-by-side (Print Receipt + Proceed).
 *
 * ChefIApp additions: integrates with OrderStatusPanel below (send-to-kitchen, hold, split).
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";
import { DiscountModal } from "./DiscountModal";
import { OrderModeSelector, type OrderMode } from "./OrderModeSelector";

const ACCENT = "#f97316";

/** SVG printer icon */
function PrinterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6V1h8v5" />
      <path d="M4 12H2V7h12v5h-2" />
      <rect x="4" y="10" width="8" height="5" />
    </svg>
  );
}

/** SVG arrow-right icon */
function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** Modifier snapshot attached to a cart item. */
export interface CartItemModifier {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  priceDeltaCents: number;
}

export interface OrderSummaryItem {
  product_id: string;
  name: string;
  subtitle?: string;
  quantity: number;
  unit_price: number; // cents (base price, before modifiers)
  image_url?: string | null;
  /** Selected modifiers for this item (optional). */
  modifiers?: CartItemModifier[];
}

/** Calculate total price for one cart item including modifier deltas. */
function itemTotalCents(item: OrderSummaryItem): number {
  const modDelta = (item.modifiers ?? []).reduce(
    (sum, m) => sum + m.priceDeltaCents,
    0,
  );
  return (item.unit_price + modDelta) * item.quantity;
}

interface OrderSummaryPanelProps {
  items: OrderSummaryItem[];
  subtotalCents: number;
  taxCents?: number;
  discountCents?: number;
  onClearAll: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onPrintReceipt: () => void;
  onProceed: () => void;
  proceedDisabled?: boolean;
  /** Order mode (managed by parent) */
  orderMode: OrderMode;
  onOrderModeChange: (mode: OrderMode) => void;
  /** Discount callbacks (optional — when provided, enables discount UI) */
  onApplyDiscount?: (discountCents: number, reason?: string) => void;
  onRemoveDiscount?: () => void;
  discountReason?: string;
}

const PLACEHOLDER_EMOJI = "\uD83C\uDF7D\uFE0F";

export function OrderSummaryPanel({
  items,
  subtotalCents,
  taxCents = 0,
  discountCents = 0,
  onClearAll,
  onUpdateQuantity,
  onPrintReceipt,
  onProceed,
  proceedDisabled = false,
  orderMode,
  onOrderModeChange,
  onApplyDiscount,
  onRemoveDiscount,
  discountReason,
}: OrderSummaryPanelProps) {
  const { t } = useTranslation("tpv");
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const { formatAmount } = useCurrency();
  const totalCents = subtotalCents + taxCents - discountCents;

  const markImageFailed = (productId: string) => {
    setFailedImageIds((prev) => new Set(prev).add(productId));
  };

  return (
    <aside
      style={{
        width: 340,
        minWidth: 340,
        backgroundColor: "#141414",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 14px",
      }}
    >
      {/* Mode tabs */}
      <OrderModeSelector value={orderMode} onChange={onOrderModeChange} />

      {/* Items header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px 0 12px",
        }}
      >
        <span style={{ color: "#fafafa", fontWeight: 700, fontSize: 15 }}>
          {t("orderSummary.items")}
        </span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              padding: "4px 0",
              border: "none",
              backgroundColor: "transparent",
              color: ACCENT,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("orderSummary.clearAll")}
          </button>
        )}
      </div>

      {/* Cart items (scrollable) */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          scrollbarWidth: "thin",
          scrollbarColor: "#333 transparent",
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32, opacity: 0.4 }}>{"\uD83D\uDED2"}</span>
            <span style={{ color: "#555", fontSize: 13 }}>
              {t("orderSummary.emptyOrder")}
            </span>
          </div>
        ) : (
          items.map((item) => {
            const hasModifiers =
              item.modifiers != null && item.modifiers.length > 0;

            return (
              <div
                key={item.product_id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 10,
                  backgroundColor: "#1e1e1e",
                  borderRadius: 12,
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    backgroundColor: "#2a2a2a",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {item.image_url && !failedImageIds.has(item.product_id) ? (
                    <img
                      src={item.image_url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={() => markImageFailed(item.product_id)}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      {PLACEHOLDER_EMOJI}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "#fafafa",
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </div>
                  {item.subtitle && (
                    <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
                      {item.subtitle}
                    </div>
                  )}

                  {/* Modifier sub-lines */}
                  {hasModifiers &&
                    item.modifiers!.map((mod) => (
                      <div
                        key={mod.id}
                        style={{
                          color: "#a1a1aa",
                          fontSize: 11,
                          marginTop: 2,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {"\u21B3"} {mod.name}
                        </span>
                        {mod.priceDeltaCents !== 0 && (
                          <span
                            style={{
                              color:
                                mod.priceDeltaCents > 0
                                  ? "#fb923c"
                                  : "#4ade80",
                              fontWeight: 600,
                            }}
                          >
                            {mod.priceDeltaCents > 0 ? "+" : ""}
                            {formatAmount(mod.priceDeltaCents)}
                          </span>
                        )}
                      </div>
                    ))}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 6,
                    }}
                  >
                    {/* Price (includes modifier deltas) */}
                    <span
                      style={{ color: "#fafafa", fontWeight: 700, fontSize: 14 }}
                    >
                      {formatAmount(itemTotalCents(item))}
                    </span>
                    {/* Qty controls */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(
                            item.product_id,
                            Math.max(0, item.quantity - 1),
                          )
                        }
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          border: "1px solid #333",
                          backgroundColor: "transparent",
                          color: "#a3a3a3",
                          cursor: "pointer",
                          fontSize: 15,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        {"\u2212"}
                      </button>
                      <span
                        style={{
                          color: "#fafafa",
                          fontSize: 13,
                          minWidth: 22,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(item.product_id, item.quantity + 1)
                        }
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          border: "none",
                          backgroundColor: ACCENT,
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 16,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Discount row */}
      {onApplyDiscount && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 10,
            marginTop: 10,
          }}
        >
          {discountCents > 0 ? (
            <div
              data-testid="discount-active"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: "#1a1207",
                borderRadius: 8,
                border: "1px solid #f9731633",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#f97316", fontSize: 13, fontWeight: 600 }}>
                  -{formatAmount(discountCents)}
                </span>
                {discountReason && (
                  <span style={{ color: "#9ca3af", fontSize: 11 }}>
                    {discountReason}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setDiscountModalOpen(true)}
                  style={{
                    padding: "2px 8px",
                    background: "transparent",
                    border: "1px solid #27272a",
                    borderRadius: 6,
                    color: "#9ca3af",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {t("discount.title", "Aplicar Desconto")}
                </button>
                {onRemoveDiscount && (
                  <button
                    type="button"
                    data-testid="remove-discount-inline"
                    onClick={onRemoveDiscount}
                    style={{
                      padding: "2px 6px",
                      background: "transparent",
                      border: "none",
                      color: "#dc2626",
                      fontSize: 14,
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                  >
                    {"\u2715"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid="add-discount-btn"
              onClick={() => setDiscountModalOpen(true)}
              style={{
                width: "100%",
                padding: "8px 0",
                background: "transparent",
                border: "1px dashed #27272a",
                borderRadius: 8,
                color: "#9ca3af",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {t("discount.addDiscount", "Adicionar desconto")}
            </button>
          )}
        </div>
      )}

      {/* Discount Modal */}
      {discountModalOpen && onApplyDiscount && (
        <DiscountModal
          subtotalCents={subtotalCents}
          currentDiscountCents={discountCents}
          onApply={(cents, r) => {
            onApplyDiscount(cents, r);
            setDiscountModalOpen(false);
          }}
          onRemove={() => {
            onRemoveDiscount?.();
            setDiscountModalOpen(false);
          }}
          onClose={() => setDiscountModalOpen(false)}
        />
      )}

      {/* Summary */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 14,
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <SummaryRow label={t("orderSummary.subtotal")} value={subtotalCents} />
        {taxCents > 0 && (
          <SummaryRow
            label={`${t("orderSummary.tax")} (${Math.round(parseFloat(localStorage.getItem("chefiapp_tax_rate") || "0.05") * 100)}%)`}
            value={taxCents}
          />
        )}
        {discountCents > 0 && (
          <SummaryRow label={t("orderSummary.discount")} value={-discountCents} />
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#fafafa",
            fontWeight: 700,
            fontSize: 18,
            marginTop: 4,
          }}
        >
          <span>{t("orderSummary.total")}</span>
          <span>{formatAmount(totalCents)}</span>
        </div>
      </div>

      {/* Action buttons (side-by-side) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 14,
        }}
      >
        <button
          type="button"
          onClick={onPrintReceipt}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: "1px solid #333",
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <PrinterIcon />
          {t("orderSummary.printReceipt")}
        </button>
        <button
          type="button"
          onClick={onProceed}
          disabled={proceedDisabled}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: "none",
            backgroundColor: proceedDisabled ? "#333" : ACCENT,
            color: proceedDisabled ? "#666" : "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: proceedDisabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background-color 0.15s ease",
          }}
        >
          {t("orderSummary.proceed")}
          <ArrowRightIcon />
        </button>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  const negative = value < 0;
  const { formatAmount } = useCurrency();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        color: "#8a8a8a",
        fontSize: 13,
      }}
    >
      <span>{label}</span>
      <span>
        {negative ? "-" : ""}
        {formatAmount(Math.abs(value))}
      </span>
    </div>
  );
}
