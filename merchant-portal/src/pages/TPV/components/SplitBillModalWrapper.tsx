import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCurrency } from "../../../core/currency/useCurrency";

interface SplitBillModalWrapperProps {
  orderId: string;
  restaurantId: string;
  orderTotal: number;
  onPayPartial: (
    amountCents: number,
    method: "cash" | "card" | "pix",
  ) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

type SplitMode = "equal" | "manual";
type PayMethod = "cash" | "card" | "pix";

const SURFACE = "#18181b";
const BG = "#0a0a0a";
const CARD_BG = "#27272a";
const ACCENT = "#6366f1";
const GREEN = "#10b981";
const DANGER = "#ef4444";

export const SplitBillModalWrapper: React.FC<SplitBillModalWrapperProps> = ({
  orderId,
  orderTotal,
  onPayPartial,
  onCancel,
  loading,
}) => {
  const { formatAmount } = useCurrency();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [remainingCents, setRemainingCents] = useState(orderTotal);
  const [paidCents, setPaidCents] = useState(0);
  const [mode, setMode] = useState<SplitMode>("equal");
  const [splitCount, setSplitCount] = useState(2);
  const [manualAmount, setManualAmount] = useState("");
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const { PaymentEngine } = await import("../../../core/tpv/PaymentEngine");
      const payments = await PaymentEngine.getPaymentsByOrder(orderId);
      const paid = payments
        .filter((p: any) => p.status === "PAID")
        .reduce((sum: number, p: any) => sum + p.amountCents, 0);
      setPaidCents(paid);
      setRemainingCents(Math.max(orderTotal - paid, 0));
    } catch (err) {
      console.warn("[SplitBillModal] Failed to load payments", err);
    }
  }, [orderId, orderTotal]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    setManualAmount("");
    setErrorMsg("");
  }, [mode]);

  const perPersonCents = useMemo(() => {
    if (splitCount <= 0) return remainingCents;
    return Math.max(Math.round(remainingCents / splitCount), 0);
  }, [remainingCents, splitCount]);

  const manualCents = useMemo(() => {
    const value = parseFloat(manualAmount || "0");
    return Number.isFinite(value) ? Math.round(value * 100) : 0;
  }, [manualAmount]);

  const canConfirm = useMemo(() => {
    if (!method || processing || loading) return false;
    if (remainingCents <= 0) return false;
    if (mode === "equal") return perPersonCents > 0;
    return manualCents > 0 && manualCents <= remainingCents;
  }, [
    loading,
    manualCents,
    method,
    mode,
    perPersonCents,
    processing,
    remainingCents,
  ]);

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

    const amountCents = mode === "equal" ? perPersonCents : manualCents;
    if (amountCents <= 0) {
      setErrorMsg("Valor invalido");
      setProcessing(false);
      return;
    }
    if (amountCents > remainingCents) {
      setErrorMsg("Valor excede o restante");
      setProcessing(false);
      return;
    }

    try {
      await onPayPartial(amountCents, method);
      await loadPayments();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao processar pagamento parcial");
    } finally {
      setProcessing(false);
    }
  }, [
    canConfirm,
    loadPayments,
    manualCents,
    method,
    mode,
    onPayPartial,
    perPersonCents,
    remainingCents,
  ]);

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Dividir Conta</h2>
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

        <div style={styles.totalRow}>
          <div>
            <div style={styles.totalLabel}>Total</div>
            <div style={styles.totalValue}>{formatAmount(orderTotal)}</div>
          </div>
          <div style={styles.totalInfoCol}>
            <div style={styles.totalLabel}>Pago</div>
            <div style={styles.totalValueSmall}>{formatAmount(paidCents)}</div>
          </div>
          <div style={styles.totalInfoCol}>
            <div style={styles.totalLabel}>Restante</div>
            <div style={styles.totalValueSmall}>
              {formatAmount(remainingCents)}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <span style={styles.sectionTitle}>Modo</span>
          <div style={styles.modeRow}>
            <button
              onClick={() => setMode("equal")}
              style={{
                ...styles.modeBtn,
                ...(mode === "equal" ? styles.modeBtnActive : {}),
              }}
            >
              Dividir igual
            </button>
            <button
              onClick={() => setMode("manual")}
              style={{
                ...styles.modeBtn,
                ...(mode === "manual" ? styles.modeBtnActive : {}),
              }}
            >
              Valor manual
            </button>
          </div>
        </div>

        {mode === "equal" && (
          <div style={styles.section}>
            <span style={styles.sectionTitle}>Numero de pessoas</span>
            <div style={styles.countRow}>
              <button
                onClick={() => setSplitCount((c) => Math.max(2, c - 1))}
                style={styles.countBtn}
              >
                -
              </button>
              <div style={styles.countValue}>{splitCount}</div>
              <button
                onClick={() => setSplitCount((c) => Math.min(12, c + 1))}
                style={styles.countBtn}
              >
                +
              </button>
            </div>
            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Cada pessoa paga</div>
              <div style={styles.resultValue}>
                {formatAmount(perPersonCents)}
              </div>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div style={styles.section}>
            <span style={styles.sectionTitle}>Valor</span>
            <div style={styles.cashInputRow}>
              <span style={styles.cashPrefix}>€</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="0.00"
                style={styles.cashInput}
                autoFocus
              />
            </div>
            <div style={styles.remainingNote}>
              Restante: {formatAmount(remainingCents)}
            </div>
          </div>
        )}

        <div style={styles.section}>
          <span style={styles.sectionTitle}>Metodo</span>
          <div style={styles.methodRow}>
            {(
              [
                { id: "cash", label: "Dinheiro" },
                { id: "card", label: "Cartao" },
                { id: "pix", label: "PIX" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                style={{
                  ...styles.methodBtn,
                  ...(method === m.id ? styles.methodBtnActive : {}),
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

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
          }}
        >
          {processing ? "A processar..." : "Registar pagamento"}
        </button>
      </div>
    </div>
  );
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
    width: "min(520px, 95vw)",
    maxHeight: "92vh",
    overflowY: "auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
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
  totalRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr",
    gap: 12,
    background: SURFACE,
    padding: 16,
    borderRadius: 14,
  },
  totalLabel: {
    color: "#71717a",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  totalValue: {
    color: GREEN,
    fontSize: 24,
    fontWeight: 800,
  },
  totalInfoCol: {
    textAlign: "right",
  },
  totalValueSmall: {
    color: "#e4e4e7",
    fontSize: 16,
    fontWeight: 700,
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
  modeRow: {
    display: "flex",
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    padding: "10px 0",
    background: SURFACE,
    border: "2px solid transparent",
    borderRadius: 10,
    color: "#d4d4d8",
    fontWeight: 600,
    cursor: "pointer",
  },
  modeBtnActive: {
    borderColor: ACCENT,
    background: "#1e1b4b",
    color: "#fff",
  },
  countRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  countBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: CARD_BG,
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
  },
  countValue: {
    minWidth: 32,
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
  },
  resultBox: {
    background: SURFACE,
    padding: 16,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  resultLabel: {
    color: "#71717a",
    fontSize: 12,
  },
  resultValue: {
    color: ACCENT,
    fontSize: 26,
    fontWeight: 800,
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
    fontSize: 22,
    fontWeight: 700,
    padding: "10px 0",
    fontFamily: "inherit",
  },
  remainingNote: {
    color: "#71717a",
    fontSize: 12,
  },
  methodRow: {
    display: "flex",
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    padding: "10px 0",
    background: SURFACE,
    border: "2px solid transparent",
    borderRadius: 10,
    color: "#d4d4d8",
    fontWeight: 600,
    cursor: "pointer",
  },
  methodBtnActive: {
    borderColor: GREEN,
    background: "#052e16",
    color: "#fff",
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
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.15s",
    marginTop: 4,
  },
};
