import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import { BootstrapStepIndicator } from "../components/bootstrap/BootstrapStepIndicator";
import { DbWriteGate } from "../core/governance/DbWriteGate";
import { useCoreHealth } from "../core/health";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";
import { getDockerCoreFetchClient } from "../core/infra/dockerCoreFetchClient";
import { Logger } from "../core/logger";
import {
  getTabIsolated,
  setTabIsolated,
} from "../core/storage/TabIsolatedStorage";
import { upsertSetupStatus } from "../infra/writers/RuntimeWriter";
import styles from "./BootstrapPage.module.css";
// TEMPORARY: Supabase auth only (quarantine). Domain reads/writes removed — Core only.
import { db } from "../core/db";
import { setActiveTenant } from "../core/tenant/TenantResolver";
import { useBootstrapState } from "../hooks/useBootstrapState";
import { Button, Card, InlineAlert, Input } from "../ui/design-system";
import { Select } from "../ui/design-system/primitives";

/**
 * BootstrapPage — System Initialization
 *
 * TRUTH LOCK: No fake causal steps. Real checks, real feedback.
 *
 * This page verifies the system is ready before allowing progression.
 * If restaurant_id exists in localStorage, proceeds to preview.
 * Otherwise, redirects to start flow.
 *
 * UPDATE: S0 Resilience Check
 * Ensure this page NEVER blocks the user, even if the backend is down.
 */

type BootstrapState =
  | "checking"
  | "checking_restaurant"
  | "checking_health"
  | "create_form"
  | "creating"
  | "ready"
  | "error"
  | "timeout"
  | "redirecting";

// S0 CONFIG: More tolerant values
const BOOTSTRAP_TIMEOUT = 15000; // 15s (was 10s) - Give slow backends a chance

const RESTAURANT_TYPES = [
  "Restaurante",
  "Café",
  "Bar",
  "Snack",
  "Catering",
] as const;

