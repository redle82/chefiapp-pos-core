/**
 * Onboarding 5min — Tela 8: Ritual de Abertura.
 * "Abrir turno agora" → abre turno no Core, marca onboarding completo, destrava TPV real.
 * "Ir para o painel" → marca onboarding completo, vai ao dashboard.
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */
// @ts-nocheck


import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { recordLegalConsent } from "../../core/audit/legalConsent";
import { DbWriteGate } from "../../core/governance/DbWriteGate";
import { useShift } from "../../core/shift/ShiftContext";
import { setOnboardingJustCompletedFlag } from "../../core/storage/onboardingFlowFlag";
import { getDefaultOpeningCashCents } from "../../core/storage/shiftDefaultsStorage";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import styles from "./OnboardingRitualPage.module.css";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidRestaurantId(id: string | null): id is string {
  return !!id && UUID_REGEX.test(id);
}

export function OnboardingRitualPage() {
  const navigate = useNavigate();
  const shift = useShift();
  const restaurantId =
    getTabIsolated("chefiapp_restaurant_id") ??
    (typeof window !== "undefined"
      ? window.localStorage.getItem("chefiapp_restaurant_id")
      : null);

  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caixaEur, setCaixaEur] = useState("0");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const consentLoggedRef = useRef(false);

  useEffect(() => {
    if (!restaurantId) return;
    const cents = getDefaultOpeningCashCents(restaurantId);
    if (cents !== null) setCaixaEur(String(cents / 100));
  }, [restaurantId]);

  const defaultCents = restaurantId
    ? getDefaultOpeningCashCents(restaurantId)
    : null;
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
      { tenantId: restaurantId },
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
            JSON.stringify(row),
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
    if (!acceptedTerms) {
      setError("Aceita os Termos e a Politica de Privacidade para continuar.");
      return;
    }
    if (!consentLoggedRef.current) {
      consentLoggedRef.current = true;
      recordLegalConsent({ restaurantId, source: "onboarding_ritual" });
    }
    if (!isValidRestaurantId(restaurantId)) {
      setError(
        "O identificador do restaurante não é válido. Volte ao passo Identidade e crie o restaurante (nome, tipo, país).",
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
        },
      );
      if (rpcError) {
        const raw = rpcError.message ?? "";
        if (
          raw.includes("CASH_REGISTER_ALREADY_OPEN") ||
          raw.includes("already open")
        ) {
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
        err instanceof Error
          ? err.message
          : "Erro ao abrir turno. Tente novamente.",
      );
    } finally {
      setOpening(false);
    }
  };

  const handleGoToPanel = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError("Aceita os Termos e a Politica de Privacidade para continuar.");
      return;
    }
    if (!consentLoggedRef.current) {
      consentLoggedRef.current = true;
      recordLegalConsent({ restaurantId, source: "onboarding_ritual" });
    }
    try {
      await markOnboardingComplete();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao continuar.");
    }
  };

  if (!restaurantId) {
    return (
      <div className={styles.notFoundContainer}>
        <p>Restaurante não encontrado.</p>
        <Button
          type="button"
          tone="success"
          variant="solid"
          onClick={() => navigate("/onboarding/identity")}
          className={styles.notFoundButton}
        >
          Voltar ao início
        </Button>
      </div>
    );
  }

  return (
    <div data-onboarding-step="8" className={styles.pageRoot}>
      <OnboardingStepIndicator step={9} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>{ONBOARDING_5MIN_COPY.ritual.headline}</h1>
        <p className={styles.subtitle}>{ONBOARDING_5MIN_COPY.ritual.message}</p>
        <Card padding="lg" className={styles.card}>
          <div className={styles.formContent}>
            <Input
              label={ONBOARDING_5MIN_COPY.ritual.caixaLabel}
              value={caixaEur}
              onChange={(e) => setCaixaEur(e.target.value)}
              placeholder="0"
              disabled={opening}
            />
            <p className={styles.helpText}>{caixaHelp}</p>
            {error && <p className={styles.errorText}>{error}</p>}
            <label htmlFor="onboarding-terms" className={styles.checkboxLabel}>
              <input
                id="onboarding-terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setAcceptedTerms(checked);
                  if (checked && !consentLoggedRef.current && restaurantId) {
                    consentLoggedRef.current = true;
                    recordLegalConsent({
                      restaurantId,
                      source: "onboarding_ritual",
                    });
                  }
                }}
              />
              <span>
                Aceito os{" "}
                <Link to="/legal/terms" className={styles.termsLink}>
                  Termos
                </Link>{" "}
                e a{" "}
                <Link to="/legal/privacy" className={styles.termsLink}>
                  Politica de Privacidade
                </Link>
                .
              </span>
            </label>
            <Button
              type="button"
              tone="success"
              variant="solid"
              size="lg"
              onClick={handleOpenShift}
              disabled={opening || !acceptedTerms}
              className={styles.primaryButton}
            >
              {opening
                ? "A abrir turno..."
                : ONBOARDING_5MIN_COPY.ritual.ctaOpen}
            </Button>
            <Button
              type="button"
              tone="neutral"
              variant="outline"
              onClick={handleGoToPanel}
              disabled={opening || !acceptedTerms}
              className={styles.secondaryButton}
            >
              {ONBOARDING_5MIN_COPY.ritual.ctaPanel}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
