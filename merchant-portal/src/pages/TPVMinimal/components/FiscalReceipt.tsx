/**
 * FiscalReceipt — Recibo fiscal completo no ecra.
 *
 * Espelha a estrutura do template ESC/POS (OrderReceipt.ts):
 * cabecalho restaurante, items, totais, IVA, pagamento, dados fiscais, QR, rodape.
 *
 * Estilo: fundo branco, font monospace, max-width 320px — simula papel termico.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";
import type { ReceiptData } from "../types/ReceiptData";
import type { UserRole } from "../../../core/context/ContextTypes";

interface FiscalReceiptProps {
  receipt: ReceiptData;
  onNewOrder: () => void;
  onPrint: () => void;
  /** Callback to send receipt via email. If undefined, the button is hidden. */
  onEmailReceipt?: (email: string) => Promise<void>;
  /** Callback to reopen this order. If undefined, the button is hidden. */
  onReopenOrder?: (reason: string) => Promise<void>;
  /** Current operator role — reopen is only visible to manager/owner. */
  operatorRole?: UserRole;
}

export function FiscalReceipt({
  receipt,
  onNewOrder,
  onPrint,
  onEmailReceipt,
  onReopenOrder,
  operatorRole,
}: FiscalReceiptProps) {
  const { t } = useTranslation("receipt");
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenLoading, setReopenLoading] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [emailInputOpen, setEmailInputOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);

  const canReopen =
    onReopenOrder != null &&
    (operatorRole === "manager" || operatorRole === "owner");
  const { formatAmount } = useCurrency();
  const r = receipt.restaurant;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const payMethodLabel =
    receipt.paymentMethod === "cash"
      ? t("paymentCash")
      : receipt.paymentMethod === "card"
        ? t("paymentCard")
        : t("paymentPix");

  const orderModeLabel =
    receipt.orderMode === "dine_in"
      ? t("dineIn")
      : receipt.orderMode === "take_away"
        ? t("takeAway")
        : receipt.orderMode === "delivery"
          ? t("delivery")
          : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("receiptTitle", "Fiscal Receipt")}
      onClick={onNewOrder}
      onKeyDown={(e) => {
        if (e.key === "Escape") onNewOrder();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 4,
          width: "min(340px, 92vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "24px 20px",
          fontFamily: "'Courier New', 'Courier', monospace",
          fontSize: 12,
          lineHeight: 1.5,
          color: "#1a1a1a",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* ── Header: logo + restaurant identity ── */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          {r.logoUrl && (
            <img
              src={r.logoUrl}
              alt={r.name}
              style={{
                display: "block",
                margin: "0 auto 8px auto",
                maxWidth: 120,
                maxHeight: 60,
                objectFit: "contain",
              }}
            />
          )}
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
            {r.name.toUpperCase()}
          </div>
          {r.address && (
            <div style={{ fontSize: 11, color: "#555" }}>{r.address}</div>
          )}
          {r.taxId && (
            <div style={{ fontSize: 11, color: "#555" }}>
              {t("nif")} {r.taxId}
            </div>
          )}
          {r.phone && (
            <div style={{ fontSize: 11, color: "#555" }}>
              {t("tel")} {r.phone}
            </div>
          )}
        </div>

        <Separator double />

        {/* ── Order info ── */}
        <div style={{ marginBottom: 8 }}>
          <Row label={t("date")} value={formatDate(receipt.timestamp)} />
          <Row
            label={t("order")}
            value={`#${receipt.orderIdShort.toUpperCase()}`}
          />
          {receipt.table && <Row label={t("table")} value={receipt.table} />}
          {orderModeLabel && (
            <Row label="" value={orderModeLabel} />
          )}
        </div>

        <Separator />

        {/* ── Items header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          <span style={{ width: 36 }}>{t("qty")}</span>
          <span style={{ flex: 1 }}>{t("item")}</span>
          <span style={{ textAlign: "right", minWidth: 60 }}>{t("total")}</span>
        </div>

        <Separator />

        {/* ── Items ── */}
        <div style={{ marginBottom: 8 }}>
          {receipt.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              {/* Main item line */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ width: 36 }}>{item.quantity}x</span>
                <span style={{ flex: 1, wordBreak: "break-word" }}>
                  {item.name}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    minWidth: 60,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatAmount(item.line_total)}
                </span>
              </div>

              {/* Unit price (if qty > 1) */}
              {item.quantity > 1 && (
                <div style={{ paddingLeft: 36, fontSize: 11, color: "#666" }}>
                  {t("unitPriceEach", { price: formatAmount(item.unit_price) })}
                </div>
              )}

              {/* Modifiers */}
              {item.modifiers?.map((mod, mi) => (
                <div
                  key={mi}
                  style={{ paddingLeft: 36, fontSize: 11, color: "#666" }}
                >
                  + {mod.name}
                  {mod.priceDeltaCents > 0 &&
                    ` (+${formatAmount(mod.priceDeltaCents)})`}
                </div>
              ))}
            </div>
          ))}
        </div>

        <Separator double />

        {/* ── Totals ── */}
        <div style={{ marginBottom: 8 }}>
          <Row label={t("subtotal")} value={formatAmount(receipt.subtotalCents)} />

          {receipt.discountCents > 0 && (
            <Row
              label={
                receipt.discountReason
                  ? `${t("discount")} (${receipt.discountReason})`
                  : t("discount")
              }
              value={`-${formatAmount(receipt.discountCents)}`}
            />
          )}

          {/* VAT breakdown */}
          {receipt.taxBreakdown.map((tax, idx) => (
            <Row
              key={idx}
              label={t("vatRate", { rate: tax.rateLabel })}
              value={formatAmount(tax.taxAmount)}
            />
          ))}

          {receipt.tipCents > 0 && (
            <Row label={t("tip")} value={formatAmount(receipt.tipCents)} />
          )}

          {/* Grand total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 800,
              fontSize: 18,
              borderTop: "2px solid #1a1a1a",
              paddingTop: 6,
              marginTop: 6,
            }}
          >
            <span>{t("total")}</span>
            <span>{formatAmount(receipt.grandTotalCents)}</span>
          </div>
        </div>

        <Separator />

        {/* ── Payment method ── */}
        <Row label={t("paymentMethod")} value={payMethodLabel} bold />

        {/* ── Fiscal data ── */}
        {receipt.fiscal && (
          <div style={{ marginTop: 8 }}>
            <Separator />
            <Row
              label={t("documentNumber")}
              value={receipt.fiscal.documentNumber}
            />
            <Row label={t("atcud")} value={receipt.fiscal.atcud} />
            <Row label={t("hashControl")} value={receipt.fiscal.hashControl} />
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11 }}>
          <div style={{ fontWeight: 600 }}>{t("thankYou")}</div>
          {r.receiptExtraText && (
            <div style={{ marginTop: 4, color: "#666", whiteSpace: "pre-line" }}>
              {r.receiptExtraText}
            </div>
          )}
          <div style={{ marginTop: 4, color: "#999", fontSize: 10 }}>
            {formatDate(receipt.timestamp)}
          </div>
        </div>

        {/* ── Action buttons (not part of thermal paper) ── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            borderTop: "1px dashed #ddd",
            paddingTop: 16,
          }}
        >
          <button
            type="button"
            onClick={onPrint}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "#f4f4f5",
              border: "1px solid #d4d4d8",
              borderRadius: 8,
              color: "#18181b",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {t("printReceipt")}
          </button>
          <button
            type="button"
            onClick={onNewOrder}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "#18181b",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {t("newOrder")}
          </button>
        </div>

        {/* Email Receipt */}
        {onEmailReceipt && (
          <div
            style={{
              marginTop: 8,
              borderTop: "1px dashed #ddd",
              paddingTop: 12,
            }}
          >
            {!emailInputOpen ? (
              <button
                type="button"
                onClick={() => {
                  setEmailInputOpen(true);
                  setEmailResult(null);
                }}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: "#f0f9ff",
                  border: "1px solid #3b82f6",
                  borderRadius: 8,
                  color: "#1e40af",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {t("emailReceipt", "Email Receipt")}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  aria-label={t("emailPlaceholder", "customer@email.com")}
                  placeholder={t("emailPlaceholder", "customer@email.com")}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1px solid #d4d4d8",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "system-ui, sans-serif",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInputOpen(false);
                      setCustomerEmail("");
                      setEmailResult(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      background: "#f4f4f5",
                      border: "1px solid #d4d4d8",
                      borderRadius: 6,
                      color: "#52525b",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {t("cancel", "Cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={emailSending || !customerEmail.trim()}
                    onClick={async () => {
                      if (!customerEmail.trim()) return;
                      setEmailSending(true);
                      setEmailResult(null);
                      try {
                        await onEmailReceipt(customerEmail.trim());
                        setEmailResult(t("emailSent", "Receipt sent!"));
                        setCustomerEmail("");
                        setEmailInputOpen(false);
                      } catch (err) {
                        setEmailResult(
                          err instanceof Error
                            ? err.message
                            : t("emailFailed", "Failed to send."),
                        );
                      } finally {
                        setEmailSending(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      background: customerEmail.trim() ? "#3b82f6" : "#a1a1aa",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: emailSending || !customerEmail.trim() ? "not-allowed" : "pointer",
                      fontFamily: "system-ui, sans-serif",
                      opacity: emailSending ? 0.6 : 1,
                    }}
                  >
                    {emailSending ? t("emailSending", "Sending...") : t("emailSend", "Send")}
                  </button>
                </div>
                {emailResult && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: emailResult.includes("sent") || emailResult.includes("enviado")
                        ? "#10b981"
                        : "#ef4444",
                      textAlign: "center",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {emailResult}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reopen Order — only visible to manager/owner */}
        {canReopen && (
          <div
            style={{
              marginTop: 8,
              borderTop: "1px dashed #ddd",
              paddingTop: 12,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setReopenModalOpen(true);
                setReopenReason("");
                setReopenError(null);
              }}
              style={{
                width: "100%",
                padding: "10px 0",
                background: "#fffbeb",
                border: "1px solid #f59e0b",
                borderRadius: 8,
                color: "#92400e",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {t("reopenOrder", "Reopen Order")}
            </button>
          </div>
        )}
      </div>

      {/* Reopen Order Modal */}
      {reopenModalOpen && (
        <ReopenOrderModal
          onConfirm={async () => {
            if (!reopenReason.trim()) {
              setReopenError(
                t("reopenReasonRequired", "A reason is required to reopen this order."),
              );
              return;
            }
            setReopenLoading(true);
            setReopenError(null);
            try {
              await onReopenOrder!(reopenReason.trim());
              setReopenModalOpen(false);
            } catch (err) {
              setReopenError(
                err instanceof Error ? err.message : "Failed to reopen order.",
              );
            } finally {
              setReopenLoading(false);
            }
          }}
          onCancel={() => setReopenModalOpen(false)}
          reason={reopenReason}
          onReasonChange={setReopenReason}
          loading={reopenLoading}
          error={reopenError}
        />
      )}
    </div>
  );
}

/* ── Helper sub-components ── */

function Separator({ double }: { double?: boolean }) {
  return (
    <div
      style={{
        borderTop: double ? "2px double #ccc" : "1px dashed #ccc",
        margin: "6px 0",
      }}
    />
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontWeight: bold ? 700 : 400,
      }}
    >
      <span style={{ color: "#555" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ── Reopen Order Modal ── */

function ReopenOrderModal({
  onConfirm,
  onCancel,
  reason,
  onReasonChange,
  loading,
  error,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  reason: string;
  onReasonChange: (v: string) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reopen-modal-title"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !loading) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0a0a",
          border: "1px solid #27272a",
          borderRadius: 20,
          width: "min(400px, 92vw)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h2
          id="reopen-modal-title"
          style={{
            color: "#f59e0b",
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Reopen Order
        </h2>
        <p
          style={{
            color: "#a1a1aa",
            fontSize: 13,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          This action will reopen the paid order so it can be modified. A reason
          is required for audit compliance.
        </p>

        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          aria-label="Reason for reopening order"
          aria-required="true"
          placeholder="Reason for reopening (e.g., customer wants to add items, wrong payment)..."
          rows={3}
          style={{
            width: "100%",
            padding: 12,
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 10,
            color: "#e4e4e7",
            fontSize: 14,
            resize: "vertical",
            fontFamily: "system-ui, sans-serif",
            outline: "none",
            boxSizing: "border-box",
          }}
          autoFocus
        />

        {error && (
          <div
            role="alert"
            style={{
              color: "#ef4444",
              fontSize: 13,
              padding: "8px 12px",
              background: "#1c1917",
              borderRadius: 8,
              border: "1px solid #7f1d1d",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 12,
              color: "#d4d4d8",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !reason.trim()}
            style={{
              flex: 1,
              padding: "12px 0",
              background: reason.trim() ? "#92400e" : "#3f3f46",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading || !reason.trim() ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Reopening..." : "Confirm Reopen"}
          </button>
        </div>
      </div>
    </div>
  );
}
