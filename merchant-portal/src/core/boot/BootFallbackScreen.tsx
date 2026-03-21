/**
 * Boot Pipeline — Fallback Screen
 *
 * Actionable UI shown when the boot pipeline hits a timeout or error.
 * Instead of a frozen spinner with "Verificando acesso...", this screen
 * tells the user EXACTLY what failed and gives them options:
 *
 * - Reconectar (retry the pipeline)
 * - Trocar conta (sign out + re-auth)
 * - Diagnóstico (copy debug info)
 *
 * Styled to match the GlobalLoadingView visual contract.
 *
 * @module core/boot/BootFallbackScreen
 */

import React, { useCallback, useState } from "react";
import type { BootSnapshot } from "./BootState";
import { BootStep } from "./BootState";
import { serializeBootSnapshot } from "./bootTelemetry";

// ─── Props ────────────────────────────────────────────────────────────────

export interface BootFallbackScreenProps {
  /** Current pipeline snapshot (must be in an error terminal) */
  snapshot: BootSnapshot;
  /** Called when user clicks "Reconectar" (retry) */
  onRetry: () => void;
  /** Called when user clicks "Trocar conta" (sign out) */
  onSignOut?: () => void;
}

// ─── Step → User-facing message ───────────────────────────────────────────

function getErrorTitle(step: BootStep): string {
  switch (step) {
    case BootStep.AUTH_TIMEOUT:
      return "Autenticação demorou demais";
    case BootStep.TENANT_ERROR:
      return "Erro ao carregar restaurante";
    case BootStep.TENANT_TIMEOUT:
      return "Restaurante demorou a responder";
    case BootStep.ROUTE_ERROR:
      return "Erro ao determinar destino";
    default:
      return "Algo correu mal";
  }
}

function getErrorDescription(step: BootStep): string {
  switch (step) {
    case BootStep.AUTH_TIMEOUT:
      return "O servidor de autenticação não respondeu a tempo. Pode ser uma questão de rede ou o serviço está temporariamente indisponível.";
    case BootStep.TENANT_ERROR:
      return "Não foi possível obter os dados do restaurante. Verifique a sua ligação à internet e tente novamente.";
    case BootStep.TENANT_TIMEOUT:
      return "O servidor demorou demasiado a responder com os dados do restaurante. Isto pode indicar um problema de rede.";
    case BootStep.ROUTE_ERROR:
      return "Houve um erro interno ao determinar para onde navegar. Tente recarregar a página.";
    default:
      return "Ocorreu um erro inesperado durante o arranque da aplicação.";
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export const BootFallbackScreen: React.FC<BootFallbackScreenProps> = ({
  snapshot,
  onRetry,
  onSignOut,
}) => {
  const [showDiag, setShowDiag] = useState(false);
  const [copied, setCopied] = useState(false);

  const title = getErrorTitle(snapshot.step);
  const description = getErrorDescription(snapshot.step);
  const diagData = JSON.stringify(serializeBootSnapshot(snapshot), null, 2);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(diagData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text area
    }
  }, [diagData]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Icon */}
        <div style={styles.icon}>
          {snapshot.step === BootStep.AUTH_TIMEOUT ||
          snapshot.step === BootStep.TENANT_TIMEOUT
            ? "⏰"
            : "⚠️"}
        </div>

        {/* Title + Description */}
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.description}>{description}</p>

        {/* Elapsed time */}
        <p style={styles.elapsed}>
          Tempo decorrido: {(snapshot.elapsedMs / 1000).toFixed(1)}s
        </p>

        {/* Actions */}
        <div style={styles.actions}>
          <button type="button" onClick={onRetry} style={styles.primaryButton}>
            Reconectar
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              style={styles.secondaryButton}
            >
              Trocar conta
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDiag((v) => !v)}
            style={styles.linkButton}
          >
            {showDiag ? "Ocultar diagnóstico" : "Diagnóstico"}
          </button>
        </div>

        {/* Diagnostic panel */}
        {showDiag && (
          <div style={styles.diagPanel}>
            <div style={styles.diagHeader}>
              <span style={styles.diagLabel}>Boot Pipeline Snapshot</span>
              <button
                type="button"
                onClick={handleCopy}
                style={styles.copyButton}
              >
                {copied ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <pre style={styles.diagPre}>{diagData}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Inline Styles (no external CSS dependency) ───────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: 24,
  },
  card: {
    maxWidth: 480,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    textAlign: "center" as const,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: "0 0 8px",
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 1.5,
    margin: "0 0 16px",
  },
  elapsed: {
    fontSize: 12,
    color: "#999",
    margin: "0 0 24px",
  },
  actions: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    width: "100%",
    padding: "12px 24px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "underline",
    padding: "4px 0",
  },
  diagPanel: {
    marginTop: 16,
    textAlign: "left" as const,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  diagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  diagLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
  },
  copyButton: {
    background: "none",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    color: "#6b7280",
    cursor: "pointer",
  },
  diagPre: {
    margin: 0,
    padding: 12,
    fontSize: 11,
    lineHeight: 1.4,
    color: "#374151",
    overflowX: "auto" as const,
    maxHeight: 200,
    overflowY: "auto" as const,
  },
};
