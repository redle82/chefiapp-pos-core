/**
 * ShiftGate — FASE 1 Passo 4: só permite TPV se turno aberto (caixa inicial)
 *
 * Se não houver turno aberto, mostra ecrã "Abrir turno" com caixa inicial.
 * Após abertura, revalida e mostra o TPV.
 */

import React, { useContext, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { BackendType, getBackendType } from "../../core/infra/backendAdapter";
import { useShift } from "../../core/shift/ShiftContext";
import { GlobalBlockedView, GlobalLoadingView } from "../../ui/design-system/components";

interface Props {
  children: React.ReactNode;
}

export function ShiftGate({ children }: Props) {
  const shift = useShift();
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDocker = getBackendType() === BackendType.docker;

  if (shift.isChecking && !shift.isShiftOpen) {
    return (
      <GlobalLoadingView
        message="A verificar turno..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  if (shift.isShiftOpen) {
    return <>{children}</>;
  }

  // Sem turno aberto: mostrar "Abrir turno" com caixa inicial (só Docker Core)
  if (!isDocker || !restaurantId) {
    return (
      <GlobalBlockedView
        title="Abrir turno"
        description="Para usar o TPV, abra primeiro o turno com caixa inicial no Dashboard."
        action={{ label: "Ir para o Dashboard", to: "/dashboard" }}
      />
    );
  }

  return (
    <ShiftOpenForm
      restaurantId={restaurantId}
      opening={opening}
      error={error}
      onOpeningChange={setOpening}
      onErrorChange={setError}
      onSuccess={shift.refreshShiftStatus}
    />
  );
}

interface ShiftOpenFormProps {
  restaurantId: string;
  opening: boolean;
  error: string | null;
  onOpeningChange: (v: boolean) => void;
  onErrorChange: (v: string | null) => void;
  onSuccess: () => Promise<void>;
}

function ShiftOpenForm({
  restaurantId,
  opening,
  error,
  onOpeningChange,
  onErrorChange,
  onSuccess,
}: ShiftOpenFormProps) {
  const [caixaEur, setCaixaEur] = useState("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onErrorChange(null);
    const eur = parseFloat(caixaEur.replace(",", "."));
    if (Number.isNaN(eur) || eur < 0) {
      onErrorChange("Valor de caixa inicial inválido.");
      return;
    }
    const openingBalanceCents = Math.round(eur * 100);

    onOpeningChange(true);
    try {
      const { data, error: rpcError } = await dockerCoreClient.rpc(
        "open_cash_register_atomic",
        {
          p_restaurant_id: restaurantId,
          p_name: "Caixa Principal",
          p_opened_by: null,
          p_opening_balance_cents: openingBalanceCents,
        },
      );

      if (rpcError) {
        onErrorChange(rpcError.message || "Erro ao abrir turno.");
        return;
      }
      if (!data?.id) {
        onErrorChange("Turno não foi aberto. Tente novamente.");
        return;
      }
      await onSuccess();
    } catch (err) {
      onErrorChange(
        err instanceof Error ? err.message : "Erro ao abrir turno.",
      );
    } finally {
      onOpeningChange(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#0b0b0c",
        color: "#f5f5f7",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Abrir turno</h1>
      <p style={{ fontSize: 14, color: "#a3a3a3", marginBottom: 24 }}>
        Para usar o TPV, abra o turno com o valor de caixa inicial.
      </p>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 320,
          width: "100%",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#a3a3a3" }}>
            Caixa inicial (€)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={caixaEur}
            onChange={(e) => setCaixaEur(e.target.value)}
            placeholder="0"
            disabled={opening}
            style={{
              padding: "12px 14px",
              fontSize: 15,
              border: "1px solid #404040",
              borderRadius: 8,
              background: "#171717",
              color: "#fafafa",
            }}
          />
        </label>
        {error && (
          <p style={{ fontSize: 13, color: "#ff6b6b", margin: 0 }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={opening}
          style={{
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: opening ? "not-allowed" : "pointer",
            background: "#32d74b",
            color: "#000",
          }}
        >
          {opening ? "A abrir..." : "Abrir turno"}
        </button>
      </form>
      <p style={{ fontSize: 13, color: "#666", marginTop: 24 }}>
        <a href="/dashboard" style={{ color: "#32d74b" }}>
          Ir para o Dashboard
        </a>
      </p>
    </div>
  );
}
