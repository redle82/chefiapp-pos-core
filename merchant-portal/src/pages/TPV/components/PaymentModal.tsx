import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CONFIG } from "../../../config";
import { useCurrency } from "../../../core/currency/useCurrency";
import { PaymentBroker } from "../../../core/payment/PaymentBroker";

// Stripe singleton — loaded once outside component tree
const STRIPE_KEY = CONFIG.STRIPE_PUBLIC_KEY || null;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentModalProps {
  orderId: string;
  restaurantId: string;
  orderTotal: number;
  onPay: (method: string, intentId?: string) => Promise<void> | void;
  onCancel: () => void;
  isDemoMode?: boolean;
}

type PaymentMethodId = "cash" | "card" | "mbway" | "pix";

interface MethodOption {
  id: PaymentMethodId;
  label: string;
  icon: string;
  description: string;
}

const METHODS: MethodOption[] = [
  {
    id: "cash",
    label: "Dinheiro",
    icon: "💶",
    description: "Pagamento em especie",
  },
  {
    id: "card",
    label: "Cartao",
    icon: "💳",
    description: "Terminal MB / Visa / MC",
  },
  {
    id: "mbway",
    label: "MB WAY",
    icon: "📱",
    description: "Pagamento por telemovel",
  },
  {
    id: "pix",
    label: "PIX",
    icon: "⚡",
    description: "Transferencia instantanea",
  },
];

const QUICK_CASH = [5_00, 10_00, 20_00, 50_00];

