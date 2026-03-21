/**
 * OnboardingStartPage — Lead → Trial entry point.
 * Collects restaurant name, creates org+restaurant, starts trial, redirects to onboarding.
 * Ref: Lead → Trial flow (docs plan Fechar Máquina de Venda 100%).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  commercialTracking,
  detectDevice,
  isCommercialTrackingEnabled,
} from "../../commercial/tracking";
import { useOnboarding } from "../../hooks/useOnboarding";
import { startTrial } from "../../core/billing/trialEngine";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import styles from "./OnboardingPlanTrialPage.module.css";

const pageStyles = {
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #404040",
    borderRadius: 8,
    backgroundColor: "#141414",
    color: "#fafafa",
    marginBottom: 16,
  },
  button: {
    minHeight: 48,
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
  },
  error: { color: "#f87171", fontSize: 13, marginTop: 8 },
};

export function OnboardingStartPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initializeOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Introduza o nome do restaurante.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const ctx = await initializeOnboarding(trimmed);
      const result = await startTrial(ctx.restaurant_id);
      if (!result.ok) {
        setError(result.error ?? "Erro ao ativar trial.");
        return;
      }
      if (isCommercialTrackingEnabled()) {
        commercialTracking.track({
          timestamp: new Date().toISOString(),
          country: "gb",
          segment: "small",
          landing_version: "country-v1",
          device: detectDevice(),
          path: typeof window !== "undefined" ? window.location.pathname : "",
          event: "trial_started",
          restaurant_id: ctx.restaurant_id,
        });
      }
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-onboarding-step="start" className={styles.pageRoot}>
      <OnboardingStepIndicator step={1} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.headline}>Começar o seu trial</h1>
        <p style={{ color: "#a3a3a3", marginBottom: 24 }}>
          Em poucos passos configura o restaurante e ativa o trial de 14 dias.
        </p>
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="restaurant-name"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "#a3a3a3",
              marginBottom: 8,
            }}
          >
            Nome do restaurante
          </label>
          <input
            id="restaurant-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: O Meu Restaurante"
            style={pageStyles.input}
            disabled={loading}
          />
          {error && <p style={pageStyles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={pageStyles.button}>
            {loading ? "A criar..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
