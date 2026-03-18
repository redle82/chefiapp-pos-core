/**
 * APP.TSX — RESET CONTROLADO
 *
 * Esta é a versão limpa após remoção total de UI/UX legada.
 */

import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import {
  GlobalUIStateProvider,
  useGlobalUIState,
} from "./context/GlobalUIStateContext";
import type {
  ProductMode,
  RestaurantRuntime,
} from "./context/RestaurantRuntimeContext";
import { RestaurantRuntimeContext } from "./context/RestaurantRuntimeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./core/auth/AuthProvider";
import { useAuth } from "./core/auth/useAuth";
import { FlowGate } from "./core/flow/FlowGate";
import { deriveLifecycle } from "./core/lifecycle/Lifecycle";
import { usePWAStaffHomeToTPVRedirect } from "./core/operational/PWAOpenToTPVRedirect";
import { TRIAL_RESTAURANT_ID } from "./core/readiness/operationalRestaurant";
import { isTrialModeParam } from "./core/routing/TrialMode";
import { ShiftContext } from "./core/shift/ShiftContext";
import { ShiftGuard } from "./core/shift/ShiftGuard";
import { SyncEngine } from "./core/sync/SyncEngine";
import { EventMonitorBootstrap } from "./core/tasks/EventMonitorBootstrap";
import { TPVTrialPage } from "./pages/TPVMinimal/TPVTrialPage";
import { MarketingRoutesFragment } from "./routes/MarketingRoutes";
import { OperationalRoutesFragment } from "./routes/OperationalRoutes";
import { OfflineIndicator } from "./ui/OfflineIndicator";
import { BillingBanner } from "./ui/billing/BillingBanner";
import { BillingBlockedView } from "./ui/billing/BillingBlockedView";
import { CoreUnavailableBanner } from "./ui/design-system/CoreUnavailableBanner";
import { ErrorBoundary } from "./ui/design-system/ErrorBoundary";
import { ModeIndicator } from "./ui/design-system/ModeIndicator";
import { GlobalBlockedView } from "./ui/design-system/components/GlobalBlockedView";
import { LoadingState } from "./ui/design-system/components/LoadingState";

/** NAVIGATION_OPERATIONAL_CONTRACT: quando mode=trial, TPV sem RequireOperational; senão app normal. */
function TPVRouteHandler() {
  const [searchParams] = useSearchParams();
  if (isTrialModeParam(searchParams)) {
    return <TPVTrialPage />;
  }
  return <AppOperationalWrapper />;
}

// =============================================================================
// PUBLIC TREE (SEM AUTH) — providers mínimos para / e /op/tpv?mode=trial
// =============================================================================

function PublicProviders({ children }: { children: ReactNode }) {
  const trialRuntimeContextValue = useMemo(() => {
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
      setProductMode: (_mode: ProductMode) => {},
    };
  }, []);

  const trialShiftValue = useMemo(
    () => ({
      isShiftOpen: true,
      isChecking: false,
      lastCheckedAt: new Date(),
      refreshShiftStatus: async () => {},
      markShiftOpen: () => {},
    }),
    [],
  );

  return (
    <RestaurantRuntimeContext.Provider value={trialRuntimeContextValue}>
      <ShiftContext.Provider value={trialShiftValue}>
        <GlobalUIStateProvider>{children}</GlobalUIStateProvider>
      </ShiftContext.Provider>
    </RestaurantRuntimeContext.Provider>
  );
}

/** /op/tpv: se mode=trial → TPV trial (árvore pública); senão → redirect /auth (árvore de app). */
function TPVTrialGate() {
  const [searchParams] = useSearchParams();
  if (isTrialModeParam(searchParams)) {
    return (
      <PublicProviders>
        <TPVTrialPage />
      </PublicProviders>
    );
  }
  return <Navigate to="/auth" replace />;
}

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

/** DoD B4: Sincroniza tags Sentry (route, connectivity) para filtros. */
function SentryTagsSync() {
  const location = useLocation();
  useEffect(() => {
    const S = typeof window !== "undefined" ? (window as any).Sentry : null;
    if (S?.setTag) {
      S.setTag("route", location.pathname || "/");
    }
  }, [location.pathname]);
  useEffect(() => {
    const S = typeof window !== "undefined" ? (window as any).Sentry : null;
    if (!S?.setTag) return;
    const unsub = SyncEngine.subscribe(() => {
      S.setTag("connectivity", SyncEngine.getConnectivity());
    });
    S.setTag("connectivity", SyncEngine.getConnectivity());
    return unsub;
  }, []);
  return null;
}

function App() {
  return (
    <ToastProvider>
      <ErrorBoundary context="Root">
        <AuthProvider>
          <SentryTagsSync />
          <SignupIntentRedirect />
          <CookieConsentBanner />
          {/* <PublicLifecycleSync /> */}
          <BillingsPreloader />
          <Suspense fallback={<LoadingState variant="spinner" />}>
            <Routes>
              {MarketingRoutesFragment}
              {/* App Content (Management/Operational) */}
              <Route path="/*" element={<AppOperationalWrapper />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

function BillingsPreloader() {
  // Se precisarmos pré-carregar algo globalmente
  return (
    <>
      <ModeIndicator />
      <CoreUnavailableBanner />
    </>
  );
}

/** APPLICATION_BOOT_CONTRACT: MANAGEMENT/OPERATIONAL — Apenas Guards para rotas que precisam de Core. */
function AppOperationalWrapper() {
  return (
    <FlowGate>
      <ShiftGuard>
        <AppContentWithBilling />
      </ShiftGuard>
    </FlowGate>
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
  const isPublicPage = location.pathname.startsWith("/public");

  if (isTrialExpired && !isBillingManagement && !isPublicPage) {
    return (
      <GlobalBlockedView
        title="Período de trial terminado"
        description="O teu período de trial terminou. Ativa o plano para continuar a usar o ChefIApp."
        action={{ label: "Escolher plano", to: "/app/billing" }}
      />
    );
  }

  if (isBillingBlocked && !isBillingManagement && !isPublicPage) {
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
  // AppStaff is an operational surface — billing banner never shown here.
  // Billing management lives in /admin, not in the operational terminal.
  const isStaffPath = location.pathname.startsWith("/app/staff");
  const shouldShowBillingBanner = !isStaffPath;
  return (
    <>
      <EventMonitorBootstrap />
      <OfflineIndicator />
      {!isDashboard && !isOperationalSurface && shouldShowBillingBanner && (
        <BillingBanner />
      )}
      <ModeIndicator />
      <CoreUnavailableBanner />
      <Suspense fallback={<LoadingState variant="minimal" />}>
        <Routes>{OperationalRoutesFragment}</Routes>
      </Suspense>
    </>
  );
}

export default App;
