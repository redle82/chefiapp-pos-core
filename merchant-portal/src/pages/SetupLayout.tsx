// Auth only — temporary until Core Auth (signOut in this layout)
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../App.css";
import { GhostPreview } from "../components/GhostPreview";
import { GlobalFooter } from "../components/GlobalFooter";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
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

  const { t } = useTranslation("common");
  const navItems: { to: string; labelKey: string; step: 1 | 2 | 3 | 4 | 5 }[] = [
    { to: "/app/setup/identity", labelKey: "setup.navIdentity", step: 1 },
    { to: "/app/setup/menu", labelKey: "setup.navMenu", step: 2 },
    { to: "/app/setup/payments", labelKey: "setup.navPayments", step: 3 },
    { to: "/app/setup/design", labelKey: "setup.navDesign", step: 4 },
    { to: "/app/setup/staff", labelKey: "setup.navTeam", step: 4 },
    { to: "/app/setup/billing", labelKey: "setup.navSubscription", step: 4 },
    { to: "/app/setup/publish", labelKey: "setup.navPublish", step: 5 },
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
    ? profile?.name || getTabIsolated("chefiapp_name") || t("common:setup.defaultRestaurantName")
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
              <div className={styles.setupStep}>
                {t("common:setup.stepOf", { current: activeStep })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className={styles.progressBadge}>
                {progressPct}{t("common:setup.percentDone")}
              </span>
              <LocaleSwitcher />
            </div>
          </header>
          <div className={styles.contentWrap}>
            <div className={`setupGrid ${styles.grid}`}>
              {/* Sidebar / Progresso + Preview (fica visível no mobile) */}
              <aside className={styles.sidebar}>
                <div className={`card ${styles.cardReset}`}>
                  {!hasIdentity ? (
                    <>
                      <div className={`h3 ${styles.titleSpacing}`}>
                        {t("common:setup.letsStart")}
                      </div>
                      <div className="muted">
                        {t("common:setup.letsStartDesc")}
                      </div>
                      <div className={`banner neutral ${styles.bannerCompact}`}>
                        <div className="bannerText">
                          {t("common:setup.previewPlaceholder")}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`h3 ${styles.titleSpacing}`}>
                        {t("common:setup.building")}
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
                          {loading ? t("common:setup.loading") : t("common:setup.refresh")}
                        </button>
                      </div>

                      {!steps.published && (
                        <div
                          className={`banner neutral ${styles.bannerCompact}`}
                        >
                          <div className="bannerText">
                            {t("common:setup.previewAfterPublish")}
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
                                {t("common:setup.serverOk")}
                              </div>
                            </div>
                          ) : health === "offline" ? (
                            <div
                              className={`banner neutral ${styles.bannerCompactNoTop}`}
                            >
                              <div className="bannerText">
                                {t("common:setup.serverOffline")}
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`banner neutral ${styles.bannerCompactNoTop}`}
                            >
                              <div className="bannerText">
                                {t("common:setup.checkingServer")}
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
                  {navItems.map(({ to, labelKey, step }) => {
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
                        {t(`common:${labelKey}`)}
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
                    {t("common:setup.logout")}
                  </button>
                </div>

                {/* Gate banner */}
                {gates.ok === false && (
                  <div className={`banner warn ${styles.bannerGate}`}>
                    <div className="bannerTitle">{t("common:setup.subscriptionPending")}</div>
                    <div className="bannerText">
                      {gates.message || t("common:setup.activateToPublish")}{" "}
                      <NavLink
                        to="/app/setup/billing"
                        className={styles.gateLink}
                      >
                        {t("common:setup.activateNow")}
                      </NavLink>
                    </div>
                  </div>
                )}

                {gates.ok === true && (
                  <div className={`banner ok ${styles.bannerGate}`}>
                    <div className="bannerTitle">{t("common:setup.planActive")}</div>
                    <div className="bannerText">
                      {t("common:setup.planActiveDesc", { level: profile?.web_level || "FULL" })}
                    </div>
                  </div>
                )}

                {steps.published && gates.ok && (
                  <button
                    className={`btn primary ${styles.fullWidthButton}`}
                    onClick={() => navigate("/app/tpv-ready")}
                  >
                    {t("common:setup.seeTPV")}
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
