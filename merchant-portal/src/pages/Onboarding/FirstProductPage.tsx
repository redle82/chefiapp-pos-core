/**
 * FirstProductPage — Passo 4 da Sequência Canônica v1.0 (Onboarding essencial).
 *
 * Contrato: passo "Primeiro produto" é pulável ("Continuar sem adicionar agora").
 * Fluxo mínimo: um item no menu visível no TPV; ou saltar → TPV para Aha Moment (primeira venda).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BootstrapStepIndicator } from "../../components/bootstrap/BootstrapStepIndicator";
import { DbWriteGate } from "../../core/governance/DbWriteGate";
import { setOnboardingJustCompletedFlag } from "../../core/storage/onboardingFlowFlag";
import { useTenant } from "../../core/tenant/TenantContext";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import styles from "./FirstProductPage.module.css";

export function FirstProductPage({
  successNextPath,
}: {
  /** Quando definido, skip e submit navegam para este path em vez de /op/tpv (fluxo 9 telas). */
  successNextPath?: string;
} = {}) {
  const navigate = useNavigate();
  const { tenantId: restaurantId } = useTenant();
  const [name, setName] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = successNextPath ?? "/op/tpv";
  /** No fluxo 9 telas (successNextPath definido) não marcamos completo aqui — só no Ritual. */
  const is9StepFlow = !!successNextPath;

  /** Sequência Canônica v1.0: passo 4 é pulável → marcar onboarding completo e ir ao TPV (Aha Moment). */
  const handleSkipToTpv = async () => {
    if (!restaurantId) return;
    setSkipLoading(true);
    setError(null);
    try {
      if (!is9StepFlow) {
        await markOnboardingComplete();
        setOnboardingJustCompletedFlag();
      }
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao continuar.");
    } finally {
      setSkipLoading(false);
    }
  };

  /** Marcar restaurante como pronto para operar (destrava TPV/dashboard). */
  const markOnboardingComplete = async () => {
    if (!restaurantId) return;
    const completedAt = new Date().toISOString();
    const { error: updateError } = await DbWriteGate.update(
      "OnboardingQuick",
      "gm_restaurants",
      {
        status: "active",
        onboarding_completed_at: completedAt,
      },
      { id: restaurantId },
      { tenantId: restaurantId },
    );
    if (updateError) {
      console.warn(
        "[FirstProduct] Failed to activate restaurant:",
        updateError,
      );
    }
    // Pilot mock: manter em sync para getRestaurantStatus devolver onboarding_completed_at
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
  };

  const handleSkipToDashboard = async () => {
    if (!restaurantId) return;
    setSkipLoading(true);
    setError(null);
    try {
      if (!is9StepFlow) {
        await markOnboardingComplete();
        setOnboardingJustCompletedFlag();
      }
      navigate(is9StepFlow ? nextPath : "/app/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao continuar.");
    } finally {
      setSkipLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome do produto é obrigatório.");
      return;
    }
    const eur = parseFloat(priceEur.replace(",", "."));
    if (Number.isNaN(eur) || eur < 0) {
      setError("Preço deve ser um número ≥ 0 (ex: 2.50).");
      return;
    }
    const price_cents = Math.round(eur * 100);

    if (!restaurantId) {
      setError("Restaurante não encontrado. Volte ao início.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: insertError } = await DbWriteGate.insert(
        "OnboardingQuick",
        "gm_products",
        {
          restaurant_id: restaurantId,
          name: trimmedName,
          price_cents,
          available: true,
          station: "KITCHEN",
          prep_time_seconds: 300,
        },
        { tenantId: restaurantId },
      );
      if (insertError) throw insertError;
      if (!data?.id) throw new Error("Produto não foi criado.");

      // No fluxo 9 telas não marcamos onboarding completo aqui — só no Ritual.
      if (!is9StepFlow) {
        const { error: updateError } = await DbWriteGate.update(
          "OnboardingQuick",
          "gm_restaurants",
          {
            status: "active",
            onboarding_completed_at: new Date().toISOString(),
          },
          { id: restaurantId },
          { tenantId: restaurantId },
        );
        if (updateError) {
          console.warn(
            "[FirstProduct] Failed to activate restaurant:",
            updateError,
          );
        }
      }

      navigate(nextPath, { replace: true });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Erro ao criar produto.");
    }
  };

  if (!restaurantId) {
    return (
      <div className={styles.notFoundContainer}>
        <p>Restaurante não encontrado.</p>
        <p className={styles.notFoundSubtext}>
          Crie o restaurante no ecrã de arranque e volte aqui.
        </p>
        <Button
          type="button"
          tone="success"
          variant="solid"
          onClick={() => navigate("/bootstrap")}
          className={styles.notFoundButton}
        >
          Voltar ao início
        </Button>
      </div>
    );
  }

  return (
    <div data-canonical-flow="v1.0" data-step="4" className={styles.pageRoot}>
      <div className={styles.settingsButton}>
        <Button
          type="button"
          tone="neutral"
          variant="outline"
          size="sm"
          onClick={() => navigate("/app/dashboard")}
        >
          ⚙️ Web de configuração
        </Button>
      </div>
      <BootstrapStepIndicator step={4} total={8} />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>Primeiro produto (opcional)</h1>
        <p className={styles.subtitle}>
          Pode adicionar um produto ou continuar sem adicionar agora para ir ao
          TPV e fazer a primeira venda.
        </p>
        <Card padding="lg" className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              id="product-name"
              label="Nome do produto *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Café"
              required
              autoFocus
              fullWidth
            />
            <Input
              id="product-price"
              label="Preço (€) *"
              type="text"
              inputMode="decimal"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              placeholder="ex: 2,50"
              required
              fullWidth
            />
            {error && <p className={styles.errorText}>{error}</p>}
            <Button
              type="submit"
              tone="success"
              variant="solid"
              disabled={loading}
              isLoading={loading}
              fullWidth
            >
              {loading ? "A criar..." : "Criar e abrir TPV"}
            </Button>
          </form>
        </Card>
        <div className={styles.skipActions}>
          <Button
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            onClick={handleSkipToTpv}
            disabled={skipLoading}
            isLoading={skipLoading}
            className={styles.skipButton}
          >
            {skipLoading ? "A abrir TPV..." : "Continuar sem adicionar agora"}
          </Button>
          <Button
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            onClick={handleSkipToDashboard}
            disabled={skipLoading}
            className={styles.skipButton}
          >
            Ir à web de configuração
          </Button>
        </div>
      </div>
    </div>
  );
}
