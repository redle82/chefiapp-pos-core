/**
 * SplitBillModal — Full split bill UI with 3 tabs:
 *   1. Equal Split — divide total equally among N people
 *   2. By Items — drag/assign items to people
 *   3. Custom — manual amounts per person
 *
 * Each person's part has a "Pay" button that triggers the payment flow.
 * Visual tracking: paid / pending for each split part.
 * Cannot close until all parts are paid.
 *
 * Dark theme, amber accents, matching existing TPV design.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";
import {
  splitEqual,
  splitByItems,
  splitCustom,
  validateSplitSum,
  type SplitBillPart,
  type ItemAssignment,
} from "../../../core/orders/SplitBillService";
import type { OrderSummaryItem } from "./OrderSummaryPanel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SplitBillModalProps {
  orderId: string;
  orderTotal: number;
  taxCents: number;
  items: OrderSummaryItem[];
  onPayPart: (
    amountCents: number,
    method: "cash" | "card" | "pix",
    partIndex: number,
  ) => Promise<void>;
  onAllPaid: () => void;
  onCancel: () => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type SplitTab = "equal" | "byItems" | "custom";
type PayMethod = "cash" | "card" | "pix";

const BG = "#0a0a0a";
const SURFACE = "#18181b";
const CARD = "#27272a";
const AMBER = "#f59e0b";
const AMBER_DARK = "#78350f";
const GREEN = "#10b981";
const RED = "#ef4444";
const TEXT = "#e4e4e7";
const TEXT_MUTED = "#a1a1aa";
const TEXT_DIM = "#71717a";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SplitBillModal({
  orderId,
  orderTotal,
  taxCents,
  items,
  onPayPart,
  onAllPaid,
  onCancel,
  loading = false,
}: SplitBillModalProps) {
  const { t } = useTranslation("tpv");
  const { formatAmount, symbol } = useCurrency();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<SplitTab>("equal");

  // Equal split state
  const [splitCount, setSplitCount] = useState(2);

  // By-items state: person count + assignments
  const [byItemsPersonCount, setByItemsPersonCount] = useState(2);
  const [assignments, setAssignments] = useState<Map<string, number>>(new Map());

  // Custom split state
  const [customPersonCount, setCustomPersonCount] = useState(2);
  const [customAmounts, setCustomAmounts] = useState<string[]>(["", ""]);

  // Computed parts (generated when user confirms split configuration)
  const [parts, setParts] = useState<SplitBillPart[] | null>(null);

  // Payment flow state
  const [payingIndex, setPayingIndex] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [payError, setPayError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Check if all parts are paid
  const allPaid = parts?.every((p) => p.paymentStatus === "paid") ?? false;
  const paidCount = parts?.filter((p) => p.paymentStatus === "paid").length ?? 0;
  const canClose = !parts || allPaid;

  // ---------------------------------------------------------------------------
  // Equal split computation
  // ---------------------------------------------------------------------------

  const equalParts = useMemo(
    () => splitEqual(orderTotal, taxCents, splitCount),
    [orderTotal, taxCents, splitCount],
  );

  // ---------------------------------------------------------------------------
  // By-items helpers
  // ---------------------------------------------------------------------------

  const assignItem = useCallback((itemId: string, personIndex: number) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      next.set(itemId, personIndex);
      return next;
    });
  }, []);

  const unassignItem = useCallback((itemId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  const allItemsAssigned = items.every((item) =>
    assignments.has(item.product_id),
  );

  const byItemsValid = allItemsAssigned && items.length > 0;

  // ---------------------------------------------------------------------------
  // Custom split helpers
  // ---------------------------------------------------------------------------

  const customCents = useMemo(() => {
    return customAmounts.map((a) => {
      const v = parseFloat(a || "0");
      return Number.isFinite(v) ? Math.round(v * 100) : 0;
    });
  }, [customAmounts]);

  const customSum = customCents.reduce((a, b) => a + b, 0);
  const customDiff = orderTotal - customSum;
  const customValid = customDiff === 0 && customCents.every((c) => c >= 0);

  // ---------------------------------------------------------------------------
  // Generate parts (confirm split config)
  // ---------------------------------------------------------------------------

  const handleConfirmSplit = useCallback(() => {
    try {
      let generated: SplitBillPart[];

      if (activeTab === "equal") {
        generated = splitEqual(orderTotal, taxCents, splitCount);
      } else if (activeTab === "byItems") {
        const assignmentArray: ItemAssignment[] = [];
        assignments.forEach((personIndex, itemId) => {
          assignmentArray.push({ itemId, personIndex });
        });
        generated = splitByItems(items, assignmentArray, orderTotal, taxCents);
      } else {
        generated = splitCustom(customCents, orderTotal, taxCents);
      }

      if (!validateSplitSum(generated, orderTotal)) {
        setPayError("Split validation failed: amounts do not sum to total.");
        return;
      }

      setParts(generated);
      setPayError(null);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Split error");
    }
  }, [
    activeTab,
    orderTotal,
    taxCents,
    splitCount,
    assignments,
    items,
    customCents,
  ]);

  // ---------------------------------------------------------------------------
  // Pay a single part
  // ---------------------------------------------------------------------------

  const handlePayPart = useCallback(
    async (partIndex: number) => {
      if (!parts) return;
      const part = parts.find((p) => p.partIndex === partIndex);
      if (!part || part.paymentStatus === "paid") return;

      setProcessing(true);
      setPayError(null);

      try {
        await onPayPart(part.totalCents, payMethod, partIndex);

        // Mark as paid locally
        setParts((prev) =>
          prev?.map((p) =>
            p.partIndex === partIndex
              ? { ...p, paymentStatus: "paid" as const, paymentMethod: payMethod }
              : p,
          ) ?? null,
        );
        setPayingIndex(null);
      } catch (err) {
        setPayError(err instanceof Error ? err.message : "Payment failed");
      } finally {
        setProcessing(false);
      }
    },
    [parts, payMethod, onPayPart],
  );

  // Auto-trigger onAllPaid when all parts are paid
  useEffect(() => {
    if (parts && parts.length > 0 && parts.every((p) => p.paymentStatus === "paid")) {
      // Small delay so user sees the final state
      const timer = setTimeout(() => onAllPaid(), 800);
      return () => clearTimeout(timer);
    }
  }, [parts, onAllPaid]);

  // ---------------------------------------------------------------------------
  // Keyboard & overlay
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose && !processing) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel, canClose, processing]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current && canClose && !processing) {
        onCancel();
      }
    },
    [onCancel, canClose, processing],
  );

  // ---------------------------------------------------------------------------
  // Custom amounts: sync count
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setCustomAmounts((prev) => {
      if (prev.length === customPersonCount) return prev;
      if (customPersonCount > prev.length) {
        return [...prev, ...Array(customPersonCount - prev.length).fill("")];
      }
      return prev.slice(0, customPersonCount);
    });
  }, [customPersonCount]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={styles.overlay}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="split-bill-title"
        style={styles.modal}
      >
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 id="split-bill-title" style={styles.title}>{t("splitBill.title", "Split Bill")}</h2>
            <span style={styles.orderId}>
              {t("splitBill.orderLabel", "Order")} #{orderId.slice(-6)}
            </span>
          </div>
          <button
            onClick={() => canClose && !processing && onCancel()}
            disabled={!canClose || processing}
            style={{
              ...styles.closeBtn,
              opacity: canClose && !processing ? 1 : 0.3,
              cursor: canClose && !processing ? "pointer" : "not-allowed",
            }}
            aria-label="Close"
          >
            x
          </button>
        </div>

        {/* Total bar */}
        <div style={styles.totalBar}>
          <div>
            <div style={styles.totalLabel}>{t("splitBill.total", "Total")}</div>
            <div style={styles.totalValue}>{formatAmount(orderTotal)}</div>
          </div>
          {parts && (
            <div style={{ textAlign: "right" }}>
              <div style={styles.totalLabel}>{t("splitBill.paid", "Paid")}</div>
              <div style={{ ...styles.totalValueSmall, color: paidCount > 0 ? GREEN : TEXT }}>
                {paidCount}/{parts.length}
              </div>
            </div>
          )}
        </div>

        {/* ── Tab selector (only shown before parts are confirmed) ── */}
        {!parts && (
          <>
            <div style={styles.tabRow} role="tablist" aria-label={t("splitBill.splitMethod", "Split method")}>
              {(
                [
                  { id: "equal" as const, label: t("splitBill.equalTab", "Equal Split") },
                  { id: "byItems" as const, label: t("splitBill.byItemsTab", "By Items") },
                  { id: "custom" as const, label: t("splitBill.customTab", "Custom") },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.tabBtn,
                    ...(activeTab === tab.id ? styles.tabBtnActive : {}),
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Equal Split Config ── */}
            {activeTab === "equal" && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  {t("splitBill.numberOfPeople", "Number of people")}
                </div>
                <div style={styles.counterRow}>
                  <button
                    onClick={() => setSplitCount((c) => Math.max(2, c - 1))}
                    aria-label={t("splitBill.decreasePeople", "Decrease number of people")}
                    style={styles.counterBtn}
                  >
                    -
                  </button>
                  <div style={styles.counterValue} aria-live="polite">{splitCount}</div>
                  <button
                    onClick={() => setSplitCount((c) => Math.min(20, c + 1))}
                    aria-label={t("splitBill.increasePeople", "Increase number of people")}
                    style={styles.counterBtn}
                  >
                    +
                  </button>
                </div>

                {/* Preview amounts */}
                <div style={styles.previewBox}>
                  {equalParts.map((p) => (
                    <div key={p.partIndex} style={styles.previewRow}>
                      <span style={{ color: TEXT_MUTED }}>{p.label}</span>
                      <span style={{ color: AMBER, fontWeight: 700 }}>
                        {formatAmount(p.totalCents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── By Items Config ── */}
            {activeTab === "byItems" && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  {t("splitBill.numberOfPeople", "Number of people")}
                </div>
                <div style={styles.counterRow}>
                  <button
                    onClick={() => setByItemsPersonCount((c) => Math.max(2, c - 1))}
                    style={styles.counterBtn}
                  >
                    -
                  </button>
                  <div style={styles.counterValue}>{byItemsPersonCount}</div>
                  <button
                    onClick={() => setByItemsPersonCount((c) => Math.min(20, c + 1))}
                    style={styles.counterBtn}
                  >
                    +
                  </button>
                </div>

                <div style={styles.sectionLabel}>
                  {t("splitBill.assignItems", "Assign items to people")}
                </div>

                <div style={styles.itemAssignList}>
                  {items.map((item) => {
                    const assignedTo = assignments.get(item.product_id);
                    const modDelta = (item.modifiers ?? []).reduce(
                      (s, m) => s + m.priceDeltaCents,
                      0,
                    );
                    const lineTotal = (item.unit_price + modDelta) * item.quantity;

                    return (
                      <div
                        key={item.product_id}
                        style={{
                          ...styles.itemAssignRow,
                          borderColor:
                            assignedTo !== undefined ? AMBER : "#3f3f46",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: TEXT,
                              fontSize: 13,
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.quantity}x {item.name}
                          </div>
                          <div style={{ color: TEXT_DIM, fontSize: 11 }}>
                            {formatAmount(lineTotal)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {Array.from({ length: byItemsPersonCount }, (_, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                assignedTo === i
                                  ? unassignItem(item.product_id)
                                  : assignItem(item.product_id, i)
                              }
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border:
                                  assignedTo === i
                                    ? `2px solid ${AMBER}`
                                    : "1px solid #3f3f46",
                                background:
                                  assignedTo === i ? AMBER_DARK : SURFACE,
                                color: assignedTo === i ? AMBER : TEXT_DIM,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title={`Person ${i + 1}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!allItemsAssigned && (
                  <div style={{ color: AMBER, fontSize: 12, marginTop: 4 }}>
                    {t(
                      "splitBill.assignAllItems",
                      "All items must be assigned before proceeding.",
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Custom Config ── */}
            {activeTab === "custom" && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  {t("splitBill.numberOfPeople", "Number of people")}
                </div>
                <div style={styles.counterRow}>
                  <button
                    onClick={() =>
                      setCustomPersonCount((c) => Math.max(2, c - 1))
                    }
                    style={styles.counterBtn}
                  >
                    -
                  </button>
                  <div style={styles.counterValue}>{customPersonCount}</div>
                  <button
                    onClick={() =>
                      setCustomPersonCount((c) => Math.min(20, c + 1))
                    }
                    style={styles.counterBtn}
                  >
                    +
                  </button>
                </div>

                <div style={styles.customAmountList}>
                  {customAmounts.map((amt, i) => (
                    <div key={i} style={styles.customAmountRow}>
                      <span style={{ color: TEXT_MUTED, fontSize: 13, minWidth: 70 }}>
                        Person {i + 1}
                      </span>
                      <div style={styles.customInputWrap}>
                        <span style={styles.customPrefix}>{symbol}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={amt}
                          onChange={(e) => {
                            const next = [...customAmounts];
                            next[i] = e.target.value;
                            setCustomAmounts(next);
                          }}
                          placeholder="0.00"
                          style={styles.customInput}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderTop: `1px solid ${CARD}`,
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: TEXT_MUTED, fontSize: 13 }}>
                    {t("splitBill.remaining", "Remaining")}
                  </span>
                  <span
                    style={{
                      color: customDiff === 0 ? GREEN : RED,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {customDiff === 0
                      ? t("splitBill.balanced", "Balanced")
                      : formatAmount(Math.abs(customDiff)) +
                        (customDiff > 0 ? ` ${t("splitBill.short", "short")}` : ` ${t("splitBill.over", "over")}`)}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {payError && (
              <div role="alert" style={styles.errorBanner}>{payError}</div>
            )}

            {/* Confirm split button */}
            <button
              onClick={handleConfirmSplit}
              disabled={
                (activeTab === "byItems" && !byItemsValid) ||
                (activeTab === "custom" && !customValid)
              }
              style={{
                ...styles.confirmBtn,
                opacity:
                  (activeTab === "byItems" && !byItemsValid) ||
                  (activeTab === "custom" && !customValid)
                    ? 0.4
                    : 1,
                cursor:
                  (activeTab === "byItems" && !byItemsValid) ||
                  (activeTab === "custom" && !customValid)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {t("splitBill.confirmSplit", "Confirm Split")}
            </button>
          </>
        )}

        {/* ── Payment Phase: show parts with pay buttons ── */}
        {parts && (
          <>
            <div style={styles.partsGrid}>
              {parts.map((part) => {
                const isPaid = part.paymentStatus === "paid";
                const isPayingThis = payingIndex === part.partIndex;

                return (
                  <div
                    key={part.partIndex}
                    style={{
                      ...styles.partCard,
                      borderColor: isPaid ? GREEN : isPayingThis ? AMBER : CARD,
                      opacity: isPaid ? 0.7 : 1,
                    }}
                  >
                    <div style={styles.partHeader}>
                      <span
                        style={{
                          color: isPaid ? GREEN : TEXT,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {part.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: isPaid ? GREEN : TEXT_DIM,
                          fontWeight: 600,
                        }}
                      >
                        {isPaid
                          ? t("splitBill.statusPaid", "Paid")
                          : t("splitBill.statusPending", "Pending")}
                      </span>
                    </div>

                    {/* Item list for by-items mode */}
                    {part.items.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        {part.items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 11,
                              color: TEXT_DIM,
                              padding: "1px 0",
                            }}
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>{formatAmount(item.lineTotalCents)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        color: AMBER,
                        fontSize: 20,
                        fontWeight: 800,
                        textAlign: "center",
                        padding: "4px 0",
                      }}
                    >
                      {formatAmount(part.totalCents)}
                    </div>

                    {!isPaid && !isPayingThis && (
                      <button
                        onClick={() => {
                          setPayingIndex(part.partIndex);
                          setPayError(null);
                        }}
                        disabled={processing || loading}
                        style={styles.payPartBtn}
                      >
                        {t("splitBill.pay", "Pay")}
                      </button>
                    )}

                    {isPaid && part.paymentMethod && (
                      <div
                        style={{
                          textAlign: "center",
                          color: GREEN,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {part.paymentMethod === "cash"
                          ? t("splitBill.methodCash", "Cash")
                          : part.paymentMethod === "card"
                            ? t("splitBill.methodCard", "Card")
                            : t("splitBill.methodPix", "MB Way")}
                      </div>
                    )}

                    {/* Inline payment method selector */}
                    {isPayingThis && !isPaid && (
                      <div style={{ marginTop: 8 }}>
                        <div style={styles.methodRow}>
                          {(
                            [
                              { id: "cash" as const, label: t("splitBill.methodCash", "Cash") },
                              { id: "card" as const, label: t("splitBill.methodCard", "Card") },
                              { id: "pix" as const, label: t("splitBill.methodPix", "MB Way") },
                            ] as const
                          ).map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setPayMethod(m.id)}
                              style={{
                                ...styles.methodBtn,
                                ...(payMethod === m.id
                                  ? styles.methodBtnActive
                                  : {}),
                              }}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button
                            onClick={() => setPayingIndex(null)}
                            style={styles.cancelPayBtn}
                          >
                            {t("splitBill.cancel", "Cancel")}
                          </button>
                          <button
                            onClick={() => handlePayPart(part.partIndex)}
                            disabled={processing || loading}
                            style={{
                              ...styles.confirmPayBtn,
                              opacity: processing ? 0.5 : 1,
                            }}
                          >
                            {processing
                              ? t("splitBill.processing", "Processing...")
                              : `${t("splitBill.pay", "Pay")} ${formatAmount(part.totalCents)}`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error */}
            {payError && (
              <div role="alert" style={styles.errorBanner}>{payError}</div>
            )}

            {/* Back to config */}
            {!allPaid && (
              <button
                onClick={() => {
                  setParts(null);
                  setPayingIndex(null);
                  setPayError(null);
                }}
                disabled={paidCount > 0}
                style={{
                  ...styles.backBtn,
                  opacity: paidCount > 0 ? 0.3 : 1,
                  cursor: paidCount > 0 ? "not-allowed" : "pointer",
                }}
              >
                {t("splitBill.backToConfig", "Back to split configuration")}
              </button>
            )}

            {/* All paid success message */}
            {allPaid && (
              <div style={styles.successBanner}>
                {t("splitBill.allPaid", "All parts paid! Closing...")}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)",
    padding: 16,
  },
  modal: {
    background: BG,
    border: `1px solid ${CARD}`,
    borderRadius: 20,
    width: "min(560px, 96vw)",
    maxHeight: "92vh",
    overflowY: "auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    color: AMBER,
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
  },
  orderId: {
    color: TEXT_DIM,
    fontSize: 13,
    fontFamily: "monospace",
  },
  closeBtn: {
    background: SURFACE,
    border: "none",
    color: TEXT_MUTED,
    fontSize: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  totalBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: SURFACE,
    padding: 16,
    borderRadius: 14,
  },
  totalLabel: {
    color: TEXT_DIM,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  totalValue: {
    color: AMBER,
    fontSize: 24,
    fontWeight: 800,
  },
  totalValueSmall: {
    fontSize: 16,
    fontWeight: 700,
  },
  tabRow: {
    display: "flex",
    gap: 6,
    background: SURFACE,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    padding: "10px 0",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tabBtnActive: {
    background: AMBER_DARK,
    color: AMBER,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionLabel: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  counterRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: CARD,
    border: "none",
    color: TEXT,
    fontSize: 20,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: {
    minWidth: 40,
    textAlign: "center",
    color: TEXT,
    fontSize: 22,
    fontWeight: 800,
  },
  previewBox: {
    background: SURFACE,
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  previewRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  itemAssignList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxHeight: 240,
    overflowY: "auto",
  },
  itemAssignRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: SURFACE,
    borderRadius: 10,
    padding: "8px 12px",
    border: "1px solid #3f3f46",
    transition: "border-color 0.15s",
  },
  customAmountList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  customAmountRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  customInputWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    background: SURFACE,
    borderRadius: 10,
    padding: "2px 10px",
    gap: 6,
  },
  customPrefix: {
    color: TEXT_DIM,
    fontSize: 16,
    fontWeight: 600,
  },
  customInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: TEXT,
    fontSize: 16,
    fontWeight: 700,
    padding: "8px 0",
    fontFamily: "inherit",
  },
  confirmBtn: {
    padding: "14px 0",
    background: AMBER,
    border: "none",
    borderRadius: 14,
    color: "#000",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  partsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  },
  partCard: {
    background: SURFACE,
    borderRadius: 14,
    padding: 14,
    border: `2px solid ${CARD}`,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    transition: "border-color 0.15s",
  },
  partHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payPartBtn: {
    width: "100%",
    padding: "10px 0",
    background: AMBER_DARK,
    border: `1px solid ${AMBER}`,
    borderRadius: 10,
    color: AMBER,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
  methodRow: {
    display: "flex",
    gap: 4,
  },
  methodBtn: {
    flex: 1,
    padding: "8px 0",
    background: CARD,
    border: "2px solid transparent",
    borderRadius: 8,
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  methodBtnActive: {
    borderColor: GREEN,
    background: "#052e16",
    color: "#fff",
  },
  cancelPayBtn: {
    flex: 1,
    padding: "10px 0",
    background: CARD,
    border: "none",
    borderRadius: 10,
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  confirmPayBtn: {
    flex: 2,
    padding: "10px 0",
    background: GREEN,
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBanner: {
    background: "rgba(239,68,68,0.15)",
    border: `1px solid ${RED}`,
    color: "#fecaca",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13,
  },
  successBanner: {
    background: "rgba(16,185,129,0.15)",
    border: `1px solid ${GREEN}`,
    color: "#a7f3d0",
    padding: "14px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    textAlign: "center",
  },
  backBtn: {
    padding: "10px 0",
    background: "transparent",
    border: `1px solid ${CARD}`,
    borderRadius: 10,
    color: TEXT_DIM,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },
};