const ACCENT = "#6366f1";
const GREEN = "#10b981";
const SURFACE = "#18181b";
const BG = "#0a0a0a";
const CARD_BG = "#27272a";
const DANGER = "#ef4444";

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  restaurantId,
  orderTotal,
  onPay,
  onCancel,
  isDemoMode,
}) => {
  const { formatAmount } = useCurrency();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [cashTendered, setCashTendered] = useState("");
  const [mbwayPhone, setMbwayPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Stripe card flow
  type CardStep = "idle" | "creating-intent" | "ready";
  const [cardStep, setCardStep] = useState<CardStep>("idle");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const intentCreatedRef = useRef(false);

  useEffect(() => {
    setCashTendered("");
    setMbwayPhone("");
    setErrorMsg("");
    setCardStep("idle");
    setStripeClientSecret(null);
    intentCreatedRef.current = false;
  }, [method]);

  // Auto-create PaymentIntent when "card" is selected (non-demo)
  useEffect(() => {
    if (method !== "card" || isDemoMode || intentCreatedRef.current) return;
    if (!STRIPE_KEY) return; // no Stripe key configured — will show fallback
    intentCreatedRef.current = true;
    setCardStep("creating-intent");
    setErrorMsg("");
    PaymentBroker.createPaymentIntent({
      orderId,
      amount: orderTotal,
      currency: "eur",
      restaurantId,
    })
      .then((result) => {
        setStripeClientSecret(result.clientSecret);
        setCardStep("ready");
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || "Erro ao preparar pagamento com cartao");
        setCardStep("idle");
        intentCreatedRef.current = false;
      });
  }, [method, isDemoMode, orderId, orderTotal, restaurantId]);

  const cashCents = useMemo(() => {
    const value = parseFloat(cashTendered || "0");
    return Number.isFinite(value) ? Math.round(value * 100) : 0;
  }, [cashTendered]);

  const changeCents = useMemo(
    () => cashCents - orderTotal,
    [cashCents, orderTotal],
  );

  const canConfirm = useMemo(() => {
    if (!method || processing) return false;
    if (method === "cash") return cashCents >= orderTotal;
    if (method === "mbway") return /^9\d{8}$/.test(mbwayPhone);
    // Card handled by Stripe form; hide generic confirm when ready
    if (method === "card") return isDemoMode === true;
    return true;
  }, [cashCents, isDemoMode, mbwayPhone, method, orderTotal, processing]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current && !processing) onCancel();
    },
    [onCancel, processing],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel, processing]);

  const handleConfirm = useCallback(async () => {
    if (!method || !canConfirm) return;
    setProcessing(true);
    setErrorMsg("");
    try {
      const backendMethod = method === "mbway" ? "card" : method;
      await onPay(backendMethod);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  }, [canConfirm, method, onPay]);

  // Called when Stripe Elements confirm succeeds
  const handleCardSuccess = useCallback(
    async (paymentIntentId: string) => {
      setProcessing(true);
      setErrorMsg("");
      try {
        await onPay("card", paymentIntentId);
      } catch (err: any) {
        setErrorMsg(err?.message || "Erro ao finalizar pagamento");
      } finally {
        setProcessing(false);
      }
    },
    [onPay],
  );

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Pagamento</h2>
            <span style={styles.orderId}>Pedido #{orderId.slice(-6)}</span>
          </div>
          <button
            onClick={onCancel}
            disabled={processing}
            style={styles.closeBtn}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div style={styles.totalSection}>
          <span style={styles.totalLabel}>TOTAL A PAGAR</span>
          <span style={styles.totalValue}>{formatAmount(orderTotal)}</span>
          {isDemoMode && <span style={styles.demoBadge}>MODO DEMO</span>}
        </div>

        <div style={styles.section}>
          <span style={styles.sectionTitle}>Forma de Pagamento</span>
          <div style={styles.methodGrid}>
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                disabled={processing}
                style={{
                  ...styles.methodCard,
                  ...(method === m.id ? styles.methodActive : {}),
                }}
              >
                <span style={{ fontSize: 28 }}>{m.icon}</span>
                <span style={styles.methodLabel}>{m.label}</span>
                <span style={styles.methodDesc}>{m.description}</span>
              </button>
            ))}
          </div>
        </div>

        {method === "cash" && (
          <div style={styles.section}>
            <span style={styles.sectionTitle}>Valor Entregue</span>
            <div style={styles.cashInputRow}>
              <span style={styles.cashPrefix}>€</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder="0.00"
                style={styles.cashInput}
                autoFocus
              />
            </div>
            <div style={styles.quickCashRow}>
              <button
                onClick={() => setCashTendered((orderTotal / 100).toFixed(2))}
                style={styles.quickCashBtn}
              >
                Exato
              </button>
              {QUICK_CASH.map((c) => (
                <button
                  key={c}
                  onClick={() => setCashTendered((c / 100).toFixed(2))}
                  style={styles.quickCashBtn}
                >
                  €{(c / 100).toFixed(0)}
                </button>
              ))}
            </div>
            {cashCents > 0 && (
              <div
                style={{
                  ...styles.changeRow,
                  color: changeCents >= 0 ? GREEN : DANGER,
                }}
              >
                <span>Troco</span>
                <span style={{ fontWeight: 700, fontSize: 22 }}>
                  {changeCents >= 0
                    ? formatAmount(changeCents)
                    : `Faltam ${formatAmount(Math.abs(changeCents))}`}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "card" && (
          <div style={styles.section}>
            {isDemoMode ? (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>💳</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  Demo: pagamento simulado
                </span>
              </div>
            ) : !STRIPE_KEY ? (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⚠️</span>
                <span style={{ color: "#fbbf24", fontSize: 14 }}>
                  Stripe nao configurado — defina VITE_STRIPE_PUBLISHABLE_KEY
                </span>
              </div>
            ) : cardStep === "creating-intent" ? (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⏳</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  A preparar pagamento...
                </span>
              </div>
            ) : cardStep === "ready" && stripeClientSecret && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: stripeClientSecret,
                  appearance: {
                    theme: "night",
                    variables: { colorPrimary: GREEN },
                  },
                }}
              >
                <InlineCardForm
                  onSuccess={handleCardSuccess}
                  disabled={processing}
                />
              </Elements>
            ) : (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>💳</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  Selecione cartao para iniciar
                </span>
              </div>
            )}
          </div>
        )}

        {method === "mbway" && (
          <div style={styles.section}>
            <span style={styles.sectionTitle}>Numero de Telemovel</span>
            <div style={styles.cashInputRow}>
              <span style={styles.cashPrefix}>+351</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={9}
                value={mbwayPhone}
                onChange={(e) =>
                  setMbwayPhone(e.target.value.replace(/\D/g, ""))
                }
                placeholder="9XX XXX XXX"
                style={styles.cashInput}
                autoFocus
              />
            </div>
          </div>
        )}

        {method === "pix" && (
          <div style={styles.terminalWaiting}>
            <span style={{ fontSize: 36 }}>⚡</span>
            <span style={{ color: "#a1a1aa", fontSize: 14 }}>
              QR Code sera gerado ao confirmar
            </span>
          </div>
        )}

        {errorMsg && (
          <div style={styles.errorBanner}>
            <span>❌ {errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={{
            ...styles.confirmBtn,
            opacity: canConfirm ? 1 : 0.4,
            cursor: canConfirm ? "pointer" : "not-allowed",
            // Hide when Stripe form is active (it has its own submit)
            display:
              method === "card" && !isDemoMode && cardStep === "ready"
                ? "none"
                : "flex",
          }}
        >
          {processing
            ? "A processar..."
            : `Confirmar ${formatAmount(orderTotal)}`}
        </button>
      </div>
    </div>
  );
};

// ── Inline Stripe card form (used inside <Elements>) ──────────────
const InlineCardForm: React.FC<{
  onSuccess: (paymentIntentId: string) => void;
  disabled?: boolean;
}> = ({ onSuccess, disabled }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Erro ao processar cartao");
      setSubmitting(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError(
        "Estado inesperado: " + (paymentIntent?.status || "desconhecido"),
      );
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <PaymentElement />
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.15)",
            border: `1px solid ${DANGER}`,
            color: "#fecaca",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting || disabled}
        style={{
          ...cardFormBtnStyle,
          opacity: !stripe || submitting || disabled ? 0.4 : 1,
          cursor: !stripe || submitting || disabled ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "A processar..." : "Pagar com Cartao"}
      </button>
    </form>
  );
};

const cardFormBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "14px 0",
  background: GREEN,
  border: "none",
  borderRadius: 12,
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  transition: "opacity 0.15s",
  marginTop: 4,
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: BG,
    border: `1px solid ${CARD_BG}`,
    borderRadius: 20,
    width: "min(460px, 95vw)",
    maxHeight: "92vh",
    overflowY: "auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
  },
  orderId: {
    color: "#71717a",
    fontSize: 13,
    fontFamily: "monospace",
  },
  closeBtn: {
    background: SURFACE,
    border: "none",
    color: "#a1a1aa",
    fontSize: 18,
    width: 36,
    height: 36,
    borderRadius: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  totalSection: {
    textAlign: "center",
    padding: "16px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  totalLabel: {
    color: "#71717a",
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: 600,
  },
  totalValue: {
    color: GREEN,
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: -1,
  },
  demoBadge: {
    background: ACCENT,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 6,
    marginTop: 4,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionTitle: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  methodGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  methodCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "18px 12px",
    background: SURFACE,
    border: `2px solid transparent`,
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  methodActive: {
    borderColor: GREEN,
    background: "#052e16",
  },
  methodLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
  },
  methodDesc: {
    color: "#71717a",
    fontSize: 11,
    textAlign: "center",
  },
  cashInputRow: {
    display: "flex",
    alignItems: "center",
    background: SURFACE,
    borderRadius: 12,
    padding: "4px 14px",
    gap: 8,
  },
  cashPrefix: {
    color: "#71717a",
    fontSize: 20,
    fontWeight: 600,
  },
  cashInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
    padding: "10px 0",
    fontFamily: "inherit",
  },
  quickCashRow: {
    display: "flex",
    gap: 8,
  },
  quickCashBtn: {
    flex: 1,
    padding: "10px 0",
    background: CARD_BG,
    border: "none",
    borderRadius: 8,
    color: "#d4d4d8",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  changeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: SURFACE,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
  },
  terminalWaiting: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "28px 0",
    background: SURFACE,
    borderRadius: 14,
  },
  errorBanner: {
    background: "rgba(239,68,68,0.15)",
    border: `1px solid ${DANGER}`,
    color: "#fecaca",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
  },
  confirmBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "16px 0",
    background: GREEN,
    border: "none",
    borderRadius: 14,
    color: "#fff",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.15s",
    marginTop: 4,
  },
};
