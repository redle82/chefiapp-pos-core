// Auth only — temporary until Core Auth (signOut in this layout)
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import { GhostPreview } from "../components/GhostPreview";
import { GlobalFooter } from "../components/GlobalFooter";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";
import { useGhostPreviewProps, useOnboardingState } from "../hooks";
import { OnboardingContext } from "../hooks/useSetupContext";
import { OSFrame } from "../ui/design-system/sovereign/OSFrame";
import styles from "./SetupLayout.module.css";

/**
 * SetupLayout — Wrapper do wizard principal
 * Mostra progresso lateral/topo + renderiza Outlet (rotas filhas)
 */
export function SetupLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize hook with TabIsolatedStorage values if available
  const onboarding = useOnboardingState({
    apiBase: getTabIsolated("chefiapp_api_base") || "",
    internalToken: getTabIsolated("chefiapp_internal_token") || "dev-token",
    restaurantId: getTabIsolated("chefiapp_restaurant_id") || "",
  });

  const { apiBase, stepStatus, steps, gates, loading, profile } = onboarding;

  const hasIdentity = Boolean(
    steps.identity ||
      getTabIsolated("chefiapp_evt_identity_done") === "1" ||
      (getTabIsolated("chefiapp_name") && getTabIsolated("chefiapp_slug")),
  );

  const navItems: { to: string; label: string; step: 1 | 2 | 3 | 4 | 5 }[] = [
    { to: "/app/setup/identity", label: "1 • Identidade", step: 1 },
    { to: "/app/setup/menu", label: "2 • Menu", step: 2 },
    { to: "/app/setup/payments", label: "3 • Pagamentos", step: 3 },
    { to: "/app/setup/design", label: "4 • Design", step: 4 },
    { to: "/app/setup/staff", label: "👥 Equipa", step: 4 },
    { to: "/app/setup/billing", label: "💳 Assinatura", step: 4 }, // Commercial
    { to: "/app/setup/publish", label: "5 • Publicar", step: 5 },
  ];

  function getStepIcon(
    status: "completed" | "current" | "blocked" | "pending",
  ) {
    switch (status) {
      case "completed":
        return "✓";
      case "current":
        return "●";
      case "blocked":
        return "🔒";
      default:
        return "○";
    }
  }

  const activeStep = useMemo((): 1 | 2 | 3 | 4 | 5 => {
    const path = location.pathname;
    if (path.includes("/app/setup/menu")) return 2;
    if (path.includes("/app/setup/payments")) return 3;
    if (path.includes("/app/setup/design")) return 4;
    if (path.includes("/app/setup/publish")) return 5;
    return 1;
  }, [location.pathname]);

  const completedCount =
    (steps.identity ? 1 : 0) +
    (steps.menu ? 1 : 0) +
    (steps.payments ? 1 : 0) +
    (steps.design ? 1 : 0) +
    (steps.published ? 1 : 0);

  const progressPct = Math.max(
    0,
    Math.min(100, Math.round((completedCount / 5) * 100)),
  );

  const slug = hasIdentity
    ? profile?.slug || getTabIsolated("chefiapp_slug") || ""
    : "";
  const publicUrl = hasIdentity && slug ? `${apiBase}/public/${slug}` : "";
  const restaurantName = hasIdentity
    ? profile?.name || getTabIsolated("chefiapp_name") || "O teu restaurante"
    : "";

  const [health, setHealth] = useState<"unknown" | "ok" | "offline">("unknown");
  // Health check ONLY after publish (not during setup)
  useEffect(() => {
    if (!steps.published) {
      setHealth("unknown");
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1200);
    (async () => {
      try {
        const res = await fetch(`${apiBase.replace(/\/$/, "")}/health`, {
          signal: controller.signal,
        });
        if (cancelled) return;
        setHealth(res.ok ? "ok" : "offline");
      } catch {
        if (cancelled) return;
        setHealth("offline");
      } finally {
        clearTimeout(t);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(t);
      controller.abort();
    };
  }, [apiBase, steps.published]);

  return (
    <OnboardingContext.Provider value={onboarding}>
      <OSFrame context="onboarding">
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              {/* Sovereign Signature handled by OSFrame */}
              <div className={styles.setupStep}>
                Setup • Passo {activeStep} de 5
              </div>
            </div>
            <span className={styles.progressBadge}>
              {progressPct}% concluído
            </span>
          </header>
          <div className={styles.contentWrap}>
            <div className={`setupGrid ${styles.grid}`}>
              {/* Sidebar / Progresso + Preview (fica visível no mobile) */}
              <aside className={styles.sidebar}>
                <div className={`card ${styles.cardReset}`}>
                  {!hasIdentity ? (
                    <>
                      <div className={`h3 ${styles.titleSpacing}`}>
                        Vamos começar
                      </div>
                      <div className="muted">
                        Cria a identidade do teu restaurante e vê a tua página
                        ganhar vida.
                      </div>
                      <div className={`banner neutral ${styles.bannerCompact}`}>
                        <div className="bannerText">
                          A pré-visualização aparecerá aqui após criares a
                          identidade.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`h3 ${styles.titleSpacing}`}>
                        A construir
                      </div>
                      <div className={styles.restaurantName}>
                        {restaurantName}
                      </div>

                      {steps.published && publicUrl && (
                        <div className="muted">
                          <span className={styles.urlMuted}>
                            URL: <code>{publicUrl}</code>
                          </span>
                        </div>
                      )}

                      <div className={styles.actionsRow}>
                        <button
                          className="btn"
                          disabled={loading}
                          onClick={() => onboarding.loadState()}
                        >
                          {loading ? "A carregar…" : "Atualizar"}
                        </button>
                      </div>

                      {!steps.published && (
                        <div
                          className={`banner neutral ${styles.bannerCompact}`}
                        >
                          <div className="bannerText">
                            A pré-visualização da tua página aparecerá aqui
                            quando publicares.
                          </div>
                        </div>
                      )}

                      {steps.published && (
                        <div className={styles.healthWrap}>
                          {health === "ok" ? (
                            <div
                              className={`banner ok ${styles.bannerCompactNoTop}`}
                            >
                              <div className="bannerText">
                                ✓ Servidor ligado • preview disponível
                              </div>
                            </div>
                          ) : health === "offline" ? (
                            <div
                              className={`banner neutral ${styles.bannerCompactNoTop}`}
                            >
                              <div className="bannerText">
                                Liga o servidor para veres a pré-visualização em
                                tempo real.
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`banner neutral ${styles.bannerCompactNoTop}`}
                            >
                              <div className="bannerText">
                                A verificar ligação ao servidor…
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {hasIdentity && (
                        <GhostPreviewWrapper
                          steps={steps}
                          health={health}
                          publicUrl={publicUrl}
                        />
                      )}
                    </>
                  )}
                </div>

                <nav className={`steps ${styles.stepsNav}`}>
                  {navItems.map(({ to, label, step }) => {
                    const status = stepStatus(step);
                    const isBlocked = status === "blocked";
                    const isCurrent = step === activeStep;
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={(e) => isBlocked && e.preventDefault()}
                        className={
                          `step ${status} ${styles.stepLink}` +
                          (isCurrent ? " current" : "") +
                          (isBlocked ? ` ${styles.stepBlocked}` : "")
                        }
                      >
                        <span className={styles.stepIcon}>
                          {getStepIcon(status)}
                        </span>
                        {label}
                      </NavLink>
                    );
                  })}
                </nav>

                <div className={styles.logoutWrap}>
                  <button
                    onClick={async () => {
                      const { recordLogout } = await import(
                        "../core/auth/authAudit"
                      );
                      const { getAuthActions } = await import(
                        "../core/auth/authAdapter"
                      );
                      await recordLogout();
                      await getAuthActions().signOut();
                      navigate("/app/auth");
                    }}
                    className={`${styles.logoutButton} hover:bg-red-50 dark:hover:bg-red-900/20`}
                  >
                    <span className={styles.stepIcon}>🚪</span>
                    Sair
                  </button>
                </div>

                {/* Gate banner */}
                {gates.ok === false && (
                  <div className={`banner warn ${styles.bannerGate}`}>
                    <div className="bannerTitle">💳 Assinatura Pendente</div>
                    <div className="bannerText">
                      {gates.message ||
                        "Ativa o ChefIApp Pro para publicares a tua página."}{" "}
                      <NavLink
                        to="/app/setup/billing"
                        className={styles.gateLink}
                      >
                        Ativar agora
                      </NavLink>
                    </div>
                  </div>
                )}

                {gates.ok === true && (
                  <div className={`banner ok ${styles.bannerGate}`}>
                    <div className="bannerTitle">✓ Plano Ativo</div>
                    <div className="bannerText">
                      ChefIApp Pro • {profile?.web_level || "FULL"}
                    </div>
                  </div>
                )}

                {/* TPV Ready link */}
                {steps.published && gates.ok && (
                  <button
                    className={`btn primary ${styles.fullWidthButton}`}
                    onClick={() => navigate("/app/tpv-ready")}
                  >
                    Ver TPV
                  </button>
                )}
              </aside>

              {/* Main content (wizard step) */}
              <main className={`card ${styles.cardReset}`}>
                <Outlet />
              </main>
            </div>
          </div>

          <GlobalFooter />

          <style>{`
              @media (max-width: 980px) {
                .steps {
                  overflow-x: auto;
                  flex-wrap: nowrap;
                  padding-bottom: 4px;
                }
              }
              @media (max-width: 900px) {
                .setupGrid { grid-template-columns: 1fr !important; }
                .card { border-radius: 14px; }
                .iframeWrap iframe { height: 220px !important; }
              }
            `}</style>
        </div>
      </OSFrame>
    </OnboardingContext.Provider>
  );
}

/**
 * GhostPreviewWrapper — renderiza GhostPreview ou iframe real
 * Lógica: antes publicar → ghost, depois publicar + health ok → cross-fade para iframe
 */
function GhostPreviewWrapper(props: {
  steps: { published: boolean };
  health: "unknown" | "ok" | "offline";
  publicUrl: string;
}) {
  const { steps, health, publicUrl } = props;
  const ghostProps = useGhostPreviewProps();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const showIframe = steps.published && health === "ok";

  // Derivar estado de preview (ghost ou live baseado em iframe loaded)
  const previewState = showIframe && iframeLoaded ? "live" : "ghost";

  return (
    <div className={styles.previewContainer}>
      {/* Ghost — sempre presente, fade out quando iframe carrega */}
      <div
        className={`${styles.previewGhost} ${
          previewState === "live" ? styles.previewHidden : styles.previewVisible
        }`}
      >
        <GhostPreview {...ghostProps} />
      </div>

      {/* Iframe — monta quando publicado + backend ok, fade in onLoad */}
      {showIframe && (
        <iframe
          key={publicUrl}
          src={publicUrl}
          title="Preview"
          className={`${styles.previewIframe} ${
            previewState === "live"
              ? styles.previewVisible
              : styles.previewHidden
          }`}
          onLoad={() => setIframeLoaded(true)}
        />
      )}
    </div>
  );
}
