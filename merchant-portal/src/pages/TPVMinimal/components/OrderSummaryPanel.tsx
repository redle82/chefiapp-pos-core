/**
 * OrderSummaryPanel — Painel direito: itens, subtotal, imposto, desconto, total, Print Receipt, Proceed.
 * Fallback emoji quando imagem falha (evita paisagens/pessoas).
 */

import { useState } from "react";

export interface OrderSummaryItem {
  product_id: string;
  name: string;
  subtitle?: string;
  quantity: number;
  unit_price: number; // centavos
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
}: OrderSummaryPanelProps) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const totalCents = subtotalCents + taxCents - discountCents;

  const markImageFailed = (productId: string) => {
    setFailedImageIds((prev) => new Set(prev).add(productId));
  };

  return (
    <aside
      style={{
        width: 320,
        minWidth: 320,
        backgroundColor: "var(--surface-base, #171717)",
        borderLeft: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
        display: "flex",
        flexDirection: "column",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ color: "var(--text-primary, #fafafa)", fontWeight: 700, fontSize: 16 }}>
          Itens
        </span>
        <button
          type="button"
          onClick={onClearAll}
          title="Limpar tudo"
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "transparent",
            color: "var(--text-secondary, #a3a3a3)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>🗑</span>
          Limpar
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {items.length === 0 ? (
          <span style={{ color: "var(--text-tertiary, #737373)", fontSize: 14 }}>
            Nenhum item no pedido.
          </span>
        ) : (
          items.map((item) => (
            <div
              key={item.product_id}
              style={{
                display: "flex",
                gap: 12,
                padding: 10,
                backgroundColor: "var(--card-bg-on-dark, #262626)",
                borderRadius: 8,
                border: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: "var(--surface-elevated, #404040)",
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ color: "var(--text-primary, #fafafa)", fontWeight: 600, fontSize: 13 }}
                >
                  {item.name}
                </div>
                {item.subtitle && (
                  <div style={{ color: "var(--text-secondary, #a3a3a3)", fontSize: 11 }}>
                    {item.subtitle}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 6,
                  }}
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
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid var(--surface-border, #404040)",
                      backgroundColor: "transparent",
                      color: "var(--text-primary, #fafafa)",
                      cursor: "pointer",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      color: "var(--text-primary, #fafafa)",
                      fontSize: 14,
                      minWidth: 24,
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
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "var(--color-primary, #c9a227)",
                      color: "var(--text-inverse, #1a1a1a)",
                      cursor: "pointer",
                      fontSize: 16,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                  <span
                    style={{
                      color: "var(--text-secondary, #a3a3a3)",
                      fontSize: 13,
                      marginLeft: "auto",
                    }}
                  >
                    €{((item.unit_price * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div
        style={{
          borderTop: "1px solid var(--surface-border, #404040)",
          paddingTop: 16,
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "var(--text-secondary, #a3a3a3)",
            fontSize: 13,
          }}
        >
          <span>Subtotal</span>
          <span>€{(subtotalCents / 100).toFixed(2)}</span>
        </div>
        {taxCents > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--text-secondary, #a3a3a3)",
              fontSize: 13,
            }}
          >
            <span>IVA (5%)</span>
            <span>€{(taxCents / 100).toFixed(2)}</span>
          </div>
        )}
        {discountCents > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--text-secondary, #a3a3a3)",
              fontSize: 13,
            }}
          >
            <span>Desconto</span>
            <span>-€{(discountCents / 100).toFixed(2)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "var(--text-primary, #fafafa)",
            fontWeight: 700,
            fontSize: 18,
            marginTop: 4,
          }}
        >
          <span>Total</span>
          <span>€{(totalCents / 100).toFixed(2)}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          onClick={onPrintReceipt}
          style={{
            height: 44,
            borderRadius: 8,
            border: "1px solid var(--surface-border, #404040)",
            backgroundColor: "var(--card-bg-on-dark, #262626)",
            color: "var(--text-primary, #fafafa)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>🖨</span>
          Imprimir recibo
        </button>
        <button
          type="button"
          onClick={onProceed}
          disabled={proceedDisabled}
          style={{
            height: 48,
            borderRadius: 8,
            border: "none",
            backgroundColor: proceedDisabled ? "var(--text-tertiary, #525252)" : "var(--color-primary, #c9a227)",
            color: "var(--text-inverse, #1a1a1a)",
            fontSize: 16,
            fontWeight: 700,
            cursor: proceedDisabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          Finalizar
          <span style={{ fontSize: 18 }}>→</span>
        </button>
      </div>
    </aside>
  );
}
