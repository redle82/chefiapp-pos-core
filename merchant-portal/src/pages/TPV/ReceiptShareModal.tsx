/**
 * ReceiptShareModal — Gap #8 (Competitive)
 *
 * Shown after successful payment to let the staff send
 * a digital receipt via email, Web Share API, print, or skip.
 */

import React, { useState } from "react";
import { currencyService } from "../../core/currency/CurrencyService";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

export interface ReceiptShareOrder {
  id: string;
  tableNumber?: number;
  totalCents: number;
  items: Array<{
    name: string;
    quantity: number;
    priceCents: number;
  }>;
  paymentMethod: string;
  tipCents?: number;
  discountCents?: number;
  restaurantName?: string;
  /** ISO timestamp */
  paidAt?: string;
}

interface ReceiptShareModalProps {
  order: ReceiptShareOrder;
  onClose: () => void;
}

/**
 * Build a plain-text receipt suitable for email body or share text.
 */
function buildPlainTextReceipt(order: ReceiptShareOrder): string {
  const lines: string[] = [];
  const fmt = (c: number) => currencyService.formatAmount(c);
  const now = order.paidAt ? new Date(order.paidAt) : new Date();

  lines.push(order.restaurantName || "Restaurante");
  lines.push("=".repeat(32));
  lines.push(
    `Data: ${now.toLocaleDateString("pt-PT")} ${now.toLocaleTimeString(
      "pt-PT",
      { hour: "2-digit", minute: "2-digit" },
    )}`,
  );
  if (order.tableNumber) lines.push(`Mesa: ${order.tableNumber}`);
  lines.push(`Pedido: #${order.id.slice(0, 8)}`);
  lines.push("-".repeat(32));

  for (const item of order.items) {
    const total = item.priceCents * item.quantity;
    lines.push(`${item.quantity}x ${item.name}  ${fmt(total)}`);
  }

  lines.push("-".repeat(32));

  if (order.discountCents && order.discountCents > 0) {
    lines.push(`Desconto:  -${fmt(order.discountCents)}`);
  }
  if (order.tipCents && order.tipCents > 0) {
    lines.push(`Gorjeta:    ${fmt(order.tipCents)}`);
  }

  lines.push(`TOTAL:      ${fmt(order.totalCents)}`);
  lines.push(`Pagamento:  ${order.paymentMethod.toUpperCase()}`);
  lines.push("");
  lines.push("Obrigado pela sua visita!");

  return lines.join("\n");
}

export const ReceiptShareModal: React.FC<ReceiptShareModalProps> = ({
  order,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const receiptText = buildPlainTextReceipt(order);

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `Recibo — ${order.restaurantName || "Restaurante"} — #${order.id.slice(
        0,
        8,
      )}`,
    );
    const body = encodeURIComponent(receiptText);

    if (email) {
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    } else {
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
    setSent(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Recibo #${order.id.slice(0, 8)}`,
          text: receiptText,
        });
        setSent(true);
      } catch {
        // user cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(receiptText);
      setSent(true);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Recibo</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; white-space: pre-wrap; }
        @media print { @page { size: 80mm auto; margin: 0; } body { padding: 10mm; } }
      </style></head>
      <body>${receiptText.replace(/\n/g, "<br>")}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const btnStyle = (bg: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    backgroundColor: bg,
    color: "#fff",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colors.surface.layer1,
          borderRadius: 12,
          padding: spacing[6],
          width: 380,
          maxWidth: "90vw",
          display: "flex",
          flexDirection: "column",
          gap: spacing[4],
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            Enviar Recibo
          </div>
          <div
            style={{
              fontSize: 13,
              color: colors.text.secondary,
              marginTop: 4,
            }}
          >
            Pedido #{order.id.slice(0, 8)} —{" "}
            {currencyService.formatAmount(order.totalCents)}
          </div>
        </div>

        {/* Email input */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: colors.text.secondary,
              marginBottom: 4,
            }}
          >
            Email do cliente (opcional)
          </label>
          <input
            type="email"
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              borderRadius: 8,
              border: `1px solid ${colors.border.subtle}`,
              backgroundColor: colors.surface.layer2,
              color: colors.text.primary,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Action buttons */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}
        >
          <button onClick={handleEmail} style={btnStyle(colors.action.base)}>
            📧 Enviar por Email
          </button>

          <button
            onClick={handleShare}
            style={btnStyle(colors.info.base || "#3B82F6")}
          >
            📱{" "}
            {typeof navigator.share === "function"
              ? "Partilhar"
              : "Copiar Recibo"}
          </button>

          <button
            onClick={handlePrint}
            style={btnStyle(colors.text.secondary || "#6B7280")}
          >
            🖨️ Imprimir
          </button>
        </div>

        {/* Feedback */}
        {sent && (
          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              fontWeight: 600,
              color: colors.success.base,
            }}
          >
            ✓ Recibo enviado!
          </div>
        )}

        {/* Skip */}
        <button
          onClick={onClose}
          style={{
            marginTop: spacing[1],
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 8,
            cursor: "pointer",
            backgroundColor: "transparent",
            color: colors.text.secondary,
            width: "100%",
          }}
        >
          Saltar
        </button>
      </div>
    </div>
  );
};
