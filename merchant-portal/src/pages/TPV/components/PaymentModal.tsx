import type { PaymentMethod } from "../../../domain/payment/types";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { CONFIG } from "../../../config";
import { useCurrency } from "../../../core/currency/useCurrency";
import { getStripePromise } from "../../../core/payment/loadStripeLazy";
import { PaymentBroker } from "../../../core/payment/PaymentBroker";
import {
  getPaymentMethodIdsForRegion,
  getPaymentRegion,
} from "../../../core/payment/paymentRegion";
import {
  calculateChange,
  calculateGrandTotal,
  calculateTip,
  isCashSufficient,
  parseToCents,
  QUICK_CASH_VALUES,
} from "../../../domain/payment";

const STRIPE_KEY = CONFIG.STRIPE_PUBLIC_KEY || null;

interface PaymentModalProps {
  orderId: string;
  restaurantId: string;
  orderTotal: number;
  onPay: (
    method: string,
    intentId?: string,
    tipCents?: number,
  ) => Promise<void> | void;
  onCancel: () => void;
  isTrialMode?: boolean;
  /** When false (offline/degraded), only cash is shown (DoD B3). */
  isOnline?: boolean;
}

interface MethodOption {
  id: PaymentMethod;
  labelKey: string;
  descKey: string;
  icon: string;
}
const METHOD_OPTIONS: MethodOption[] = [
  {
    id: "cash",
    labelKey: "payment.method.cashLabel",
    descKey: "payment.method.cashDesc",
    icon: "💶",
  },
  {
    id: "card",
    labelKey: "payment.method.cardLabel",
    descKey: "payment.method.cardDesc",
    icon: "💳",
  },
  // MB Way removido: sem provider implementado. Reativar quando provider existir.
  // { id: "mbway", labelKey: "payment.method.mbwayLabel", descKey: "payment.method.mbwayDesc", icon: "📱" },
  {
    id: "pix",
    labelKey: "payment.method.pixLabel",
    descKey: "payment.method.pixDesc",
    icon: "⚡",
  },
  {
    id: "sumup_eur",
    labelKey: "payment.method.sumup_eurLabel",
    descKey: "payment.method.sumup_eurDesc",
    icon: "🇪🇺",
  },
];

