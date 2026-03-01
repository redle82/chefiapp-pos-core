import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { BootFallbackScreen } from "../boot/BootFallbackScreen";
import { shouldNavigateToDecision } from "../boot/runtime/BootRuntimeEngine";
import { useBootPipeline } from "../boot/useBootPipeline";
import { LaunchContextProvider } from "../runtime/LaunchContextContext";

export function FlowGate({ children }: { children: ReactNode }) {
  const { isError, isBooting, snapshot, reset, launchContext } =
    useBootPipeline();
  const navigate = useNavigate();
  const location = useLocation();
  const decisionType = snapshot?.decision?.type;
  const decisionTo = snapshot?.decision?.to;

  useEffect(() => {
    const nextDecision = snapshot?.decision;
    if (
      !shouldNavigateToDecision(
        nextDecision,
        location.pathname,
        location.search,
      )
    )
      return;
    navigate(nextDecision.to, { replace: true });
  }, [decisionType, decisionTo, location.pathname, location.search, navigate]);

  if (isError) {
    return (
      <BootFallbackScreen
        snapshot={snapshot}
        onRetry={() => {
          reset();
        }}
        onSignOut={() => {
          try {
            sessionStorage.clear();
            localStorage.removeItem("chefiapp_restaurant_id");
            localStorage.removeItem("chefiapp_active_tenant");
            localStorage.removeItem("chefiapp_tenant_status");
          } catch {
            // ignore storage errors
          }
          window.location.href = "/auth/phone";
        }}
      />
    );
  }

  if (isBooting) {
    return <GlobalLoadingView message="Verificando acesso..." />;
  }

  const decision = snapshot?.decision;

  if (!decision) {
    return <>{children}</>;
  }

  if (decision.type === "ALLOW") {
    return (
      <LaunchContextProvider value={launchContext}>
        {children}
      </LaunchContextProvider>
    );
  }
  return <>{children}</>;
}
