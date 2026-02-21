/**
 * ProductFirstLandingPage — Landing = produto (Last.app style)
 *
 * LEGACY: não utilizar em novas rotas. Mantido apenas por compatibilidade temporária.
 * Entrada específica para /app/trial-tpv (demo guiada do TPV trial).
 *
 * Histórico: originalmente pensada como landing principal de produto; hoje
 * LandingV2Page e a landing Next.js externa são as fontes oficiais.
 */
// @ts-nocheck


import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OperationalFullscreenWrapper } from "../../components/operational/OperationalFullscreenWrapper";
import type { RestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import { deriveLifecycle } from "../../core/lifecycle/Lifecycle";
import { TRIAL_RESTAURANT_ID } from "../../core/readiness/operationalRestaurant";
import { OSCopy } from "../../ui/design-system/sovereign/OSCopy";
import { TPVMinimal } from "../TPVMinimal/TPVMinimal";

const trialRuntime: RestaurantRuntime = {
  restaurant_id: TRIAL_RESTAURANT_ID,
  mode: "onboarding",
  productMode: "trial",
  dataMode: "trial",
  installed_modules: [],
  active_modules: [],
  plan: "basic",
  status: "onboarding",
  billing_status: "trial",
  capabilities: {},
  setup_status: {},
  isPublished: false,
  lifecycle: deriveLifecycle(TRIAL_RESTAURANT_ID, false, false),
  loading: false,
  error: null,
  coreReachable: true,
  systemState: "TRIAL",
  coreMode: "online",
};

const trialContextValue = {
  runtime: trialRuntime,
  refresh: async () => {},
  updateSetupStatus: async () => {},
  publishRestaurant: async () => {},
  installModule: async () => {},
  setProductMode: () => {},
};

export function ProductFirstLandingPage() {
  const navigate = useNavigate();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const value = useMemo(() => trialContextValue, []);

  return (
    <RestaurantRuntimeContext.Provider value={value}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        {/* Barra Free Trial */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(102, 126, 234, 0.15)",
            borderBottom: "1px solid rgba(102, 126, 234, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#818cf8",
            }}
          >
            {OSCopy.trialGuide.badgeActive}
          </span>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              to="/"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#a3a3a3",
                textDecoration: "none",
              }}
            >
              Página inicial →
            </Link>
            <Link
              to="/auth?mode=signup"
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "#0a0a0a",
                backgroundColor: "#eab308",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {OSCopy.trialGuide.createAccountOperate}
            </Link>
          </div>
        </div>

        {/* TPV fullscreen */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <OperationalFullscreenWrapper>
            <TPVMinimal />
          </OperationalFullscreenWrapper>

          {/* Overlay dismissível */}
          {overlayVisible && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  maxWidth: 420,
                  padding: 32,
                  textAlign: "center",
                  backgroundColor: "rgba(26,26,26,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                }}
              >
                <img
                  src="/logo-chefiapp-clean.png"
                  alt="ChefIApp"
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "contain",
                    marginBottom: 16,
                  }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#fafafa",
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {OSCopy.landing.heroTitle} {OSCopy.landing.heroSubtitle}
                </h1>
                <p
                  style={{
                    fontSize: 15,
                    color: "#a3a3a3",
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}
                >
                  {OSCopy.landing.heroDescription}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#eab308",
                    marginBottom: 24,
                  }}
                >
                  {OSCopy.landing.overlayPrice}
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    style={{
                      padding: "14px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#0a0a0a",
                      backgroundColor: "#eab308",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    {OSCopy.trialGuide.exploreSystem}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    style={{
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#a3a3a3",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    {OSCopy.landing.ctaComecarAgora}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlayVisible(false)}
                    style={{
                      padding: "10px 24px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#737373",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    {OSCopy.landing.ctaExplorarPrimeiro}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RestaurantRuntimeContext.Provider>
  );
}