const QUICK_CASH = QUICK_CASH_VALUES;

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
  isTrialMode,
  isOnline = true,
}) => {
  const { t } = useTranslation("tpv");
  const { formatAmount, currency, getCurrency } = useCurrency();
  const overlayRef = useRef<HTMLDivElement>(null);

  const methodsToShow = useMemo(() => {
    if (!isOnline) {
      return METHOD_OPTIONS.filter((m) => m.id === "cash").map((m) => ({
        ...m,
        label: t(m.labelKey),
        description: t(m.descKey),
      }));
    }
    const paymentRegion = getPaymentRegion(currency);
    const allowedMethodIds = getPaymentMethodIdsForRegion(paymentRegion);
    return METHOD_OPTIONS.filter((m) => allowedMethodIds.includes(m.id)).map(
      (m) => ({ ...m, label: t(m.labelKey), description: t(m.descKey) }),
    );
  }, [currency, t, isOnline]);
  const currencySymbol = getCurrency(currency).symbol;

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [cashTendered, setCashTendered] = useState("");
  const [mbwayPhone, setMbwayPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pix state
  type PixStep =
    | "idle"
    | "creating"
    | "qr-ready"
    | "polling"
    | "completed"
    | "expired";
  const [pixStep, setPixStep] = useState<PixStep>("idle");
  const [pixCheckoutId, setPixCheckoutId] = useState<string | null>(null);
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null);
  const [pixTimeRemaining, setPixTimeRemaining] = useState<number>(600); // 10 minutes in seconds

  // SumUp EUR state
  type SumUpStep =
    | "idle"
    | "creating"
    | "redirect"
    | "polling"
    | "completed"
    | "failed";
  const [sumupStep, setSumUpStep] = useState<SumUpStep>("idle");
  const [sumupCheckoutId, setSumUpCheckoutId] = useState<string | null>(null);
  const [sumupCheckoutUrl, setSumUpCheckoutUrl] = useState<string | null>(null);
  const [sumupTimeRemaining, setSumUpTimeRemaining] = useState<number>(900); // 15 minutes in seconds

  // Tip / Gorjeta - using domain layer
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const tipCents = useMemo(
    () => calculateTip(orderTotal, tipPercent, customTip),
    [tipPercent, customTip, orderTotal],
  );
  const grandTotal = useMemo(
    () => calculateGrandTotal(orderTotal, tipCents),
    [orderTotal, tipCents],
  );

  // Stripe card flow — load Stripe only when modal is open (avoids TDZ at page load)
  type CardStep = "idle" | "creating-intent" | "ready";
  const [cardStep, setCardStep] = useState<CardStep>("idle");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const intentCreatedRef = useRef(false);

  useEffect(() => {
    getStripePromise(STRIPE_KEY).then(setStripeInstance);
  }, []);

  useEffect(() => {
    setCashTendered("");
    setMbwayPhone("");
    setErrorMsg("");
    setCardStep("idle");
    setStripeClientSecret(null);
    intentCreatedRef.current = false;
    // Reset Pix state
    setPixStep("idle");
    setPixCheckoutId(null);
    setPixQrCodeUrl(null);
    setPixTimeRemaining(600);
    // Reset SumUp state
    setSumUpStep("idle");
    setSumUpCheckoutId(null);
    setSumUpCheckoutUrl(null);
    setSumUpTimeRemaining(900);
  }, [method]);

  // Auto-create PaymentIntent when "card" is selected (non-trial)
  useEffect(() => {
    if (method !== "card" || isTrialMode || intentCreatedRef.current) return;
    if (!STRIPE_KEY) return; // no Stripe key configured — will show fallback
    intentCreatedRef.current = true;
    setCardStep("creating-intent");
    setErrorMsg("");
    PaymentBroker.createPaymentIntent({
      orderId,
      amount: orderTotal,
      currency: currency.toLowerCase(),
      restaurantId,
    })
      .then((result) => {
        setStripeClientSecret(result.clientSecret);
        setCardStep("ready");
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || t("payment.error.cardPrepare"));
        setCardStep("idle");
        intentCreatedRef.current = false;
      });
  }, [method, isTrialMode, orderId, orderTotal, restaurantId]);

  // Cash calculations - using domain layer
  const cashCents = useMemo(() => parseToCents(cashTendered), [cashTendered]);

  const changeCents = useMemo(
    () => calculateChange(cashCents, grandTotal),
    [cashCents, grandTotal],
  );

  // Validation - using domain layer
  const canConfirm = useMemo(() => {
    if (!method || processing) return false;
    if (method === "cash") return isCashSufficient(cashCents, grandTotal);
    if (method === "mbway") return /^9\d{8}$/.test(mbwayPhone);
    // Card handled by Stripe form; hide generic confirm when ready
    if (method === "card") return isTrialMode === true;
    // Pix: can confirm to initiate checkout
    if (method === "pix") return pixStep === "idle";
    // SumUp EUR: can confirm to initiate checkout
    if (method === "sumup_eur")
      return sumupStep === "idle" || sumupStep === "failed";
    return true;
  }, [
    cashCents,
    isTrialMode,
    mbwayPhone,
    method,
    orderTotal,
    processing,
    pixStep,
    sumupStep,
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
    try {
      // Pix: create checkout and show QR code
      if (method === "pix") {
        setPixStep("creating");
        const pixResult = await PaymentBroker.createPixCheckout({
          orderId,
          amount: grandTotal,
          restaurantId,
          description: t("payment.pixDescription", { id: orderId.slice(-6), total: formatAmount(grandTotal) }),
        });

        setPixCheckoutId(pixResult.checkout_id);
        // Generate QR code URL from checkout ID (SumUp provides this in raw.transactions)
        const qrCodeUrl =
          pixResult.raw?.transactions?.[0]?.qr_code_url ||
          `https://api.sumup.com/qr/${pixResult.checkout_id}`;
        setPixQrCodeUrl(qrCodeUrl);
        setPixStep("qr-ready");
        setPixTimeRemaining(600); // Reset to 10 minutes
        setProcessing(false);
        return;
      }

      // SumUp EUR: create checkout and redirect to payment page
      if (method === "sumup_eur") {
        setSumUpStep("creating");
        const sumupResult = await PaymentBroker.createSumUpCheckout({
          orderId,
          amount: grandTotal,
          restaurantId,
          currency,
          description: t("payment.pixDescription", { id: orderId.slice(-6), total: formatAmount(grandTotal) }),
        });

        if (!sumupResult.success || !sumupResult.checkout) {
          throw new Error(t("payment.error.sumupCheckoutFailed"));
        }

        setSumUpCheckoutId(sumupResult.checkout.id);
        setSumUpCheckoutUrl(sumupResult.checkout.url);
        setSumUpStep("redirect");
        setSumUpTimeRemaining(900); // Reset to 15 minutes
        setProcessing(false);

        // Open payment page in new tab
        window.open(sumupResult.checkout.url, "_blank", "noopener,noreferrer");

        // Start polling immediately after redirect
        setTimeout(() => {
          if (sumupResult.checkout.id) {
            setSumUpStep("polling");
          }
        }, 1000);
        return;
      }

      const backendMethod = method === "mbway" ? "card" : method;
      await onPay(backendMethod, undefined, tipCents || undefined);
    } catch (err: any) {
      setErrorMsg(err?.message || t("payment.error.process"));
      if (method === "pix") {
        setPixStep("idle");
      }
      if (method === "sumup_eur") {
        setSumUpStep("failed");
      }
    } finally {
      setProcessing(false);
    }
  }, [
    canConfirm,
    method,
    onPay,
    tipCents,
    orderId,
    grandTotal,
    restaurantId,
    formatAmount,
  ]);

  // Called when Stripe Elements confirm succeeds
  const handleCardSuccess = useCallback(
    async (paymentIntentId: string) => {
      setProcessing(true);
      setErrorMsg("");
      try {
        await onPay("card", paymentIntentId, tipCents || undefined);
      } catch (err: any) {
        setErrorMsg(err?.message || t("payment.error.finalize"));
      } finally {
        setProcessing(false);
      }
    },
    [onPay, tipCents],
  );

  // Pix countdown timer
  useEffect(() => {
    if (pixStep !== "qr-ready" && pixStep !== "polling") return;

    const interval = setInterval(() => {
      setPixTimeRemaining((prev) => {
        if (prev <= 1) {
          setPixStep("expired");
          setErrorMsg(t("payment.pixExpired"));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pixStep]);

  // Pix status polling
  useEffect(() => {
    if (pixStep !== "qr-ready" && pixStep !== "polling") return;
    if (!pixCheckoutId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await PaymentBroker.getPixCheckoutStatus(pixCheckoutId);
        console.log("[PaymentModal] Pix status poll:", status);

        if (status.status === "PAID" || status.status === "COMPLETED") {
          setPixStep("completed");
          setProcessing(true);
          clearInterval(pollInterval);
          // Notify parent that payment is complete
          await onPay("pix", pixCheckoutId, tipCents || undefined);
          setProcessing(false);
        } else if (status.status === "FAILED" || status.status === "CANCELED") {
          setPixStep("expired");
          setErrorMsg(
            status.status === "FAILED"
              ? t("payment.pixFailed")
              : t("payment.pixCanceled"),
          );
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.warn("[PaymentModal] Pix polling error:", err);
        // Don't stop polling on transient errors
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [pixStep, pixCheckoutId, onPay, tipCents]);

  // SumUp EUR countdown timer
  useEffect(() => {
    if (sumupStep !== "redirect" && sumupStep !== "polling") return;

    const interval = setInterval(() => {
      setSumUpTimeRemaining((prev) => {
        if (prev <= 1) {
          setSumUpStep("failed");
          setErrorMsg(t("payment.sumupExpired"));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sumupStep]);

  // SumUp EUR status polling
  useEffect(() => {
    if (sumupStep !== "redirect" && sumupStep !== "polling") return;
    if (!sumupCheckoutId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await PaymentBroker.getSumUpCheckoutStatus(
          sumupCheckoutId,
        );
        console.log("[PaymentModal] SumUp status poll:", status);

        if (status.success && status.checkout.status === "PAID") {
          setSumUpStep("completed");
          setProcessing(true);
          clearInterval(pollInterval);
          // Notify parent that payment is complete
          await onPay("card", sumupCheckoutId, tipCents || undefined);
          setProcessing(false);
        } else if (
          status.checkout.status === "FAILED" ||
          status.checkout.status === "EXPIRED"
        ) {
          setSumUpStep("failed");
          setErrorMsg(
            status.checkout.status === "FAILED"
              ? t("payment.sumupFailed")
              : t("payment.sumupExpired"),
          );
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.warn("[PaymentModal] SumUp polling error:", err);
        // Don't stop polling on transient errors
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [sumupStep, sumupCheckoutId, onPay, tipCents]);

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{t("payment.title")}</h2>
            <span style={styles.orderId}>{t("payment.orderId", { id: orderId.slice(-6) })}</span>
          </div>
          <button
            onClick={onCancel}
            disabled={processing}
            style={styles.closeBtn}
            aria-label={t("common:close")}
          >
            ✕
          </button>
        </div>

        <div style={styles.totalSection}>
          <span style={styles.totalLabel}>{t("payment.totalToPay")}</span>
          <span style={styles.totalValue}>{formatAmount(grandTotal)}</span>
          {tipCents > 0 && (
            <span style={{ color: "#a1a1aa", fontSize: 13 }}>
              {t("payment.subtotal")} {formatAmount(orderTotal)} + {t("payment.tip")}{" "}
              {formatAmount(tipCents)}
            </span>
          )}
          {isTrialMode && <span style={styles.trialBadge}>GUIDED TRIAL</span>}
        </div>

        {/* Tip / Gorjeta */}
        <div style={styles.section}>
          <span style={styles.sectionTitle}>{t("payment.tipOptional")}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  setTipPercent(pct === 0 ? null : pct);
                  setCustomTip("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background:
                    tipPercent === pct ||
                    (pct === 0 && tipPercent === null && !customTip)
                      ? GREEN
                      : CARD_BG,
                  border: "none",
                  borderRadius: 8,
                  color: "#d4d4d8",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {pct === 0 ? t("payment.noTip") : `${pct}%`}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span style={{ color: "#71717a", fontSize: 13 }}>{t("payment.other")}</span>
            <div style={{ ...styles.cashInputRow, flex: 1 }}>
              <span style={styles.cashPrefix}>{currencySymbol}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={customTip}
                onChange={(e) => {
                  setCustomTip(e.target.value);
                  setTipPercent(null);
                }}
                placeholder="0.00"
                style={{ ...styles.cashInput, fontSize: 16, padding: "6px 0" }}
              />
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <span style={styles.sectionTitle}>{t("payment.paymentMethod")}</span>
          <div style={styles.methodGrid}>
            {methodsToShow.map((m) => (
              <button
                key={m.id}
                data-testid={`payment-method-${m.id}`}
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
            <span style={styles.sectionTitle}>{t("payment.cashTendered")}</span>
            <div style={styles.cashInputRow}>
              <span style={styles.cashPrefix}>{currencySymbol}</span>
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
                {t("payment.exact")}
              </button>
              {QUICK_CASH.map((c) => (
                <button
                  key={c}
                  onClick={() => setCashTendered((c / 100).toFixed(2))}
                  style={styles.quickCashBtn}
                >
                  {currencySymbol}
                  {(c / 100).toFixed(0)}
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
                <span>{t("payment.change")}</span>
                <span style={{ fontWeight: 700, fontSize: 22 }}>
                  {changeCents >= 0
                    ? formatAmount(changeCents)
                    : t("payment.shortBy", { amount: formatAmount(Math.abs(changeCents)) })}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "card" && (
          <div style={styles.section}>
            {isTrialMode ? (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>💳</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  {t("payment.trialSimulated")}
                </span>
              </div>
            ) : !STRIPE_KEY ? (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⚠️</span>
                <span style={{ color: "#fbbf24", fontSize: 14 }}>
                  {t("payment.stripeNotConfigured")}
                </span>
              </div>
            ) : cardStep === "creating-intent" ? (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⏳</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  {t("payment.preparing")}
                </span>
              </div>
            ) : cardStep === "ready" && stripeClientSecret && stripeInstance ? (
              <Elements
                stripe={Promise.resolve(stripeInstance)}
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
                  {t("payment.selectCard")}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "mbway" && (
          <div style={styles.section}>
            <span style={styles.sectionTitle}>{t("payment.phoneNumber")}</span>
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
          <div style={styles.section}>
            {pixStep === "idle" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⚡</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  {t("payment.pixIdle")}
                </span>
              </div>
            )}
            {pixStep === "creating" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⏳</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  {t("payment.pixCreating")}
                </span>
              </div>
            )}
            {(pixStep === "qr-ready" || pixStep === "polling") &&
              pixQrCodeUrl && (
                <div style={styles.pixQrContainer}>
                  <div style={styles.pixQrHeader}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#d4d4d8",
                      }}
                    >
                      {t("payment.pixScanQr")}
                    </span>
                    <div style={styles.pixTimer}>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>
                        {Math.floor(pixTimeRemaining / 60)}:
                        {String(pixTimeRemaining % 60).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: 12, color: "#71717a" }}>
                        {t("payment.timeRemaining")}
                      </span>
                    </div>
                  </div>
                  <div style={styles.pixQrBox}>
                    <img
                      src={pixQrCodeUrl}
                      alt={t("payment.pixQrAlt")}
                      style={styles.pixQrImage}
                      onError={(e) => {
                        // Fallback: show checkout ID as text if QR image fails
                        console.error("QR Code image failed to load");
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {!pixQrCodeUrl.startsWith("http") && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: 12,
                          background: CARD_BG,
                          borderRadius: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#71717a",
                            fontFamily: "monospace",
                          }}
                        >
                          Checkout ID: {pixCheckoutId}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={styles.pixInstructions}>
                    <span style={{ fontSize: 13, color: "#a1a1aa" }}>⚡</span>
                    <span style={{ fontSize: 13, color: "#a1a1aa" }}>
                      {t("payment.awaitingConfirmation")}
                    </span>
                  </div>
                </div>
              )}
            {pixStep === "completed" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>✅</span>
                <span style={{ color: GREEN, fontSize: 16, fontWeight: 600 }}>
                  {t("payment.pixConfirmed")}
                </span>
              </div>
            )}
            {pixStep === "expired" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⏱️</span>
                <span style={{ color: DANGER, fontSize: 14 }}>
                  {t("payment.pixExpiredRetry")}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "sumup_eur" && (
          <div style={styles.section}>
            {sumupStep === "idle" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>🇪🇺</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  {t("payment.sumupIdle")}
                </span>
              </div>
            )}
            {sumupStep === "creating" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>⏳</span>
                <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                  {t("payment.sumupCreating")}
                </span>
              </div>
            )}
            {(sumupStep === "redirect" || sumupStep === "polling") && (
              <div style={styles.pixQrContainer}>
                <div style={styles.pixQrHeader}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#d4d4d8",
                    }}
                  >
                    {t("payment.sumupCompleteInWindow")}
                  </span>
                  <div style={styles.pixTimer}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>
                      {Math.floor(sumupTimeRemaining / 60)}:
                      {String(sumupTimeRemaining % 60).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: 12, color: "#71717a" }}>
                      {t("payment.timeRemaining")}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    padding: 24,
                    background: CARD_BG,
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 48 }}>💳</span>
                  <span
                    style={{
                      fontSize: 15,
                      color: "#d4d4d8",
                      textAlign: "center",
                    }}
                  >
                    {t("payment.sumupEnterCard")}
                  </span>
                  {sumupCheckoutUrl && (
                    <button
                      onClick={() =>
                        window.open(
                          sumupCheckoutUrl,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      style={{
                        padding: "10px 20px",
                        background: ACCENT,
                        border: "none",
                        borderRadius: 8,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {t("payment.sumupReopenPage")}
                    </button>
                  )}
                  <div
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: SURFACE,
                      borderRadius: 8,
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#71717a",
                        fontFamily: "monospace",
                      }}
                    >
                      Checkout ID: {sumupCheckoutId}
                    </span>
                  </div>
                </div>
                <div style={styles.pixInstructions}>
                  <span style={{ fontSize: 13, color: "#a1a1aa" }}>⏳</span>
                  <span style={{ fontSize: 13, color: "#a1a1aa" }}>
                    {t("payment.awaitingConfirmation")}
                  </span>
                </div>
              </div>
            )}
            {sumupStep === "completed" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>✅</span>
                <span style={{ color: GREEN, fontSize: 16, fontWeight: 600 }}>
                  {t("payment.sumupConfirmed")}
                </span>
              </div>
            )}
            {sumupStep === "failed" && (
              <div style={styles.terminalWaiting}>
                <span style={{ fontSize: 36 }}>❌</span>
                <span style={{ color: DANGER, fontSize: 14 }}>
                  {t("payment.sumupFailedRetry")}
                </span>
              </div>
            )}
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
            // Hide when Pix QR is showing (wait for payment or regenerate)
            display:
              (method === "card" && !isTrialMode && cardStep === "ready") ||
              (method === "pix" &&
                (pixStep === "qr-ready" ||
                  pixStep === "polling" ||
                  pixStep === "completed")) ||
              (method === "sumup_eur" &&
                (sumupStep === "redirect" ||
                  sumupStep === "polling" ||
                  sumupStep === "completed"))
                ? "none"
                : "flex",
          }}
        >
          {processing
            ? t("payment.processing")
            : method === "pix" && pixStep === "expired"
            ? t("payment.generateNewQr")
            : method === "sumup_eur" && sumupStep === "failed"
            ? t("payment.tryAgain")
            : t("payment.confirm", { amount: formatAmount(grandTotal) })}
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
  const { t } = useTranslation("tpv");
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
      setError(confirmError.message || t("payment.error.cardPrepare"));
      setSubmitting(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError(
        t("payment.cardUnexpectedState", { state: paymentIntent?.status || "unknown" }),
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
        {submitting ? t("payment.processing") : t("payment.payWithCard")}
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
  trialBadge: {
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
  pixQrContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 20,
    background: SURFACE,
    borderRadius: 14,
  },
  pixQrHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pixTimer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
    color: GREEN,
  },
  pixQrBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "#fff",
    borderRadius: 12,
  },
  pixQrImage: {
    width: "100%",
    maxWidth: 280,
    height: "auto",
    display: "block",
  },
  pixInstructions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 0",
  },
};
