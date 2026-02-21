/**
 * OrderSummaryPanel — Right panel: mode tabs, cart items, summary, action buttons.
 * Ref: POS reference with segmented mode tabs at top, "Clear All" in orange,
 *      two action buttons side-by-side (Print Receipt + Proceed).
 *
 * ChefIApp additions: integrates with OrderStatusPanel below (send-to-kitchen, hold, split).
 */
// @ts-nocheck


import { useState } from "react";
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

export interface OrderSummaryItem {
  product_id: string;
  name: string;
  subtitle?: string;
  quantity: number;
  unit_price: number; // cents
  image_url?: string | null;
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
}

const PLACEHOLDER_EMOJI = "🍽️";

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
}: OrderSummaryPanelProps) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const totalCents = subtotalCents + taxCents - discountCents;

  const markImageFailed = (productId: string) => {
    setFailedImageIds((prev) => new Set(prev).add(productId));
  };

  return (
    <aside
      style={{
        width: 340,
        minWidth: 340,
        backgroundColor: "#171717",
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
          Items
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
            Clear All
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
            <span style={{ fontSize: 32, opacity: 0.4 }}>🛒</span>
            <span style={{ color: "#555", fontSize: 13 }}>
              Nenhum item no pedido
            </span>
          </div>
        ) : (
          items.map((item) => (
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  {/* Price */}
                  <span
                    style={{ color: "#fafafa", fontWeight: 700, fontSize: 14 }}
                  >
                    €{((item.unit_price * item.quantity) / 100).toFixed(2)}
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
                      −
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
          ))
        )}
      </div>

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
        <SummaryRow label="Subtotal" value={subtotalCents} />
        {taxCents > 0 && <SummaryRow label="Tax (5%)" value={taxCents} />}
        {discountCents > 0 && (
          <SummaryRow label="Discount" value={-discountCents} />
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
          <span>Total</span>
          <span>€{(totalCents / 100).toFixed(2)}</span>
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
          Print Receipt
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
          Proceed
          <ArrowRightIcon />
        </button>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  const negative = value < 0;
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
        {negative ? "-" : ""}€{(Math.abs(value) / 100).toFixed(2)}
      </span>
    </div>
  );
}