export function BootstrapPage({
  successNextPath: successNextPathProp = "/dashboard",
}: {
  successNextPath?: string;
} = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const bootstrap = useBootstrapState();
  const successNextPath =
    (location.state as { successNextPath?: string } | undefined)
      ?.successNextPath ?? successNextPathProp;
  const { status: _health } = useCoreHealth({
    autoStart: false,
    timeout: BOOTSTRAP_TIMEOUT,
  });

  const [state, setState] = useState<BootstrapState>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  // Onda 4 A2 + FASE 1 Passo 1: form nome, tipo, país, contacto
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantContact, setRestaurantContact] = useState("");
  const [restaurantType, setRestaurantType] = useState<string>("Restaurante");
  const [restaurantCountry, setRestaurantCountry] = useState<string>("PT");

  const switchToTrialMode = () => {
    setTabIsolated("chefiapp_trial_mode", "true");
    // Safety: ensure we have a dummy ID to pass guards
    if (!getTabIsolated("chefiapp_restaurant_id")) {
      setTabIsolated("chefiapp_restaurant_id", "trial-restaurant-id");
    }
    navigate("/dashboard");
  };

  const runBootstrap = useCallback(async () => {
    console.log("[Bootstrap] Starting bootstrap...");
    setState("checking");
    setErrorMessage(null);
    setShowProgress(false);
    setProgressStep(null);

    // ANTI-SUPABASE §4: Domain only via Core (Docker). No Supabase backend for domain.
    if (getBackendType() !== BackendType.docker) {
      setState("error");
      setErrorMessage(
        "Sistema Nervoso (Core) indisponível. Configure o Docker Core para continuar.",
      );
      return;
    }

    // 1. Auth Session (Core auth; domain data from Core only)
    let session: unknown = null;
    let authError: unknown = null;
    try {
      const result = await db.auth.getSession();
      session = result.data?.session ?? null;
      authError = result.error ?? null;
    } catch (e) {
      authError = e;
    }
    console.log("[Bootstrap] Session check result:", {
      hasSession: !!session,
      error: authError,
    });

    // Docker: when no session, show create-restaurant form and enable Pilot mode
    if (session === null) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("chefiapp_pilot_mode", "true");
      }
      setState("create_form");
      return;
    }

    // TRIAL MODE BYPASS
    const isTrial = getTabIsolated("chefiapp_trial_mode") === "true";
    if (isTrial || (!session && !authError)) {
      // If no session and not trial -> Redirect Start
      if (!isTrial && !session) {
        console.log("[Bootstrap] No session found, redirecting to login");
        setState("redirecting");
        setTimeout(() => navigate("/login"), 300);
        return;
      }
      // If Trial -> Allow pass → Dashboard config-first
      setState("ready");
      setTimeout(() => navigate("/dashboard"), 500);
      return;
    }

    setState("checking_restaurant");
    setProgressStep("Verificando identidade...");

    try {
      // 2. Check Membership (Sovereign Link)
      const user = (session as { user?: { id: string } })?.user;
      if (!user) {
        setState("redirecting");
        setTimeout(() => navigate("/login"), 300);
        return;
      }
      // Domain reads ONLY via Core (Supabase removed — §4)
      const core = getDockerCoreFetchClient();
      const membersRes = await core
        .from("gm_restaurant_members")
        .select("restaurant_id, role")
        .eq("user_id", user.id)
        .then((r) => r);
      const members = Array.isArray(membersRes.data) ? membersRes.data : null;
      const memberError = membersRes.error;

      console.log("[Bootstrap] Membership query result (Core):", {
        members,
        error: memberError,
      });

      if (memberError) throw memberError;

      if (members && members.length > 0) {
        // EXISTING OWNER/STAFF
        const member = members[0] as { restaurant_id: string; role: string };
        console.log("[Bootstrap] Existing member found:", member);
        setTabIsolated("chefiapp_restaurant_id", member.restaurant_id);
        setTabIsolated("chefiapp_user_role", member.role);

        // WIZARD COMPLETION GATE: Check if wizard is completed (Core only)
        // Query existing columns; wizard_completed_at/setup_status may not exist yet → fallback to onboarding_completed_at
        const restRes = await core
          .from("gm_restaurants")
          .select("onboarding_completed_at, status")
          .eq("id", member.restaurant_id)
          .single();
        const restaurant = restRes.data;
        const restCheckError = restRes.error;

        // Handle schema errors (columns may not exist yet) - use defaults
        let wizardCompleted = false;
        let status:
          | "not_started"
          | "quick_done"
          | "advanced_in_progress"
          | "advanced_done" = "not_started";

        if (restCheckError) {
          const isSchemaError =
            restCheckError.code === "42703" ||
            restCheckError.code?.startsWith("PGRST") ||
            restCheckError.message?.includes("column") ||
            restCheckError.message?.includes("does not exist") ||
            (restCheckError as any).status === 400;

          if (isSchemaError) {
            // Schema lag - columns don't exist yet, use defaults
            console.log(
              "[BootstrapPage] Schema lag detected. Using default state.",
            );
          } else {
            // Other error - log and use defaults
            console.warn(
              "[BootstrapPage] Error loading restaurant:",
              restCheckError,
            );
          }
        } else if (restaurant) {
          // Map available columns: onboarding_completed_at → wizardCompleted
          wizardCompleted =
            (restaurant as any).onboarding_completed_at !== null;
          status = ((restaurant as any).setup_status || "not_started") as
            | "not_started"
            | "quick_done"
            | "advanced_in_progress"
            | "advanced_done";
        }

        const advancedDone = wizardCompleted || status === "advanced_done";
        const quickDone =
          status === "quick_done" || status === "advanced_in_progress";

        if (advancedDone) {
          setState("ready");
          setProgressStep(`Bem-vindo de volta!`);
          const targetPath = member.role === "owner" ? "/dashboard" : "/op/tpv";
          // P2-3 FIX: Navegação imediata após verificação real (sem delay artificial)
          navigate(targetPath);
          return;
        }

        const onboardingMode = getTabIsolated("chefiapp_onboarding_mode");
        if (onboardingMode === "migration") {
          setState("ready");
          setProgressStep("Iniciando migração inteligente...");
          // P2-3 FIX: Navegação imediata após verificação real
          navigate("/migration/wizard");
          return;
        }

        if (quickDone) {
          setState("ready");
          setProgressStep("Configuração rápida concluída");
          // P2-3 FIX: Navegação imediata após verificação real
          navigate("/app/dashboard");
          return;
        }

        setState("ready");
        setProgressStep("Completa a configuração inicial...");
        // GloriaFood: Portal central — destino sempre /app/dashboard
        navigate("/app/dashboard");
        return;
      } else {
        // NEW USER -> Onda 4 A2: mostrar form nome + contacto antes de criar
        console.log(
          "[Bootstrap] New user detected - show create restaurant form",
        );
        setState("create_form");
      }
    } catch (error: any) {
      console.error("[Bootstrap] Fatal:", error);
      setState("error");
      setErrorMessage(error.message || "Erro ao conectar ao banco de dados.");
    }
  }, [navigate]);

  /** Onda 4 A2: criar restaurante SOMENTE via Core (Docker). No Supabase domain path. */
  const handleCreateRestaurant = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = restaurantName.trim();
      if (!name) {
        setErrorMessage("Nome do restaurante é obrigatório.");
        return;
      }
      // ANTI-SUPABASE §4: Create restaurant only via Core. Fail explicit if not Docker.
      if (getBackendType() !== BackendType.docker) {
        setState("error");
        setErrorMessage(
          "Core indisponível. Configure o Docker Core para criar o restaurante.",
        );
        return;
      }
      setState("creating");
      setErrorMessage(null);
      setProgressStep("Criando o teu restaurante...");

      try {
        let user: { id: string } | null = null;
        try {
          const {
            data: { session: sess },
          } = await db.auth.getSession();
          user = (sess as { user?: { id: string } } | null)?.user ?? null;
        } catch {
          // Auth optional in Pilot/Docker: use mock user id
        }
        if (!user) {
          user = { id: self.crypto.randomUUID() };
        }

        // Insert ONLY via Core (DbWriteGate → Docker PostgREST)
        // Core gm_restaurants: id, tenant_id, name, slug, description, owner_id, status, billing_status, product_mode (sem country/type/timezone/currency/locale)
        const timestamp = Date.now().toString(36).slice(-6).toLowerCase();
        const slug = `rest-${timestamp}`;
        const trialEndsAt = new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const restaurantPayload: Record<string, unknown> = {
          name,
          slug,
          owner_id: user.id,
          status: "active",
          billing_status: "trial",
          trial_ends_at: trialEndsAt,
        };
        const { data: restData, error: restError } = await DbWriteGate.insert(
          "BootstrapPage",
          "gm_restaurants",
          restaurantPayload,
          { userId: user.id },
        );
        if (restError) throw restError;

        // Members: only via Core (DbWriteGate). If Core does not support table, insert may fail — no silent fallback.
        try {
          const { error: linkError } = await DbWriteGate.insert(
            "BootstrapPage",
            "gm_restaurant_members",
            {
              user_id: user.id,
              restaurant_id: restData.id,
              role: "owner",
            },
            { tenantId: restData.id },
          );
          if (linkError)
            Logger.info("[Bootstrap] gm_restaurant_members insert:", linkError);
        } catch (e) {
          Logger.info(
            "[Bootstrap] Core members write skipped or failed (no fallback):",
            e,
          );
        }

        // Persistir setup_status no banco (identity = true) para ao recarregar não voltar ao nome
        if (getBackendType() === BackendType.docker) {
          const { error: setupErr } = await upsertSetupStatus(restData.id, {
            identity: true,
          });
          if (setupErr) {
            console.warn("[BootstrapPage] upsertSetupStatus:", setupErr);
          }
        }

        // Fechar estado: tenant resolvido (evita loop Auth/FlowGate)
        setActiveTenant(restData.id, "ACTIVE");
        setTabIsolated("chefiapp_user_role", "owner");
        if (typeof window !== "undefined") {
          window.localStorage.setItem("chefiapp_restaurant_id", restData.id);
          window.localStorage.setItem(
            "chefiapp_pilot_mock_restaurant",
            JSON.stringify({
              id: restData.id,
              name:
                restaurantName?.trim() || restData.name || "Meu Restaurante",
              onboarding_completed_at: null,
              billing_status: "trial",
              trial_ends_at: trialEndsAt,
            }),
          );
        }
        setState("ready");
        setProgressStep("Cozinha criada com sucesso!");
        navigate(successNextPath, { replace: true });
      } catch (err: unknown) {
        console.error("[Bootstrap] Create restaurant:", err);
        setState("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Erro ao criar restaurante.",
        );
      }
    },
    [
      restaurantName,
      restaurantContact,
      restaurantType,
      restaurantCountry,
      navigate,
      successNextPath,
    ],
  );

  useEffect(() => {
    runBootstrap();
  }, [runBootstrap]);

  // Pré-preenche o formulário quando vem do Onboarding assistente (camada Ativação).
  useEffect(() => {
    const fromOnboarding = (location.state as { fromOnboarding?: boolean })
      ?.fromOnboarding;
    if (!fromOnboarding) return;
    try {
      const raw = sessionStorage.getItem("chefiapp_onboarding_answers");
      if (raw) {
        const data = JSON.parse(raw) as {
          nome?: string;
          tipo?: string;
          pais?: string;
        };
        if (data.nome) setRestaurantName(data.nome);
        if (data.tipo) setRestaurantType(data.tipo);
        if (data.pais) setRestaurantCountry(data.pais);
      }
    } catch {
      // ignore
    }
  }, [location.state]);

  return (
    <div className={styles.pageRoot}>
      <div className={styles.pageContainer}>
        <BootstrapStepIndicator step={3} total={8} />
        <main className={styles.mainContent}>
          {/* Onda 4 A2: form criar restaurante (nome + contacto) */}
          {state === "create_form" && (
            <>
              <h1 className={`h1 ${styles.heading}`}>
                Criar o teu restaurante
              </h1>
              <p className={`muted ${styles.subtitle}`}>
                Nome e contacto para começar.
              </p>
              <Card padding="lg" className={styles.formCard}>
                <form onSubmit={handleCreateRestaurant} className={styles.form}>
                  <Input
                    id="restaurant-name"
                    label="Nome do restaurante *"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="ex: Sofia Gastrobar"
                    required
                    autoFocus
                    fullWidth
                  />
                  <Select
                    id="restaurant-type"
                    label="Tipo *"
                    value={restaurantType}
                    onChange={(e) => setRestaurantType(e.target.value)}
                    options={RESTAURANT_TYPES.map((t) => ({
                      value: t,
                      label: t,
                    }))}
                    fullWidth
                  />
                  <Select
                    id="restaurant-country"
                    label="País / Moeda *"
                    value={restaurantCountry}
                    onChange={(e) => setRestaurantCountry(e.target.value)}
                    options={[
                      { value: "PT", label: "Portugal (EUR)" },
                      { value: "ES", label: "Espanha (EUR)" },
                      { value: "BR", label: "Brasil (BRL)" },
                      { value: "US", label: "EUA (USD)" },
                    ]}
                    fullWidth
                  />
                  <Input
                    id="restaurant-contact"
                    label="Contacto (cidade, email ou telefone)"
                    type="text"
                    value={restaurantContact}
                    onChange={(e) => setRestaurantContact(e.target.value)}
                    placeholder="opcional"
                    fullWidth
                  />
                  <Button
                    type="submit"
                    tone="success"
                    variant="solid"
                    fullWidth
                  >
                    Criar e continuar
                  </Button>
                </form>
              </Card>
            </>
          )}

          {/* CREATING STATE (Onda 4 A2) */}
          {state === "creating" && (
            <>
              <div className={styles.spinner} />
              <h1 className={`h1 ${styles.headingWhite}`}>
                Criando o teu restaurante
              </h1>
              {progressStep && (
                <p className={`muted ${styles.progressSuccess}`}>
                  {progressStep}
                </p>
              )}
            </>
          )}

          {/* CHECKING STATE */}
          {(state === "checking" ||
            state === "checking_restaurant" ||
            state === "checking_health") && (
            <>
              <div className={styles.spinnerGlow} />
              <h1 className={`h1 ${styles.headingWhite}`}>
                Conectando ao Sistema Nervoso
              </h1>
              {showProgress && progressStep && (
                <p className={`muted ${styles.progressSuccessLarge}`}>
                  {progressStep}
                </p>
              )}
              {!showProgress && (
                <p className={`muted ${styles.progressMuted}`}>
                  Validando credenciais operacionais...
                </p>
              )}
            </>
          )}

          {/* TIMEOUT STATE - S0 GUARD */}
          {state === "timeout" && (
            <>
              <div className={styles.iconTimeout}>⏱</div>
              <h1 className={`h1 ${styles.heading22}`}>Latência na Rede</h1>
              <p className={`muted ${styles.textSpaced}`}>
                A conexão segura está demorando.
              </p>
              <div className={styles.buttonContainer}>
                <button
                  onClick={runBootstrap}
                  className={styles.buttonOutlineGreen}
                >
                  Tentar conectar novamente
                </button>
                {bootstrap.coreStatus === "offline-intencional" && (
                  <button
                    onClick={switchToTrialMode}
                    className={styles.buttonSolidGreen}
                  >
                    Continuar sem sessão (offline)
                  </button>
                )}
                {bootstrap.coreStatus === "offline-erro" && (
                  <button
                    onClick={bootstrap}
                    className={styles.buttonSolidGreen}
                  >
                    Iniciar Core
                  </button>
                )}
              </div>
            </>
          )}

          {/* READY STATE */}
          {state === "ready" && (
            <>
              <div className={styles.iconSuccess}>
                <div className={styles.iconSuccessDot}></div>
              </div>
              <h1 className={`h1 ${styles.headingWhite}`}>Acesso Autorizado</h1>
              <p className={`muted ${styles.progressSuccess}`}>
                Iniciando protocolos...
              </p>
            </>
          )}

          {/* REDIRECTING STATE */}
          {state === "redirecting" && (
            <>
              <div className={styles.spinner} />
              <h1 className={`h1 ${styles.heading22}`}>Bem-vindo</h1>
              <p className={`muted ${styles.progressText}`}>
                A iniciar configuração inicial...
              </p>
            </>
          )}

          {/* ERROR STATE - S0 GUARD */}
          {state === "error" && (
            <>
              <div className={styles.iconError}>✕</div>
              <h1 className={`h1 ${styles.heading22}`}>Falha na Conexão</h1>

              <div className={styles.errorContainer}>
                <InlineAlert
                  type="error"
                  message={errorMessage || "Erro desconhecido"}
                />

                <div className={styles.errorActions}>
                  <p className={`muted ${styles.errorHint}`}>
                    {bootstrap.coreStatus === "offline-intencional"
                      ? "Pode continuar sem sessão (offline)."
                      : bootstrap.coreStatus === "offline-erro"
                      ? "Inicie o Core para conectar."
                      : "Você pode continuar em modo offline/trial."}
                  </p>
                  {bootstrap.coreStatus === "offline-intencional" && (
                    <button
                      onClick={switchToTrialMode}
                      className={styles.buttonSolidGreen}
                    >
                      Continuar sem sessão (offline)
                    </button>
                  )}
                  {bootstrap.coreStatus === "offline-erro" && (
                    <button
                      onClick={bootstrap}
                      className={styles.buttonSolidGreen}
                    >
                      Iniciar Core
                    </button>
                  )}
                  {bootstrap.coreStatus !== "offline-intencional" &&
                    bootstrap.coreStatus !== "offline-erro" && (
                      <>
                        <button
                          onClick={switchToTrialMode}
                          className={styles.buttonSolidGreen}
                        >
                          Iniciar Free Trial
                        </button>
                        <button
                          onClick={() => {
                            setTabIsolated(
                              "chefiapp_restaurant_id",
                              "pilot-mock-id",
                            );
                            setTabIsolated("chefiapp_user_role", "owner");
                            navigate("/dashboard");
                          }}
                          className={styles.buttonOutlineGreenWithMargin}
                        >
                          Simular Criação (Offline)
                        </button>
                      </>
                    )}
                  <button
                    onClick={bootstrap}
                    className={styles.buttonOutlineDark}
                  >
                    Tentar Reconectar
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
