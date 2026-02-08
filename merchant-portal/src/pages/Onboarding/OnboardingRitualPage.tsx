/**
 * Onboarding 5min — Tela 8: Ritual de Abertura.
 * "Abrir turno agora" → abre turno no Core, marca onboarding completo, destrava TPV real.
 * "Ir para o painel" → marca onboarding completo, vai ao dashboard.
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { DbWriteGate } from "../../core/governance/DbWriteGate";
import { getDefaultOpeningCashCents } from "../../core/storage/shiftDefaultsStorage";
import { setOnboardingJustCompletedFlag } from "../../core/storage/onboardingFlowFlag";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { useShift } from "../../core/shift/ShiftContext";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidRestaurantId(id: string | null): id is string {
  return !!id && UUID_REGEX.test(id);
}

export function OnboardingRitualPage() {
  const navigate = useNavigate();
  const shift = useShift();
  const restaurantId =
    getTabIsolated("chefiapp_restaurant_id") ??
    (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null);

  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caixaEur, setCaixaEur] = useState("0");

  useEffect(() => {
    if (!restaurantId) return;
    const cents = getDefaultOpeningCashCents(restaurantId);
    if (cents !== null) setCaixaEur(String(cents / 100));
  }, [restaurantId]);

  const defaultCents = restaurantId ? getDefaultOpeningCashCents(restaurantId) : null;
  const defaultEur = defaultCents !== null ? defaultCents / 100 : null;
  const caixaHelp =
    defaultEur !== null &&
    (() => {
      const v = parseFloat(caixaEur.replace(",", "."));
      return !Number.isNaN(v) && Math.abs(v - defaultEur) < 0.01;
    })()
      ? ONBOARDING_5MIN_COPY.ritual.caixaHelpWithValue(defaultEur)
      : ONBOARDING_5MIN_COPY.ritual.caixaHelpDefault;

  const markOnboardingComplete = async () => {
    if (!restaurantId) return;
    const completedAt = new Date().toISOString();
    await DbWriteGate.update(
      "OnboardingQuick",
      "gm_restaurants",
      { status: "active", onboarding_completed_at: completedAt },
      { id: restaurantId },
      { tenantId: restaurantId }
    );
    try {
      const raw =
        typeof window !== "undefined" &&
        window.localStorage.getItem("chefiapp_pilot_mock_restaurant");
      if (raw) {
        const row = JSON.parse(raw) as {
          id?: string;
          onboarding_completed_at?: string | null;
          billing_status?: string;
        };
        if (row.id === restaurantId) {
          row.onboarding_completed_at = completedAt;
          row.billing_status = row.billing_status || "trial";
          window.localStorage.setItem(
            "chefiapp_pilot_mock_restaurant",
            JSON.stringify(row)
          );
        }
      }
    } catch {
      /* ignore */
    }
    setOnboardingJustCompletedFlag();
  };

  const handleOpenShift = async () => {
    if (!restaurantId) return;
    setError(null);
    if (!isValidRestaurantId(restaurantId)) {
      setError(
        "O identificador do restaurante não é válido. Volte ao passo Identidade e crie o restaurante (nome, tipo, país)."
      );
      return;
    }
    const eur = parseFloat(caixaEur.replace(",", "."));
    if (Number.isNaN(eur) || eur < 0) {
      setError("Valor de caixa inicial inválido.");
      return;
    }
    const openingBalanceCents = Math.round(eur * 100);
    setOpening(true);
    try {
      const { data, error: rpcError } = await dockerCoreClient.rpc(
        "open_cash_register_atomic",
        {
          p_restaurant_id: restaurantId,
          p_name: "Caixa Principal",
          p_opened_by: "Operador TPV",
          p_opening_balance_cents: openingBalanceCents,
        }
      );
      if (rpcError) {
        const raw = rpcError.message ?? "";
        if (raw.includes("CASH_REGISTER_ALREADY_OPEN") || raw.includes("already open")) {
          await markOnboardingComplete();
          shift?.refreshShiftStatus?.();
          navigate("/op/tpv", { replace: true });
          return;
        }
        const msg =
          raw && !raw.includes("Backend indisponível")
            ? raw
            : "Não foi possível abrir o turno. Verifique a ligação ao Core (Docker em 3001) e tente novamente.";
        setError(msg);
        return;
      }
      if (!data?.id) {
        setError("Não foi possível abrir o turno. Tente novamente.");
        return;
      }
      await markOnboardingComplete();
      shift?.refreshShiftStatus?.();
      navigate("/op/tpv", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao abrir turno. Tente novamente."
      );
    } finally {
      setOpening(false);
    }
  };

  const handleGoToPanel = async () => {
    setError(null);
    try {
      await markOnboardingComplete();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao continuar.");
    }
  };

  if (!restaurantId) {
    return (
      <div
        style={{
          padding: spacing[6],
          textAlign: "center",
          color: colors.text.secondary,
        }}
      >
        <p>Restaurante não encontrado.</p>
        <Button
          type="button"
          tone="success"
          variant="solid"
          onClick={() => navigate("/onboarding/identity")}
          style={{ marginTop: spacing[4] }}
        >
          Voltar ao início
        </Button>
      </div>
    );
  }

  return (
    <div
      data-onboarding-step="8"
      style={{
        background: colors.surface.base,
        minHeight: "100vh",
        color: colors.text.primary,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `0 ${spacing[6]} ${spacing[6]} ${spacing[6]}`,
      }}
    >
      <OnboardingStepIndicator step={9} total={9} />
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            marginBottom: spacing[2],
            color: colors.text.primary,
          }}
        >
          {ONBOARDING_5MIN_COPY.ritual.headline}
        </h1>
        <p
          style={{
            color: colors.text.secondary,
            marginBottom: spacing[6],
            fontSize: 14,
          }}
        >
          {ONBOARDING_5MIN_COPY.ritual.message}
        </p>
        <Card padding="lg" style={{ marginBottom: spacing[6] }}>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            <Input
              label={ONBOARDING_5MIN_COPY.ritual.caixaLabel}
              value={caixaEur}
              onChange={(e) => setCaixaEur(e.target.value)}
              placeholder="0"
              disabled={opening}
            />
            <p style={{ fontSize: 12, color: colors.text.secondary, marginTop: spacing[2] ? `-${spacing[2]}` : "-0.5rem" }}>
              {caixaHelp}
            </p>
            {error && (
              <p style={{ color: colors.warning?.base ?? "#f59e0b", fontSize: 14 }}>
                {error}
              </p>
            )}
            <Button
              type="button"
              tone="success"
              variant="solid"
              size="lg"
              onClick={handleOpenShift}
              disabled={opening}
              style={{ width: "100%" }}
            >
              {opening ? "A abrir turno..." : ONBOARDING_5MIN_COPY.ritual.ctaOpen}
            </Button>
            <Button
              type="button"
              tone="neutral"
              variant="outline"
              onClick={handleGoToPanel}
              disabled={opening}
              style={{ width: "100%" }}
            >
              {ONBOARDING_5MIN_COPY.ritual.ctaPanel}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
