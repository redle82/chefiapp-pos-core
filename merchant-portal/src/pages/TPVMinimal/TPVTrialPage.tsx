/**
 * TPVTrialPage — TPV em Free Trial com Demo Guide ativo
 *
 * Acessível por /op/tpv?mode=trial.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { OperationalFullscreenWrapper } from "../../components/operational/OperationalFullscreenWrapper";
import type { RestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import { deriveLifecycle } from "../../core/lifecycle/Lifecycle";
import { TRIAL_RESTAURANT_ID } from "../../core/readiness/operationalRestaurant";
import { OSCopy } from "../../ui/design-system/sovereign/OSCopy";
import { TPVMinimal } from "./TPVMinimal";

export function TPVTrialPage() {
  const value = useMemo(() => {
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

    return {
      runtime: trialRuntime,
      refresh: async () => {},
      updateSetupStatus: async () => {},
      publishRestaurant: async () => {},
      installModule: async () => {},
      setProductMode: () => {},
    };
  }, []);

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
              {OSCopy.trialGuide.backToLanding}
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <OperationalFullscreenWrapper>
            <TPVMinimal />
          </OperationalFullscreenWrapper>
        </div>
      </div>
    </RestaurantRuntimeContext.Provider>
  );
}
