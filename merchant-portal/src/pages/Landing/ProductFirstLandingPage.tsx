/**
 * ProductFirstLandingPage — Landing = produto (Last.app style)
 *
 * "/" mostra o TPV real (modo demo) com overlay dismissível.
 * Overlay: logo, frase curta, preço, CTA "Começar agora" → /auth, "Explorar primeiro" → esconde overlay.
 * Quando overlay escondido: barra "Modo Demonstração" + TPV (como TPVDemoPage).
 */

import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import type { RestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { deriveLifecycle } from "../../core/lifecycle/Lifecycle";
import { ShiftProvider } from "../../core/shift/ShiftContext";
import { GlobalUIStateProvider } from "../../context/GlobalUIStateContext";
import { OperationalFullscreenWrapper } from "../../components/operational/OperationalFullscreenWrapper";
import { TPVMinimal } from "../TPVMinimal/TPVMinimal";
import { OSCopy } from "../../ui/design-system/sovereign/OSCopy";

const DEMO_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

const demoRuntime: RestaurantRuntime = {
  restaurant_id: DEMO_RESTAURANT_ID,
  mode: "onboarding",
  productMode: "demo",
  installed_modules: [],
  active_modules: [],
  plan: "basic",
  status: "onboarding",
  billing_status: "trial",
  capabilities: {},
  setup_status: {},
  isPublished: false,
  lifecycle: deriveLifecycle(DEMO_RESTAURANT_ID, false, false),
  loading: false,
  error: null,
  coreReachable: false,
};

const demoContextValue = {
  runtime: demoRuntime,
  refresh: async () => {},
  updateSetupStatus: async () => {},
  publishRestaurant: async () => {},
  installModule: async () => {},
  setProductMode: () => {},
};

export function ProductFirstLandingPage() {
  const navigate = useNavigate();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const value = useMemo(() => demoContextValue, []);

  return (
    <RestaurantRuntimeContext.Provider value={value}>
      <ShiftProvider>
        <GlobalUIStateProvider>
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#0a0a0a",
              color: "#fafafa",
            }}
          >
            {/* Barra Modo Demonstração (igual TPVDemoPage) */}
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
                {OSCopy.demo.modoDemonstracao}
              </span>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
                  {OSCopy.demo.ctaComecarAgoraTrial}
                </Link>
                <Link
                  to="/auth"
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#e2e8f0",
                    backgroundColor: "transparent",
                    border: "1px solid #475569",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  {OSCopy.demo.criarContaOperar}
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

              {/* Overlay dismissível: Começar agora → /auth, Explorar primeiro → esconde overlay */}
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
                      src="/Logo Chefiapp.png"
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                        {OSCopy.landing.ctaComecarAgora}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverlayVisible(false)}
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
                        {OSCopy.landing.ctaExplorarPrimeiro}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlobalUIStateProvider>
      </ShiftProvider>
    </RestaurantRuntimeContext.Provider>
  );
}
