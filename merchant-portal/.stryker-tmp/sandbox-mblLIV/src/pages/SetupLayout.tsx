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
      (getTabIsolated("chefiapp_name") && getTabIsolated("chefiapp_slug"))
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
    status: "completed" | "current" | "blocked" | "pending"
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
    Math.min(100, Math.round((completedCount / 5) * 100))
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
        <div
          style={{
            color: "#f5f5f7",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <header
            style={{
              padding: "16px 20px 16px 60px", // Extra left padding for OSFrame Logic
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Sovereign Signature handled by OSFrame */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: 0.6,
                  paddingLeft: 0,
                }}
              >
                Setup • Passo {activeStep} de 5
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                padding: "8px 12px",
              }}
            >
              {progressPct}% concluído
            </span>
          </header>
          <div
            style={{
              padding: "16px 20px 24px",
              paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
            }}
          >
            <div
              style={{
                maxWidth: 980,
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: 18,
                alignItems: "start",
              }}
              className="setupGrid"
            >
              {/* Sidebar / Progresso + Preview (fica visível no mobile) */}
              <aside style={{ display: "grid", gap: 12 }}>
                <div className="card" style={{ margin: 0 }}>
                  {!hasIdentity ? (
                    <>
                      <div className="h3" style={{ marginBottom: 6 }}>
                        Vamos começar
                      </div>
                      <div className="muted">
                        Cria a identidade do teu restaurante e vê a tua página
                        ganhar vida.
                      </div>
                      <div
                        className="banner neutral"
                        style={{ marginTop: 12, padding: 10 }}
                      >
                        <div className="bannerText">
                          A pré-visualização aparecerá aqui após criares a
                          identidade.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h3" style={{ marginBottom: 6 }}>
                        A construir
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {restaurantName}
                      </div>

                      {steps.published && publicUrl && (
                        <div className="muted" style={{ marginTop: 6 }}>
                          URL: <code>{publicUrl}</code>
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
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
                          className="banner neutral"
                          style={{ marginTop: 10, padding: 10 }}
                        >
                          <div className="bannerText">
                            A pré-visualização da tua página aparecerá aqui
                            quando publicares.
                          </div>
                        </div>
                      )}

                      {steps.published && (
                        <div style={{ marginTop: 10 }}>
                          {health === "ok" ? (
                            <div
                              className="banner ok"
                              style={{ marginTop: 0, padding: 10 }}
                            >
                              <div className="bannerText">
                                ✓ Servidor ligado • preview disponível
                              </div>
                            </div>
                          ) : health === "offline" ? (
                            <div
                              className="banner neutral"
                              style={{ marginTop: 0, padding: 10 }}
                            >
                              <div className="bannerText">
                                Liga o servidor para veres a pré-visualização em
                                tempo real.
                              </div>
                            </div>
                          ) : (
                            <div
                              className="banner neutral"
                              style={{ marginTop: 0, padding: 10 }}
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

                <nav
                  className="steps"
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
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
                          `step ${status}` + (isCurrent ? " current" : "")
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 12px",
                          textDecoration: "none",
                          color: "inherit",
                          cursor: isBlocked ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ width: 18, textAlign: "center" }}>
                          {getStepIcon(status)}
                        </span>
                        {label}
                      </NavLink>
                    );
                  })}
                </nav>

                <div style={{ marginTop: "auto", paddingTop: 20 }}>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      width: "100%",
                      background: "none",
                      border: "none",
                      color: "var(--color-os-red)",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                    className="hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span style={{ width: 18, textAlign: "center" }}>🚪</span>
                    Sair
                  </button>
                </div>

                {/* Gate banner */}
                {gates.ok === false && (
                  <div
                    className="banner warn"
                    style={{ marginTop: 0, padding: 12 }}
                  >
                    <div className="bannerTitle">💳 Assinatura Pendente</div>
                    <div className="bannerText">
                      {gates.message ||
                        "Ativa o ChefIApp Pro para publicares a tua página."}{" "}
                      <NavLink
                        to="/app/setup/billing"
                        style={{ textDecoration: "underline", fontWeight: 700 }}
                      >
                        Ativar agora
                      </NavLink>
                    </div>
                  </div>
                )}

                {gates.ok === true && (
                  <div
                    className="banner ok"
                    style={{ marginTop: 0, padding: 12 }}
                  >
                    <div className="bannerTitle">✓ Plano Ativo</div>
                    <div className="bannerText">
                      ChefIApp Pro • {profile?.web_level || "FULL"}
                    </div>
                  </div>
                )}

                {/* TPV Ready link */}
                {steps.published && gates.ok && (
                  <button
                    className="btn primary"
                    onClick={() => navigate("/app/tpv-ready")}
                    style={{ width: "100%" }}
                  >
                    Ver TPV
                  </button>
                )}
              </aside>

              {/* Main content (wizard step) */}
              <main className="card" style={{ margin: 0 }}>
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
    <div style={{ position: "relative", height: 240, marginTop: 12 }}>
      {/* Ghost — sempre presente, fade out quando iframe carrega */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: previewState === "live" ? 0 : 1,
          transition: "opacity 260ms ease",
          pointerEvents: previewState === "live" ? "none" : "auto",
        }}
      >
        <GhostPreview {...ghostProps} />
      </div>

      {/* Iframe — monta quando publicado + backend ok, fade in onLoad */}
      {showIframe && (
        <iframe
          key={publicUrl}
          src={publicUrl}
          title="Preview"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            borderRadius: 8,
            border: 0,
            background: "#fff",
            opacity: previewState === "live" ? 1 : 0,
            transition: "opacity 260ms ease",
          }}
          onLoad={() => setIframeLoaded(true)}
        />
      )}
    </div>
  );
}
