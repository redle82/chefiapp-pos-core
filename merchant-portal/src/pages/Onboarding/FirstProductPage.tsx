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
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

export function FirstProductPage({
  successNextPath,
}: {
  /** Quando definido, skip e submit navegam para este path em vez de /op/tpv (fluxo 9 telas). */
  successNextPath?: string;
} = {}) {
  const navigate = useNavigate();
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");
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
      { tenantId: restaurantId }
    );
    if (updateError) {
      console.warn("[FirstProduct] Failed to activate restaurant:", updateError);
    }
    // Pilot mock: manter em sync para getRestaurantStatus devolver onboarding_completed_at
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem("chefiapp_pilot_mock_restaurant");
      if (raw) {
        const row = JSON.parse(raw) as { id?: string; onboarding_completed_at?: string | null; billing_status?: string };
        if (row.id === restaurantId) {
          row.onboarding_completed_at = completedAt;
          row.billing_status = row.billing_status || "trial";
          window.localStorage.setItem("chefiapp_pilot_mock_restaurant", JSON.stringify(row));
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
        { tenantId: restaurantId }
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
          { tenantId: restaurantId }
        );
        if (updateError) {
          console.warn(
            "[FirstProduct] Failed to activate restaurant:",
            updateError
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
      <div
        style={{
          padding: spacing[6],
          textAlign: "center",
          color: colors.text.secondary,
        }}
      >
        <p>Restaurante não encontrado.</p>
        <p style={{ fontSize: 14, marginTop: spacing[2] }}>
          Crie o restaurante no ecrã de arranque e volte aqui.
        </p>
        <Button
          type="button"
          tone="success"
          variant="solid"
          onClick={() => navigate("/bootstrap")}
          style={{ marginTop: spacing[4] }}
        >
          Voltar ao início
        </Button>
      </div>
    );
  }

  return (
    <div
      data-canonical-flow="v1.0"
      data-step="4"
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
      <div
        style={{
          position: "absolute",
          top: spacing[4],
          right: spacing[6],
          zIndex: 10,
        }}
      >
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
          Primeiro produto (opcional)
        </h1>
        <p
          style={{
            color: colors.text.secondary,
            marginBottom: spacing[6],
            fontSize: 14,
          }}
        >
          Pode adicionar um produto ou continuar sem adicionar agora para ir ao TPV e fazer a primeira venda.
        </p>
        <Card padding="lg" style={{ marginBottom: spacing[6] }}>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[4],
              textAlign: "left",
            }}
          >
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
            {error && (
              <p style={{ color: colors.destructive.base, fontSize: 13 }}>
                {error}
              </p>
            )}
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
        <div
          style={{
            marginTop: spacing[5],
            fontSize: 13,
            color: colors.text.tertiary,
            textAlign: "center",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: spacing[2],
          }}
        >
          <Button
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            onClick={handleSkipToTpv}
            disabled={skipLoading}
            isLoading={skipLoading}
            style={{ textDecoration: "underline" }}
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
            style={{ textDecoration: "underline" }}
          >
            Ir à web de configuração
          </Button>
        </div>
      </div>
    </div>
  );
}
