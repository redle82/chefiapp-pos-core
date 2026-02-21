/**
 * ShiftGate — FASE 1 Passo 4: só permite TPV se turno aberto (caixa inicial)
 *
 * Se não houver turno aberto, mostra ecrã "Abrir turno" com caixa inicial.
 * Após abertura, revalida e mostra o TPV.
 */
// @ts-nocheck


import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { BackendType, getBackendType } from "../../core/infra/backendAdapter";
import { useShift } from "../../core/shift/ShiftContext";
import { getTpvRestaurantId } from "../../core/storage/installedDeviceStorage";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { isBackendUnavailable } from "../../infra/menuPilotFallback";
import {
  GlobalBlockedView,
  GlobalLoadingView,
} from "../../ui/design-system/components";

interface Props {
  children: React.ReactNode;
}

export function ShiftGate({ children }: Props) {
  const { t } = useTranslation("shift");
  const shift = useShift();
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? getTpvRestaurantId() ?? null;

  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDocker = getBackendType() === BackendType.docker;

  // DEBUG_DIRECT_FLOW: vertical slice sem turno; TPV e KDS diretos.
  if (CONFIG.DEBUG_DIRECT_FLOW) {
    return <>{children}</>;
  }

  if (shift.isChecking && !shift.isShiftOpen) {
    return (
      <GlobalLoadingView
        message={t("gate.checking")}
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  if (shift.isShiftOpen) {
    return <>{children}</>;
  }

  // Sem turno aberto: mostrar CTA único para abrir turno (só Docker Core)
  if (!isDocker || !restaurantId) {
    return (
      <GlobalBlockedView
        title={t("gate.openTitle")}
        description={t("gate.openDescription")}
        action={{ label: t("gate.goToDashboard"), to: "/dashboard" }}
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
  const { t } = useTranslation("shift");
  const [caixaEur, setCaixaEur] = useState("0");
  const [openedSuccess, setOpenedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onErrorChange(null);
    const eur = parseFloat(caixaEur.replace(",", "."));
    if (Number.isNaN(eur) || eur < 0) {
      onErrorChange(t("error.invalidInitialCash"));
      return;
    }
    const openingBalanceCents = Math.round(eur * 100);

    onOpeningChange(true);
    try {
      // FASE 2.2: sem ações anónimas — opened_by com label quando não há utilizador
      const { data, error: rpcError } = await dockerCoreClient.rpc(
        "open_cash_register_atomic",
        {
          p_restaurant_id: restaurantId,
          p_name: t("gate.defaultRegisterName", "Caixa Principal"),
          p_opened_by: t("gate.defaultOperatorName", "Operador TPV"),
          p_opening_balance_cents: openingBalanceCents,
        },
      );

      if (rpcError) {
        onErrorChange(t("error.openFailed"));
        return;
      }
      if (!data?.id) {
        onErrorChange(t("error.openRetry"));
        return;
      }
      onOpeningChange(false);
      setOpenedSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      const msg = isBackendUnavailable(err)
        ? t("error.serverUnavailable")
        : t("error.openRetry");
      onErrorChange(msg);
    } finally {
      onOpeningChange(false);
    }
  };

  if (openedSuccess) {
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
        <p
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#32d74b",
            marginBottom: 8,
          }}
        >
          {t("gate.opened")}
        </p>
        <p style={{ fontSize: 14, color: "#a3a3a3" }}>{t("gate.loadingTPV")}</p>
      </div>
    );
  }

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
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        {t("gate.startSelling")}
      </h1>
      <p style={{ fontSize: 14, color: "#a3a3a3", marginBottom: 24 }}>
        {t("gate.instructions")}
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
            {t("gate.initialCashLabel")}
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
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            borderRadius: 8,
            cursor: opening ? "not-allowed" : "pointer",
            background: "#32d74b",
            color: "#000",
          }}
        >
          {opening ? t("gate.opening") : t("gate.startNow")}
        </button>
      </form>
      <p style={{ fontSize: 13, color: "#666", marginTop: 24 }}>
        <a href="/dashboard" style={{ color: "#32d74b" }}>
          {t("gate.goToDashboard")}
        </a>
      </p>
    </div>
  );
}
