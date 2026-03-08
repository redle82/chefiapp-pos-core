/**
 * Onboarding Assistente — Fluxo de 9 passos ligado ao backend.
 *
 * Usa useOnboarding(): create_onboarding_context, update_onboarding_step, get_onboarding_state.
 * Barra de progresso (progress_percent). No fim redireciona para /app/staff/home.
 * Ref: IMPLEMENTATION_CHECKLIST.md Day 3, docs/contracts/FUNIL_VIDA_CLIENTE.md
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../hooks/useOnboarding";
import { getPostOnboardingRedirectUrl } from "../../infra/clients/OnboardingClient";

const STEPS_ORDER = [
  "welcome",
  "restaurant_setup",
  "legal_info",
  "menu",
  "staff",
  "payment",
  "devices",
  "verification",
  "complete",
] as const;

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #171717 50%, #1c1917 100%)",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
    maxWidth: 480,
    margin: "0 auto" as const,
  },
  header: { marginBottom: 28, textAlign: "center" as const },
  title: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 8,
    color: "#fafafa",
    letterSpacing: "-0.02em",
  },
  subtitle: { fontSize: 14, color: "#a3a3a3", lineHeight: 1.5 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#404040",
    overflow: "hidden" as const,
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#eab308",
    transition: "width 0.3s ease",
  },
  form: { display: "flex", flexDirection: "column" as const, gap: 20 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#a3a3a3",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #404040",
    borderRadius: 8,
    backgroundColor: "#141414",
    color: "#fafafa",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #404040",
    borderRadius: 8,
    backgroundColor: "#141414",
    color: "#fafafa",
    cursor: "pointer",
  },
  row: { display: "flex", alignItems: "center", gap: 12 },
  checkbox: { width: 20, height: 20, cursor: "pointer" },
  button: {
    marginTop: 16,
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
  buttonSecondary: {
    marginTop: 8,
    minHeight: 44,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 500,
    border: "1px solid #404040",
    borderRadius: 10,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#a3a3a3",
  },
  error: { color: "#f87171", fontSize: 13, marginTop: 8 },
};

const PAISES = [
  { value: "PT", label: "Portugal" },
  { value: "BR", label: "Brasil" },
  { value: "ES", label: "Espanha" },
  { value: "FR", label: "França" },
  { value: "OTHER", label: "Outro" },
];

const TIPOS = ["Bar", "Restaurante", "Café", "Fast Casual", "Outro"] as const;

export function OnboardingAssistantPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    state,
    stateLoading,
    stateError,
    initializeOnboarding,
    completeStep,
    progressPercent,
    isOnboarding,
  } = useOnboarding();

  const [restaurantName, setRestaurantName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data for multi-step (persisted in step payloads)
  const [setupData, setSetupData] = useState<Record<string, unknown>>({
    pais: "PT",
    tipo: "Restaurante",
    numMesas: "",
    usaImpressora: false,
    usaKDS: false,
    numUsuarios: "",
    ownerName: "",
    ownerEmail: "",
    menuProducts: "",
    staffCount: "",
    paymentMethod: "card",
  });

  const currentStep = state?.current_step ?? "welcome";
  const currentIndex = STEPS_ORDER.indexOf(
    currentStep as (typeof STEPS_ORDER)[number],
  );
  const nextStep =
    currentIndex >= 0 && currentIndex < STEPS_ORDER.length - 1
      ? STEPS_ORDER[currentIndex + 1]
      : null;

  // Redirect to app when onboarding is complete (e.g. returning user)
  useEffect(() => {
    if (!stateLoading && state?.is_complete) {
      navigate(getPostOnboardingRedirectUrl(), { replace: true });
    }
  }, [state?.is_complete, stateLoading, navigate]);

  // After completing "complete" step, redirect after short delay
  useEffect(() => {
    if (currentStep === "complete" && state?.is_complete) {
      const t = setTimeout(() => {
        navigate(getPostOnboardingRedirectUrl(), { replace: true });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [currentStep, state?.is_complete, navigate]);

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = restaurantName.trim() || "Meu Restaurante";
    setSaving(true);
    try {
      await initializeOnboarding(name);
      setRestaurantName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar restaurante",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = async (
    step: string,
    data: Record<string, unknown> = {},
  ) => {
    setError(null);
    setSaving(true);
    try {
      await completeStep(step, data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao guardar este passo",
      );
    } finally {
      setSaving(false);
    }
  };

  if (stateLoading && !state) {
    return (
      <div style={styles.page}>
        <p style={styles.subtitle}>A carregar...</p>
      </div>
    );
  }

  // No onboarding yet: welcome + create restaurant
  if (!state) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.title}>Bem-vindo ao ChefIApp</h1>
          <p style={styles.subtitle}>
            Cria o teu restaurante para começar. Depois seguimos a configuração
            em poucos passos.
          </p>
        </header>
        <form style={styles.form} onSubmit={handleCreateRestaurant}>
          <div>
            <label style={styles.label}>Nome do restaurante</label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Ex: A Minha Tasca"
              style={styles.input}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? "A criar..." : "Criar restaurante"}
          </button>
        </form>
      </div>
    );
  }

  const progress = Math.max(0, Math.min(100, progressPercent));

  return (
    <div style={styles.page}>
      <div style={styles.progressBar}>
        <div
          style={{ ...styles.progressFill, width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <header style={styles.header}>
        <h1 style={styles.title}>Configuração guiada</h1>
        <p style={styles.subtitle}>
          Passo {currentIndex + 1} de {STEPS_ORDER.length}:{" "}
          {currentStep.replace(/_/g, " ")}
        </p>
      </header>

      {currentStep === "welcome" && (
        <>
          <p style={styles.subtitle}>
            O teu restaurante &quot;{state.restaurant_name}&quot; foi criado.
            Responde às perguntas seguintes para ativar TPV e equipa.
          </p>
          {error && <p style={styles.error}>{error}</p>}
          <button
            type="button"
            style={styles.button}
            disabled={saving}
            onClick={() => handleNextStep("restaurant_setup", {})}
          >
            {saving ? t("common:saving") : t("common:continue")}
          </button>
        </>
      )}

      {currentStep === "restaurant_setup" && (
        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleNextStep("legal_info", {
              pais: setupData.pais,
              tipo: setupData.tipo,
              numMesas: setupData.numMesas,
            });
          }}
        >
          <div>
            <label style={styles.label}>País</label>
            <select
              value={String(setupData.pais)}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, pais: e.target.value }))
              }
              style={styles.select}
            >
              {PAISES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Tipo de estabelecimento</label>
            <select
              value={String(setupData.tipo)}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, tipo: e.target.value }))
              }
              style={styles.select}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Número de mesas (estimativa)</label>
            <input
              type="number"
              min={0}
              value={String(setupData.numMesas)}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, numMesas: e.target.value }))
              }
              placeholder="Ex: 10"
              style={styles.input}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? t("common:saving") : t("common:continue")}
          </button>
        </form>
      )}

      {currentStep === "legal_info" && (
        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleNextStep("menu", {
              ownerName: setupData.ownerName,
              ownerEmail: setupData.ownerEmail,
            });
          }}
        >
          <div>
            <label style={styles.label}>Nome do responsável (opcional)</label>
            <input
              type="text"
              value={String(setupData.ownerName ?? "")}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, ownerName: e.target.value }))
              }
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Email (opcional)</label>
            <input
              type="email"
              value={String(setupData.ownerEmail ?? "")}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, ownerEmail: e.target.value }))
              }
              style={styles.input}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? t("common:saving") : t("common:continue")}
          </button>
        </form>
      )}

      {currentStep === "menu" && (
        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleNextStep("staff", {
              menuProducts: setupData.menuProducts,
            });
          }}
        >
          <div>
            <label style={styles.label}>
              Quantos produtos no menu? (estimativa, opcional)
            </label>
            <input
              type="number"
              min={0}
              value={String(setupData.menuProducts ?? "")}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, menuProducts: e.target.value }))
              }
              placeholder="Ex: 20"
              style={styles.input}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? t("common:saving") : t("common:continue")}
          </button>
        </form>
      )}

      {currentStep === "staff" && (
        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleNextStep("payment", {
              staffCount: setupData.numUsuarios,
            });
          }}
        >
          <div>
            <label style={styles.label}>
              Quantos colaboradores? (estimativa)
            </label>
            <input
              type="number"
              min={1}
              value={String(setupData.numUsuarios ?? "")}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, numUsuarios: e.target.value }))
              }
              placeholder="Ex: 3"
              style={styles.input}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? t("common:saving") : t("common:continue")}
          </button>
        </form>
      )}

      {currentStep === "payment" && (
        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleNextStep("devices", {
              paymentMethod: setupData.paymentMethod,
            });
          }}
        >
          <div>
            <label style={styles.label}>Método de pagamento principal</label>
            <select
              value={String(setupData.paymentMethod ?? "card")}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, paymentMethod: e.target.value }))
              }
              style={styles.select}
            >
              <option value="card">Cartão (TPV)</option>
              <option value="cash">Numerário</option>
              <option value="mbway">MB Way</option>
              <option value="both">Cartão + Numerário</option>
            </select>
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? t("common:saving") : t("common:continue")}
          </button>
        </form>
      )}

      {currentStep === "devices" && (
        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleNextStep("verification", {
              usaImpressora: setupData.usaImpressora,
              usaKDS: setupData.usaKDS,
            });
          }}
        >
          <div style={styles.row}>
            <input
              type="checkbox"
              id="impressora"
              checked={Boolean(setupData.usaImpressora)}
              onChange={(e) =>
                setSetupData((s) => ({
                  ...s,
                  usaImpressora: e.target.checked,
                }))
              }
              style={styles.checkbox}
            />
            <label style={styles.label} htmlFor="impressora">
              Usa impressora?
            </label>
          </div>
          <div style={styles.row}>
            <input
              type="checkbox"
              id="kds"
              checked={Boolean(setupData.usaKDS)}
              onChange={(e) =>
                setSetupData((s) => ({ ...s, usaKDS: e.target.checked }))
              }
              style={styles.checkbox}
            />
            <label style={styles.label} htmlFor="kds">
              Vai usar KDS (ecrã cozinha)?
            </label>
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? t("common:saving") : t("common:continue")}
          </button>
        </form>
      )}

      {currentStep === "verification" && (
        <>
          <p style={styles.subtitle}>
            Confirma os dados e clica em &quot;Concluir&quot; para ativar o teu
            restaurante.
          </p>
          {error && <p style={styles.error}>{error}</p>}
          <button
            type="button"
            style={styles.button}
            disabled={saving}
            onClick={() => handleNextStep("complete", {})}
          >
            {saving ? t("common:saving") : t("common:finishSetup")}
          </button>
        </>
      )}

      {currentStep === "complete" && (
        <>
          <p style={styles.subtitle}>
            Parabéns! O teu restaurante está pronto. Redirecionando para o
            centro de operações...
          </p>
          <div style={styles.progressBar}>
            <div
              style={{ ...styles.progressFill, width: "100%" }}
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </>
      )}

      {stateError && <p style={styles.error}>{stateError.message}</p>}
    </div>
  );
}
