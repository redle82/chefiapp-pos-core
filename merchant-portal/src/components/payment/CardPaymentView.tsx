/**
 * CardPaymentView Component
 *
 * UI de pagamento presencial por cartão.
 * Mostra o fluxo de leitura do cartão no terminal com estados visuais:
 * - Aguardando apresentação do cartão
 * - Leitura em curso
 * - Processamento
 * - Sucesso
 * - Erro com retry
 *
 * Dark theme (#0a0a0a) consistente com o TPV.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export type CardPaymentStatus =
  | "waiting"
  | "reading"
  | "processing"
  | "done"
  | "error";

interface CardPaymentViewProps {
  /** Current status of the payment */
  status: CardPaymentStatus;
  /** Amount in cents */
  amountCents: number;
  /** Currency code */
  currency: string;
  /** Error message when status is 'error' */
  errorMessage?: string;
  /** Timeout in seconds (default 60) */
  timeoutSeconds?: number;
  /** Called when cancel is pressed */
  onCancel: () => void;
  /** Called when retry is pressed (after error) */
  onRetry: () => void;
  /** Called when timeout expires */
  onTimeout?: () => void;
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = {
  container: {
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 32,
    color: "#fafafa",
    fontFamily: "system-ui, -apple-system, sans-serif",
    textAlign: "center" as const,
    minHeight: 320,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  } as React.CSSProperties,

  amount: {
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#fafafa",
  } as React.CSSProperties,

  statusText: {
    fontSize: 18,
    fontWeight: 500,
    color: "#a1a1aa",
    lineHeight: 1.4,
  } as React.CSSProperties,

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
  } as React.CSSProperties,

  waitingIcon: {
    backgroundColor: "#1e3a5f",
    border: "2px solid #3b82f6",
    animation: "pulse 2s ease-in-out infinite",
  } as React.CSSProperties,

  processingIcon: {
    backgroundColor: "#422006",
    border: "2px solid #f97316",
  } as React.CSSProperties,

  doneIcon: {
    backgroundColor: "#052e16",
    border: "2px solid #4ade80",
  } as React.CSSProperties,

  errorIcon: {
    backgroundColor: "#450a0a",
    border: "2px solid #ef4444",
  } as React.CSSProperties,

  progressBar: {
    width: "100%",
    maxWidth: 280,
    height: 4,
    backgroundColor: "#27272a",
    borderRadius: 2,
    overflow: "hidden",
  } as React.CSSProperties,

  progressFill: (progress: number) =>
    ({
      height: "100%",
      backgroundColor:
        progress > 0.8 ? "#ef4444" : progress > 0.5 ? "#fbbf24" : "#3b82f6",
      width: `${(1 - progress) * 100}%`,
      borderRadius: 2,
      transition: "width 1s linear, background-color 500ms",
    }) as React.CSSProperties,

  timeoutText: {
    fontSize: 12,
    color: "#71717a",
  } as React.CSSProperties,

  button: {
    backgroundColor: "#27272a",
    color: "#fafafa",
    border: "1px solid #3f3f46",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 150ms",
    minWidth: 140,
  } as React.CSSProperties,

  retryButton: {
    backgroundColor: "#f97316",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    minWidth: 140,
  } as React.CSSProperties,

  errorText: {
    fontSize: 14,
    color: "#fca5a5",
    maxWidth: 320,
    lineHeight: 1.5,
  } as React.CSSProperties,

  buttonRow: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  } as React.CSSProperties,

  spinnerKeyframes: `
    @keyframes terminal-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes terminal-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.05); }
    }
    @keyframes terminal-checkmark {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
  `,
} as const;

// ─── Helpers ────────────────────────────────────────────────────────

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  const locale =
    currency === "EUR" ? "pt-PT" : currency === "GBP" ? "en-GB" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

// ─── Status Config ──────────────────────────────────────────────────

interface StatusConfig {
  icon: string;
  iconStyle: React.CSSProperties;
  text: string;
  animation?: string;
}

function getStatusConfig(status: CardPaymentStatus): StatusConfig {
  switch (status) {
    case "waiting":
      return {
        icon: "\uD83D\uDCB3", // credit card
        iconStyle: styles.waitingIcon,
        text: "Apresente o cartao ao leitor",
        animation: "terminal-pulse 2s ease-in-out infinite",
      };
    case "reading":
      return {
        icon: "\uD83D\uDCE1", // satellite antenna
        iconStyle: styles.waitingIcon,
        text: "Lendo cartao...",
        animation: "terminal-pulse 1s ease-in-out infinite",
      };
    case "processing":
      return {
        icon: "\u23F3", // hourglass
        iconStyle: styles.processingIcon,
        text: "Processando pagamento...",
        animation: "terminal-spin 1.5s linear infinite",
      };
    case "done":
      return {
        icon: "\u2713",
        iconStyle: styles.doneIcon,
        text: "Pagamento aprovado",
        animation: "terminal-checkmark 0.4s ease-out",
      };
    case "error":
      return {
        icon: "\u2717",
        iconStyle: styles.errorIcon,
        text: "Pagamento recusado",
      };
  }
}

// ─── Component ──────────────────────────────────────────────────────

export function CardPaymentView({
  status,
  amountCents,
  currency,
  errorMessage,
  timeoutSeconds = 60,
  onCancel,
  onRetry,
  onTimeout,
}: CardPaymentViewProps) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for waiting/reading states
  useEffect(() => {
    if (status === "waiting" || status === "reading") {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= timeoutSeconds) {
            if (timerRef.current) clearInterval(timerRef.current);
            onTimeout?.();
            return next;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, timeoutSeconds, onTimeout]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  const config = getStatusConfig(status);
  const progress = elapsed / timeoutSeconds;
  const remainingSeconds = Math.max(0, timeoutSeconds - elapsed);

  return (
    <>
      {/* Inject keyframe animations */}
      <style>{styles.spinnerKeyframes}</style>

      <div style={styles.container}>
        {/* Amount */}
        <div style={styles.amount}>{formatAmount(amountCents, currency)}</div>

        {/* Status Icon */}
        <div
          style={{
            ...styles.iconContainer,
            ...config.iconStyle,
            ...(config.animation
              ? { animation: config.animation }
              : {}),
          }}
        >
          {config.icon}
        </div>

        {/* Status Text */}
        <div style={styles.statusText}>{config.text}</div>

        {/* Timeout Progress Bar */}
        {(status === "waiting" || status === "reading") && (
          <>
            <div style={styles.progressBar}>
              <div style={styles.progressFill(progress)} />
            </div>
            <div style={styles.timeoutText}>
              {remainingSeconds}s restantes
            </div>
          </>
        )}

        {/* Error Details */}
        {status === "error" && errorMessage && (
          <div style={styles.errorText}>{errorMessage}</div>
        )}

        {/* Action Buttons */}
        {(status === "waiting" || status === "reading") && (
          <button style={styles.button} onClick={handleCancel}>
            Cancelar
          </button>
        )}

        {status === "error" && (
          <div style={styles.buttonRow}>
            <button style={styles.button} onClick={handleCancel}>
              Cancelar
            </button>
            <button style={styles.retryButton} onClick={handleRetry}>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </>
  );
}
