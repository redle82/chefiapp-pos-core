/**
 * APP.TSX — RESET CONTROLADO
 *
 * Esta é a versão limpa após remoção total de UI/UX legada.
 */

import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { DevBuildBanner } from "./components/DevBuildBanner";
import {
  GlobalUIStateProvider,
  useGlobalUIState,
} from "./context/GlobalUIStateContext";
import { RestaurantRuntimeProvider } from "./context/RestaurantRuntimeContext";
import { AuthProvider } from "./core/auth/AuthProvider";
import { useAuth } from "./core/auth/useAuth";
import { FlowGate } from "./core/flow/FlowGate";
import { usePWAStaffHomeToTPVRedirect } from "./core/operational/PWAOpenToTPVRedirect";
import { RoleProvider } from "./core/roles";
import { ShiftProvider } from "./core/shift/ShiftContext";
import { ShiftGuard } from "./core/shift/ShiftGuard";
import { EventMonitorBootstrap } from "./core/tasks/EventMonitorBootstrap";
import { TenantProvider } from "./core/tenant/TenantContext";
import { MarketingRoutesFragment } from "./routes/MarketingRoutes";
import { OperationalRoutesFragment } from "./routes/OperationalRoutes";
import { OfflineIndicator } from "./ui/OfflineIndicator";
import { BillingBanner } from "./ui/billing/BillingBanner";
import { BillingBlockedView } from "./ui/billing/BillingBlockedView";
import { CoreUnavailableBanner } from "./ui/design-system/CoreUnavailableBanner";
import { ErrorBoundary } from "./ui/design-system/ErrorBoundary";
import { ModeIndicator } from "./ui/design-system/ModeIndicator";
import { GlobalBlockedView } from "./ui/design-system/components/GlobalBlockedView";

/** Self-service signup: when session is set and signup intent exists, redirect to setup (email + phone flow). */
function SignupIntentRedirect() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !session) return;
    try {
      if (sessionStorage.getItem("chefiapp_signup_intent") !== "1") return;
      const pathname = location.pathname;
      if (
        pathname === "/welcome" ||
        pathname === "/onboarding" ||
        pathname === "/app/activation" ||
        pathname === "/setup/restaurant-minimal" ||
        pathname === "/bootstrap"
      )
        return;
      sessionStorage.removeItem("chefiapp_signup_intent");
      navigate("/welcome", { replace: true });
    } catch {
      // ignore
    }
  }, [session, loading, location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <ErrorBoundary context="Root">
      <AuthProvider>
        <DevBuildBanner />
        <SignupIntentRedirect />
        <CookieConsentBanner />
        {/* <PublicLifecycleSync /> */}
        {/* PR-A: BillingsPreloader removed from global scope.
         * ModeIndicator + CoreUnavailableBanner moved inside AppContentWithBilling
         * so marketing routes never probe Core. */}
        <Routes>
          {MarketingRoutesFragment}
          {/* App Content (Management/Operational) */}
          <Route path="/*" element={<AppOperationalWrapper />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

/**
 * APPLICATION_BOOT_CONTRACT: MANAGEMENT/OPERATIONAL — Full Core provider tree.
 * PR-A: Providers moved here from main_debug.tsx so marketing routes stay clean.
 * Provider order: RestaurantRuntime → Shift → GlobalUIState → Role → Tenant → FlowGate
 */
function AppOperationalWrapper() {
  return (
    <RestaurantRuntimeProvider>
      <ShiftProvider>
        <GlobalUIStateProvider>
          <RoleProvider>
            <TenantProvider>
              <FlowGate>
                <ShiftGuard>
                  <AppContentWithBilling />
                </ShiftGuard>
              </FlowGate>
            </TenantProvider>
          </RoleProvider>
        </GlobalUIStateProvider>
      </ShiftProvider>
    </RestaurantRuntimeProvider>
  );
}

const LAST_ROUTE_KEY = "chefiapp_lastRoute";
const LAST_ROUTE_ALLOWED = [
  "/dashboard",
  "/app/dashboard",
  "/admin/config",
  "/op/tpv",
  "/op/kds",
  "/op/cash",
];
const CRITICAL_BILLING_ROUTES = ["/op/tpv", "/op/kds", "/op/cash"];

function AppContentWithBilling() {
  const { isBillingBlocked, billingStatus, isTrialExpired } =
    useGlobalUIState();
  const location = useLocation();

  usePWAStaffHomeToTPVRedirect();

  useEffect(() => {
    const path = location.pathname;
    if (LAST_ROUTE_ALLOWED.includes(path)) {
      try {
        sessionStorage.setItem(LAST_ROUTE_KEY, path);
      } catch {
        // ignore
      }
    }
  }, [location.pathname]);

  const isBillingManagement = location.pathname.startsWith("/app/billing");

  if (isTrialExpired && !isBillingManagement) {
    return (
      <GlobalBlockedView
        title="Período de trial terminado"
        description="O teu período de trial terminou. Ativa o plano para continuar a usar o ChefIApp."
        action={{ label: "Escolher plano", to: "/app/billing" }}
      />
    );
  }

  if (isBillingBlocked && !isBillingManagement) {
    return <BillingBlockedView />;
  }

  if (
    billingStatus === "past_due" &&
    CRITICAL_BILLING_ROUTES.includes(location.pathname) &&
    !isBillingManagement
  ) {
    return (
      <GlobalBlockedView
        title="Pagamento pendente"
        description="Regularize a faturação para continuar a usar o TPV e o KDS."
        action={{ label: "Ir à Faturação", to: "/app/billing" }}
      />
    );
  }

  const isDashboard =
    location.pathname === "/dashboard" ||
    location.pathname === "/app/dashboard";
  const isOperationalSurface =
    location.pathname.startsWith("/op/tpv") ||
    location.pathname.startsWith("/op/kds");
  const isStaffLauncher =
    location.pathname === "/app/staff/home" ||
    location.pathname.startsWith("/app/staff/home/");
  const isStaffMore = location.pathname.startsWith("/app/staff/profile");
  const shouldShowBillingBanner = isStaffLauncher || isStaffMore;
  return (
    <>
      <EventMonitorBootstrap />
      <OfflineIndicator />
      {!isDashboard && !isOperationalSurface && shouldShowBillingBanner && (
        <BillingBanner />
      )}
      <ModeIndicator />
      <CoreUnavailableBanner />
      <Routes>{OperationalRoutesFragment}</Routes>
    </>
  );
}

export default App;
