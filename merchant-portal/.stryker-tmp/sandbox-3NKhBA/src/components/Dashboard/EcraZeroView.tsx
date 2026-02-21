/**
 * EcraZeroView — Ecrã Zero do Dono (docs/product/ECRA_ZERO_DONO.md)
 *
 * Uma frase (juízo), uma causa (opcional), um gesto (botão).
 * Sem números, sem listas, sem escolha. ≤10 segundos para decidir.
 * CONTRATO_TRIAL_REAL: não mostrar "Dados de exemplo" como estado principal.
 */
// @ts-nocheck


import type { DataMode } from "../../context/RestaurantRuntimeContext";
import type { EcraZeroState } from "../../core/dashboard/useEcraZeroState";

const COPY: Record<
  EcraZeroState,
  {
    phrase: string;
    button: string;
    bg: string;
    border: string;
    buttonBg: string;
  }
> = {
  verde: {
    phrase: "Está tudo sob controlo hoje.",
    button: "Ver resumo do dia",
    bg: "#f0fdf4",
    border: "#22c55e",
    buttonBg: "#22c55e",
  },
  amarelo: {
    phrase: "Há pontos a acompanhar hoje.",
    button: "Ver o que precisa de atenção",
    bg: "#fffbeb",
    border: "#f59e0b",
    buttonBg: "#f59e0b",
  },
  vermelho: {
    phrase: "Há algo crítico que precisa de atenção.",
    button: "Agir agora",
    bg: "#fef2f2",
    border: "#ef4444",
    buttonBg: "#ef4444",
  },
};

export interface EcraZeroViewProps {
  state: EcraZeroState;
  reason: string | null;
  loading?: boolean;
  onAction: () => void;
  /** Reservado para fallback; CONTRATO_TRIAL_REAL: não mostrar "Dados de exemplo" como estado principal. */
  dataMode?: DataMode;
}

export function EcraZeroView({
  state,
  reason,
  loading = false,
  onAction,
}: EcraZeroViewProps) {
  const copy = COPY[state];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <span style={{ fontSize: 15, color: "#666" }}>A carregar...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        backgroundColor: copy.bg,
        borderLeft: `4px solid ${copy.border}`,
        borderRadius: 12,
        margin: 24,
      }}
    >
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1a1a1a",
          margin: 0,
          marginBottom: reason ? 12 : 24,
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        {copy.phrase}
      </p>
      {reason && (
        <p
          style={{
            fontSize: 15,
            color: "#555",
            margin: 0,
            marginBottom: 24,
            textAlign: "center",
            maxWidth: 360,
          }}
        >
          {reason}
        </p>
      )}
      <button
        type="button"
        onClick={onAction}
        style={{
          padding: "14px 28px",
          fontSize: 16,
          fontWeight: 600,
          color: "#fff",
          backgroundColor: copy.buttonBg,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        }}
      >
        {copy.button}
      </button>
    </div>
  );
}
