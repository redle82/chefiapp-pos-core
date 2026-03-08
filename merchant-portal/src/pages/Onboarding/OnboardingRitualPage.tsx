/**
 * Onboarding 5min — Tela 8: Ritual de Abertura.
 * "Abrir turno agora" → abre turno no Core, marca onboarding completo, destrava TPV real.
 * "Ir para o painel" → marca onboarding completo, vai ao dashboard.
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { recordLegalConsent } from "../../core/audit/legalConsent";
import { DbWriteGate } from "../../core/governance/DbWriteGate";
import { useShift } from "../../core/shift/ShiftContext";
import { setOnboardingJustCompletedFlag } from "../../core/storage/onboardingFlowFlag";
import { getDefaultOpeningCashCents } from "../../core/storage/shiftDefaultsStorage";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import styles from "./OnboardingRitualPage.module.css";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidRestaurantId(id: string | null): id is string {
  return !!id && UUID_REGEX.test(id);
}

export function OnboardingRitualPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("onboarding");
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
      ? t("fiveMin.ritual.caixaHelpWithValue", { amount: defaultEur })
      : t("fiveMin.ritual.caixaHelpDefault");

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
      setError(t("fiveMin.ritual.errorTerms"));
      return;
    }
    if (!consentLoggedRef.current) {
      consentLoggedRef.current = true;
      recordLegalConsent({ restaurantId, source: "onboarding_ritual" });
    }
    if (!isValidRestaurantId(restaurantId)) {
      setError(t("fiveMin.ritual.errorInvalidId"));
      return;
    }
    const eur = parseFloat(caixaEur.replace(",", "."));
    if (Number.isNaN(eur) || eur < 0) {
      setError(t("fiveMin.ritual.errorCashInvalid"));
      return;
    }
    const openingBalanceCents = Math.round(eur * 100);
    setOpening(true);
    try {
      const { data, error: rpcError } = await dockerCoreClient.rpc(
        "open_cash_register_atomic",
        {
          p_restaurant_id: restaurantId,
          p_name: t("fiveMin.ritual.registerName"),
          p_opened_by: t("fiveMin.ritual.operatorName"),
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
            : t("fiveMin.ritual.errorCoreUnavailable");
        setError(msg);
        return;
      }
      if (!data?.id) {
        setError(t("fiveMin.ritual.errorShiftFailed"));
        return;
      }
      await markOnboardingComplete();
      shift?.refreshShiftStatus?.();
      navigate("/op/tpv", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("fiveMin.ritual.errorGeneric"),
      );
    } finally {
      setOpening(false);
    }
  };

  const handleGoToPanel = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError(t("fiveMin.ritual.errorTerms"));
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
      setError(
        err instanceof Error ? err.message : t("fiveMin.ritual.errorContinue"),
      );
    }
  };

  if (!restaurantId) {
    return (
      <div className={styles.notFoundContainer}>
        <p>{t("fiveMin.ritual.notFound")}</p>
        <Button
          type="button"
          tone="success"
          variant="solid"
          onClick={() => navigate("/onboarding/identity")}
          className={styles.notFoundButton}
        >
          {t("fiveMin.ritual.backToStart")}
        </Button>
      </div>
    );
  }

  return (
    <div data-onboarding-step="8" className={styles.pageRoot}>
      <OnboardingStepIndicator step={9} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>{t("fiveMin.ritual.headline")}</h1>
        <p className={styles.subtitle}>{t("fiveMin.ritual.message")}</p>
        <Card padding="lg" className={styles.card}>
          <div className={styles.formContent}>
            <Input
              label={t("fiveMin.ritual.caixaLabel")}
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
                {t("fiveMin.ritual.termsPrefix")}{" "}
                <Link to="/legal/terms" className={styles.termsLink}>
                  {t("fiveMin.ritual.terms")}
                </Link>{" "}
                {t("fiveMin.ritual.termsAnd")}{" "}
                <Link to="/legal/privacy" className={styles.termsLink}>
                  {t("fiveMin.ritual.privacy")}
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
                ? t("fiveMin.ritual.openingShift")
                : t("fiveMin.ritual.ctaOpen")}
            </Button>
            <Button
              type="button"
              tone="neutral"
              variant="outline"
              onClick={handleGoToPanel}
              disabled={opening || !acceptedTerms}
              className={styles.secondaryButton}
            >
              {t("fiveMin.ritual.ctaPanel")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
