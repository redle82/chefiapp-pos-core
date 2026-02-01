/**
 * TPVDemoPage — TPV em modo demonstração (NAVIGATION_OPERATIONAL_CONTRACT Estado 3)
 *
 * Acessível apenas por /op/tpv?mode=demo (a partir de /demo). Sem RequireOperational.
 * Banner "Modo Demonstração"; dados fake; botões "Voltar à demonstração" → /demo e "Criar conta e operar de verdade" → /auth.
 * Nunca link para landing.
 */

import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import type { RestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { deriveLifecycle } from "../../core/lifecycle/Lifecycle";
import { ShiftProvider } from "../../core/shift/ShiftContext";
import { GlobalUIStateProvider } from "../../context/GlobalUIStateContext";
import { OperationalFullscreenWrapper } from "../../components/operational/OperationalFullscreenWrapper";
import { TPVMinimal } from "./TPVMinimal";
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

export function TPVDemoPage() {
  const navigate = useNavigate();
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
                <button
                  type="button"
                  onClick={() => navigate("/demo")}
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#e2e8f0",
                    backgroundColor: "transparent",
                    border: "1px solid #475569",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  ← {OSCopy.demo.voltarDemonstracao}
                </button>
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <OperationalFullscreenWrapper>
                <TPVMinimal />
              </OperationalFullscreenWrapper>
            </div>
          </div>
        </GlobalUIStateProvider>
      </ShiftProvider>
    </RestaurantRuntimeContext.Provider>
  );
}
