import React, { Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';

// Pages
import { ActivationPage } from './pages/Activation/ActivationPage';
import { SystemStatusPage } from './pages/Audit/SystemStatusPage';
import { AuthPage } from './pages/AuthPage';
import { BootstrapPage } from './pages/BootstrapPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { DebugTPV } from './pages/DebugTPV';
import { HealthCheckPage } from './pages/HealthCheckPage';
import { LandingPage } from './pages/Landing/LandingPage';
import { AdvancedSetupPage } from './pages/Onboarding/AdvancedSetupPage';
import BillingStep from './pages/Onboarding/BillingStep';
import CheckoutStep from './pages/Onboarding/CheckoutStep';
import FirstSaleGuide from './pages/Onboarding/FirstSaleGuide';
import MenuDemo from './pages/Onboarding/MenuDemo';
import OnboardingWizard, { ScreenInviteCode } from './pages/Onboarding/OnboardingWizard';
import TrialStart from './pages/Onboarding/TrialStart';
import { MigrationWizard } from './pages/Onboarding/migration/MigrationWizardContainer';
import PublicPages from './pages/Public/PublicOrderingPage';
import { AccessDeniedPage, SelectTenantPage } from './pages/Tenant';
import { WizardPage } from './pages/WizardPage';

// Content Hub
import { MenuBootstrapPage } from './pages/Menu/Bootstrap/MenuBootstrapPage';
import { ArticlePage } from './pages/Read/ArticlePage';
import { LibraryPage } from './pages/Read/LibraryPage';
import { ReaderLayout } from './pages/Read/ReaderLayout';
import { BetaFeedbackWidget } from './ui/feedback/BetaFeedbackWidget';

// Subgroup A: TPV & Menu
// Subgroup A: TPV & Menu
const TPV = React.lazy(() => import('./pages/TPV/TPV'));
const KDS = React.lazy(() => import('./pages/TPV/KDS/KitchenDisplay'));
const KDSStandalone = React.lazy(() => import('./pages/TPV/KDS/KDSStandalone'));
const MenuManager = React.lazy(() => import('./pages/Menu/MenuManager').then(m => ({ default: m.MenuManager })));

// Subgroup B: Dashboard & Reports
const DashboardZero = React.lazy(() => import('./pages/Dashboard/DashboardZero'));
const PulseList = React.lazy(() => import('./pages/AppStaff/PulseList').then(m => ({ default: m.PulseList })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const SovereigntyDashboard = React.lazy(() => import('./pages/Settings/SovereigntyDashboard').then(m => ({ default: m.SovereigntyDashboard })));
const ConnectorSettings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.ConnectorSettings })));



const DailyClosing = React.lazy(() => import('./pages/Reports/DailyClosing').then(m => ({ default: m.DailyClosing })));
const ZReportPrint = React.lazy(() => import('./pages/Reports/ZReportPrint').then(m => ({ default: m.ZReportPrint })));
const FinanceDashboard = React.lazy(() => import('./pages/Reports/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const DeliveryMonitor = React.lazy(() => import('./modules/delivery/DeliveryMonitor').then(m => ({ default: m.DeliveryMonitor })));
const StaffPage = React.lazy(() => import('./pages/Settings/StaffPage'));
const BillingPage = React.lazy(() => import('./pages/Settings/BillingPage'));
const ProvisionRestaurantPage = React.lazy(() => import('./pages/Admin/ProvisionRestaurantPage').then(m => ({ default: m.ProvisionRestaurantPage })));


const TPVKitsPage = React.lazy(() => import('./pages/Store/TPVKitsPage').then(m => ({ default: m.TPVKitsPage })));
const EvolveHub = React.lazy(() => import('./pages/Evolve/EvolveHub').then(m => ({ default: m.EvolveHub })));
const RestaurantWebPreviewPage = React.lazy(() => import('./pages/Web/RestaurantWebPreviewPage').then(m => ({ default: m.RestaurantWebPreviewPage })));
const LocalBossPage = React.lazy(() => import('./pages/LocalBoss/LocalBossPage').then(m => ({ default: m.LocalBossPage })));
const GovernOverviewPage = React.lazy(() => import('./pages/Govern/GovernOverviewPage').then(m => ({ default: m.GovernOverviewPage })));
const GovernManageDashboard = React.lazy(() => import('./pages/GovernManage/GovernManageDashboard').then(m => ({ default: m.GovernManageDashboard })));
const ReservationsDashboard = React.lazy(() => import('./pages/Reservations/ReservationsDashboard').then(m => ({ default: m.ReservationsDashboard })));
const ReputationHubDashboard = React.lazy(() => import('./pages/ReputationHub/ReputationHubDashboard').then(m => ({ default: m.ReputationHubDashboard })));
const OperationalHubDashboard = React.lazy(() => import('./pages/OperationalHub/OperationalHubDashboard').then(m => ({ default: m.OperationalHubDashboard })));
const PortioningDashboard = React.lazy(() => import('./pages/Portioning/PortioningDashboard').then(m => ({ default: m.PortioningDashboard })));
const RestaurantGroupManager = React.lazy(() => import('./pages/MultiLocation/RestaurantGroupManager').then(m => ({ default: m.RestaurantGroupManager })));
const GroupDashboard = React.lazy(() => import('./pages/MultiLocation/GroupDashboard').then(m => ({ default: m.GroupDashboard })));
const CustomersPage = React.lazy(() => import('./pages/CRM/CustomersPage').then(m => ({ default: m.CustomersPage })));
const LoyaltyPage = React.lazy(() => import('./pages/Loyalty/LoyaltyPage').then(m => ({ default: m.LoyaltyPage })));
const PerformanceDashboard = React.lazy(() => import('./pages/Performance/PerformanceDashboard').then(m => ({ default: m.PerformanceDashboard })));
const SafetyConfig = React.lazy(() => import('./pages/Safety/SafetyConfig'));
const StrategicCalendar = React.lazy(() => import('./pages/Calendar/StrategicCalendar'));
const OrganizationDashboard = React.lazy(() => import('./pages/Organization/OrganizationDashboard').then(m => ({ default: m.OrganizationDashboard })));

// Components
import { AppLayout } from './components/Layout/AppLayout';
import { ThemeEngine } from './components/theme/ThemeEngine';
import { RequireActivation } from './core/activation';
import { FlowGate } from './core/flow/FlowGate';
import { OperationGate } from './core/flow/OperationGate'; // Opus 6.0
import { GuardTool } from './core/permissions/GuardTool';
import { SovereignBoundary } from './ui/components/SovereignBoundary';

// Pages - Operation
import { OperationStatusPage } from './pages/Operation/OperationStatusPage'; // Opus 6.0
import { SystemPausedPage } from './pages/Operation/SystemPausedPage'; // Opus 6.0
import { SystemSuspendedPage } from './pages/Operation/SystemSuspendedPage'; // Opus 6.0

// Providers
import { AppDomainWrapper } from './app/AppDomainWrapper'; // 🏛️ Gate → Domain Bridge
import { FeatureFlagProvider } from './core/flags/FeatureFlagContext';
import { SystemGuardianProvider } from './core/guardian/SystemGuardianContext';
import { TenantProvider } from './core/tenant/TenantContext'; // Added Provider
import { OnboardingProvider } from './pages/Onboarding/OnboardingState';


// 🛰️ LAZY LOADED SATELLITES
const StaffModule = React.lazy(() => import('./pages/AppStaff/StaffModule'));

import { isDevStableMode } from './core/runtime/devStableMode';
import { ErrorBoundary } from './ui/design-system/ErrorBoundary';

/**
 * E2E NAVIGATION VALIDATION CHECKLIST:
 *
 * 1. Landing → Login: Navigate to `/` → Click CTA → Google OAuth
 * 2. Auth → Onboarding: New user → `/onboarding/identity`
 * 3. Onboarding → Dashboard: Complete wizard → `/app/dashboard`
 * 4. Dashboard → Tools (NEW TAB): Click TPV/KDS/Menu/Orders card → Opens in new browser tab
 * 5. Refresh Safety: Directly load `/app/tpv`, `/app/kds`, `/app/menu`, `/app/orders` → Each renders independently
 *
 * Tab Titles:
 * - /app/dashboard → "ChefIApp POS — Dashboard"
 * - /app/tpv → "ChefIApp POS — TPV"
 * - /app/kds → "ChefIApp POS — KDS"
 * - /app/menu → "ChefIApp POS — Menu"
 * - /app/orders → "ChefIApp POS — Orders"
 */
function App() {
  // ===========================================================================
  // DEV_STABLE_MODE — Entrada Única (Fase A)
  // Enquanto estivermos estabilizando, DEV deve montar APENAS /app/*
  // para evitar competição onboarding ↔ app e estados contraditórios.
  // Desligue com ?devStable=0
  // ===========================================================================
  const devStable = isDevStableMode();

  const DevStableEntryGate = () => {
    const location = useLocation();
    // FASE 2: Permitir rotas de tutorial mesmo em devStable
    const allowedOnboardingRoutes = ['/onboarding/first-sale-guide', '/onboarding/menu-demo'];
    const isAllowedRoute = allowedOnboardingRoutes.some(route => location.pathname === route);

    if (isDevStableMode() && location.pathname.startsWith('/onboarding') && !isAllowedRoute) {
      // In DEV_STABLE_MODE, onboarding is intentionally blocked.
      // Gate + Tenant selection should be tested in isolation first.
      // Exception: tutorial routes are allowed.
      return <Navigate to="/app/select-tenant" replace />;
    }

    return null;
  };

  return (
    <FeatureFlagProvider>
      <HelmetProvider>
        <SystemGuardianProvider>
          <ErrorBoundary context="AppRoot">
            {devStable ? (
              <>
                {/* DEV_STABLE_MODE: onboarding must not mount (no side effects). */}
                <DevStableEntryGate />
                <Routes>
                  {/* 1. PUBLIC */}
                  <Route path="/public/*" element={
                    <SovereignBoundary>
                      <Suspense fallback={<div>Carregando Cardápio...</div>}>
                        <PublicPages />
                      </Suspense>
                    </SovereignBoundary>
                  } />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/health" element={<HealthCheckPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  {/* 🐞 DEBUG: Manual TPV Access */}
                  <Route path="/debug-tpv" element={<DebugTPV />} />

                  {/* Legacy redirects - manter compatibilidade temporária */}
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/signup" element={<Navigate to="/auth" replace />} />
                  <Route path="/join" element={<ScreenInviteCode />} />
                  {/* DEV_STABLE_MODE: onboarding routes blocked (redirect handled by DevStableEntryGate) */}
                  <Route path="/start" element={<Navigate to="/app/select-tenant" replace />} />
                  {/* FASE 2: Permitir rotas de tutorial mesmo em devStable */}
                  <Route path="/onboarding/first-sale-guide" element={<FirstSaleGuide />} />
                  <Route path="/onboarding/menu-demo" element={<MenuDemo />} />
                  <Route path="/onboarding/*" element={<Navigate to="/app/select-tenant" replace />} />

                  <Route path="/migration/wizard" element={<MigrationWizard />} />
                  <Route path="/activation" element={
                    <OnboardingProvider>
                      <ActivationPage />
                    </OnboardingProvider>
                  } />

                  {/* 🍳 KDS STANDALONE — Cozinha Independente (Tablet/TV) */}
                  {/* ROTA: /kds/:restaurantId - Funciona sem AppLayout, sem FlowGate */}
                  <Route path="/kds/:restaurantId" element={
                    <Suspense fallback={
                      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
                          <p>Carregando KDS...</p>
                        </div>
                      </div>
                    }>
                      <KDSStandalone />
                    </Suspense>
                  } />

                  {/* AUTH GATE (Session Only) - Redundant with FlowGate but explicit for clarity */}
                  <Route path="/bootstrap" element={<BootstrapPage />} />

                  {/* CONTENT HUB (Totally different layout) */}
                  <Route path="/read" element={<ReaderLayout />}>
                    <Route index element={<LibraryPage />} />
                    <Route path=":slug" element={<ArticlePage />} />
                  </Route>

                  <Route path="/app" element={
                    <FlowGate>
                      <TenantProvider>
                        <AppDomainWrapper>
                          <RequireActivation>
                            <ThemeEngine />
                            <Outlet />
                            {/* <AppLayout /> MOVED TO SUB-ROUTE */}
                          </RequireActivation>
                        </AppDomainWrapper>
                      </TenantProvider>
                    </FlowGate>
                  }>
                    {/* 1. ADMIN PANEL (Dashboard + Management) - Uses Sidebar/Header */}
                    <Route element={
                      <>
                        <AppLayout />
                        <BetaFeedbackWidget />
                      </>
                    }>
                      {/* 🎯 /app sem subrota → Dashboard (FlowGate já validou auth) */}
                      <Route index element={<Navigate to="/app/dashboard" replace />} />

                      {/* [Phase 2] Multi-Tenant Routes */}
                      <Route path="select-tenant" element={<SelectTenantPage />} />
                      <Route path="access-denied" element={<AccessDeniedPage />} />

                      {/* [Opus 6.0] Operation Status Screens */}
                      <Route path="paused" element={<SystemPausedPage />} />
                      <Route path="suspended" element={<SystemSuspendedPage />} />
                      <Route path="operation-status" element={<OperationStatusPage />} />

                      {/* 🛡️ OPERATION GATE: Enforces active/paused/suspended state */}
                      <Route element={<OperationGate />}>
                        {/* Command Center */}
                        <Route path="dashboard" element={
                          <Suspense fallback={<div style={{ padding: 40, color: '#32d74b' }}>💿 Sincronizando Mapa Soberano...</div>}>
                            <DashboardZero />
                          </Suspense>
                        } />

                        <Route path="menu" element={
                          <GuardTool tool="menu">
                            <Suspense fallback={<div>Loading Menu...</div>}>
                              <MenuManager />
                            </Suspense>
                          </GuardTool>
                        } />
                        <Route path="menu/bootstrap" element={<MenuBootstrapPage />} />

                        {/* Settings & Reports */}
                        <Route path="settings" element={<Suspense fallback={<div>Loading Settings...</div>}><Settings /></Suspense>} />
                        <Route path="settings/billing" element={
                          <Suspense fallback={<div>Loading Billing...</div>}>
                            <BillingPage />
                          </Suspense>
                        } />
                        <Route path="settings/sovereignty" element={
                          <GuardTool tool="sovereignty">
                            <Suspense fallback={<div>Loading Sovereignty...</div>}>
                              <SovereigntyDashboard />
                            </Suspense>
                          </GuardTool>
                        } />
                        <Route path="settings/advanced-setup" element={<AdvancedSetupPage />} />
                        <Route path="settings/connectors" element={<Suspense fallback={<div>Loading...</div>}><ConnectorSettings /></Suspense>} />
                        <Route path="reports/daily-closing" element={<Suspense fallback={<div>Loading...</div>}><DailyClosing /></Suspense>} />
                        <Route path="reports/z-report/:id" element={<Suspense fallback={<div>Loading...</div>}><ZReportPrint /></Suspense>} />
                        <Route path="reports/finance" element={<Suspense fallback={<div>Loading...</div>}><FinanceDashboard /></Suspense>} />
                        <Route path="reports/delivery" element={<Suspense fallback={<div>Loading DLQ...</div>}><DeliveryMonitor /></Suspense>} />
                        <Route path="team" element={<Suspense fallback={<div>Loading...</div>}><StaffPage /></Suspense>} />
                        <Route path="store/tpv-kits" element={<Suspense fallback={<div>Loading...</div>}><TPVKitsPage /></Suspense>} />
                        <Route path="web/preview" element={<Suspense fallback={<div>Loading...</div>}><RestaurantWebPreviewPage /></Suspense>} />
                        <Route path="local-boss" element={<Suspense fallback={<div>Loading...</div>}><LocalBossPage /></Suspense>} />
                        <Route path="govern" element={<Suspense fallback={<div>Loading...</div>}><GovernOverviewPage /></Suspense>} />
                        <Route path="govern-manage" element={<Suspense fallback={<div>Loading...</div>}><GovernManageDashboard /></Suspense>} />
                        <Route path="reservations" element={<Suspense fallback={<div>Loading...</div>}><ReservationsDashboard /></Suspense>} />
                        <Route path="reputation-hub" element={<Suspense fallback={<div>Loading...</div>}><ReputationHubDashboard /></Suspense>} />
                        <Route path="operational-hub" element={<Suspense fallback={<div>Loading...</div>}><OperationalHubDashboard /></Suspense>} />
                        <Route path="portioning" element={<Suspense fallback={<div>Loading...</div>}><PortioningDashboard /></Suspense>} />
                        <Route path="performance" element={<Suspense fallback={<div>Loading...</div>}><PerformanceDashboard /></Suspense>} />
                        <Route path="multi-location" element={<Suspense fallback={<div>Loading...</div>}><RestaurantGroupManager /></Suspense>} />
                        <Route path="multi-location/:groupId/dashboard" element={<Suspense fallback={<div>Loading...</div>}><GroupDashboard /></Suspense>} />
                        <Route path="organization" element={<Suspense fallback={<div>Loading Enterprise...</div>}><OrganizationDashboard /></Suspense>} />
                        <Route path="crm" element={<Suspense fallback={<div>Loading...</div>}><CustomersPage /></Suspense>} />
                        <Route path="loyalty" element={<Suspense fallback={<div>Loading...</div>}><LoyaltyPage /></Suspense>} />
                        <Route path="audit" element={<SystemStatusPage />} />
                        <Route path="evolve" element={<Suspense fallback={<div>Loading Evolve Hub...</div>}><EvolveHub /></Suspense>} />
                        <Route path="coming-soon" element={<ComingSoonPage />} />
                      </Route>
                    </Route>

                    {/* 2. DEDICATED TOOLS (TPV, KDS, Orders) - NO AppLayout / Sidebar */}
                    {/* These run in "Fullscreen" or "App Mode" */}
                    <Route element={<OperationGate />}>
                      <Route path="tpv" element={
                        <GuardTool tool="tpv">
                          <Suspense fallback={<div>Loading TPV...</div>}>
                            <TPV />
                          </Suspense>
                        </GuardTool>
                      } />
                      <Route path="kds" element={
                        <GuardTool tool="kds">
                          <Suspense fallback={<div>Loading KDS...</div>}>
                            <KDS />
                          </Suspense>
                        </GuardTool>
                      } />
                      <Route path="orders" element={
                        <GuardTool tool="orders">
                          <Suspense fallback={<div>Loading Orders...</div>}>
                            <PulseList />
                          </Suspense>
                        </GuardTool>
                      } />
                      <Route path="staff" element={
                        <GuardTool tool="staff">
                          <ErrorBoundary context="AppStaff">
                            <Suspense fallback={<div style={{ padding: 20 }}>📡 Conectando satélite Staff...</div>}>
                              <StaffModule />
                            </Suspense>
                          </ErrorBoundary>
                        </GuardTool>
                      } />
                    </Route>
                  </Route>

                  {/* Legacy redirects: old routes -> new /app/ routes */}
                  <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/tpv" element={<Navigate to="/app/tpv" replace />} />
                  <Route path="/kds" element={<Navigate to="/app/kds" replace />} />
                  <Route path="/menu" element={<Navigate to="/app/menu" replace />} />
                  <Route path="/pulses" element={<Navigate to="/app/orders" replace />} />

                  {/* INTERNAL DEV TOOL ROUTE */}
                  <Route path="/wizard" element={<Navigate to="/dev/wizard" replace />} />
                  <Route path="/dev/wizard" element={<WizardPage />} />
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
              </>
            ) : (
              <OnboardingProvider>
                {/* OfflineOrderProvider moved to AppDomainWrapper */}
                <DevStableEntryGate />
                <Routes>
                  {/* 1. PUBLIC */}
                  <Route path="/public/*" element={
                    <SovereignBoundary>
                      <Suspense fallback={<div>Carregando Cardápio...</div>}>
                        <PublicPages />
                      </Suspense>
                    </SovereignBoundary>
                  } />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/health" element={<HealthCheckPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  {/* 🐞 DEBUG: Manual TPV Access */}
                  <Route path="/debug-tpv" element={<DebugTPV />} />
                  {/* Legacy redirects - manter compatibilidade temporária */}
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/signup" element={<Navigate to="/auth" replace />} />
                  <Route path="/join" element={<ScreenInviteCode />} />
                  <Route path="/start" element={<Navigate to="/onboarding/start" replace />} />
                  {/* FASE 1 - Billing Routes */}
                  <Route path="/onboarding/billing" element={<BillingStep />} />
                  <Route path="/onboarding/checkout" element={<CheckoutStep />} />
                  <Route path="/onboarding/trial-start" element={<TrialStart />} />
                  {/* FASE 2 - Onboarding com Primeira Venda */}
                  <Route path="/onboarding/menu-demo" element={<MenuDemo />} />
                  <Route path="/onboarding/first-sale-guide" element={<FirstSaleGuide />} />
                  <Route path="/onboarding/*" element={<OnboardingWizard />} />

                  <Route path="/migration/wizard" element={<MigrationWizard />} />
                  <Route path="/activation" element={<ActivationPage />} />

                  {/* 🍳 KDS STANDALONE — Cozinha Independente (Tablet/TV) */}
                  {/* ROTA: /kds/:restaurantId - Funciona sem AppLayout, sem FlowGate */}
                  <Route path="/kds/:restaurantId" element={
                    <Suspense fallback={
                      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
                          <p>Carregando KDS...</p>
                        </div>
                      </div>
                    }>
                      <KDSStandalone />
                    </Suspense>
                  } />

                  {/* AUTH GATE (Session Only) - Redundant with FlowGate but explicit for clarity */}
                  <Route path="/bootstrap" element={<BootstrapPage />} />

                  {/* CONTENT HUB (Totally different layout) */}
                  <Route path="/read" element={<ReaderLayout />}>
                    <Route index element={<LibraryPage />} />
                    <Route path=":slug" element={<ArticlePage />} />
                  </Route>

                  <Route path="/app" element={
                    <FlowGate>
                      <TenantProvider>
                        <AppDomainWrapper>
                          <RequireActivation>
                            <ThemeEngine />
                            <Outlet />
                            {/* <AppLayout /> MOVED TO SUB-ROUTE */}
                          </RequireActivation>
                        </AppDomainWrapper>
                      </TenantProvider>
                    </FlowGate>
                  }>
                    {/* 1. ADMIN PANEL (Dashboard + Management) - Uses Sidebar/Header */}
                    <Route element={
                      <>
                        <AppLayout />
                        <BetaFeedbackWidget />
                      </>
                    }>
                      {/* 🎯 /app sem subrota → Dashboard (FlowGate já validou auth) */}
                      <Route index element={<Navigate to="/app/dashboard" replace />} />

                      {/* [Phase 2] Multi-Tenant Routes */}
                      <Route path="select-tenant" element={<SelectTenantPage />} />
                      <Route path="access-denied" element={<AccessDeniedPage />} />

                      {/* [Opus 6.0] Operation Status Screens */}
                      <Route path="paused" element={<SystemPausedPage />} />
                      <Route path="suspended" element={<SystemSuspendedPage />} />
                      <Route path="operation-status" element={<OperationStatusPage />} />

                      {/* 🛡️ OPERATION GATE: Enforces active/paused/suspended state */}
                      <Route element={<OperationGate />}>
                        {/* Command Center */}
                        <Route path="dashboard" element={
                          <Suspense fallback={<div style={{ padding: 40, color: '#32d74b' }}>💿 Sincronizando Mapa Soberano...</div>}>
                            <DashboardZero />
                          </Suspense>
                        } />

                        <Route path="menu" element={
                          <GuardTool tool="menu">
                            <Suspense fallback={<div>Loading Menu...</div>}>
                              <MenuManager />
                            </Suspense>
                          </GuardTool>
                        } />
                        <Route path="menu/bootstrap" element={<MenuBootstrapPage />} />

                        {/* Settings & Reports */}
                        <Route path="settings" element={<Suspense fallback={<div>Loading Settings...</div>}><Settings /></Suspense>} />
                        <Route path="settings/sovereignty" element={
                          <GuardTool tool="sovereignty">
                            <Suspense fallback={<div>Loading Sovereignty...</div>}>
                              <SovereigntyDashboard />
                            </Suspense>
                          </GuardTool>
                        } />
                        <Route path="settings/advanced-setup" element={<AdvancedSetupPage />} />
                        <Route path="settings/connectors" element={<Suspense fallback={<div>Loading...</div>}><ConnectorSettings /></Suspense>} />
                        <Route path="safety" element={<Suspense fallback={<div>Loading Safety...</div>}><SafetyConfig /></Suspense>} />
                        <Route path="calendar" element={<Suspense fallback={<div>Loading Calendar...</div>}><StrategicCalendar /></Suspense>} />
                        <Route path="reports/daily-closing" element={<Suspense fallback={<div>Loading...</div>}><DailyClosing /></Suspense>} />
                        <Route path="reports/finance" element={<Suspense fallback={<div>Loading...</div>}><FinanceDashboard /></Suspense>} />
                        <Route path="reports/delivery" element={<Suspense fallback={<div>Loading DLQ...</div>}><DeliveryMonitor /></Suspense>} />
                        <Route path="team" element={<Suspense fallback={<div>Loading...</div>}><StaffPage /></Suspense>} />
                        <Route path="store/tpv-kits" element={<Suspense fallback={<div>Loading...</div>}><TPVKitsPage /></Suspense>} />
                        <Route path="web/preview" element={<Suspense fallback={<div>Loading...</div>}><RestaurantWebPreviewPage /></Suspense>} />
                        <Route path="local-boss" element={<Suspense fallback={<div>Loading...</div>}><LocalBossPage /></Suspense>} />
                        <Route path="govern" element={<Suspense fallback={<div>Loading...</div>}><GovernOverviewPage /></Suspense>} />
                        <Route path="govern-manage" element={<Suspense fallback={<div>Loading...</div>}><GovernManageDashboard /></Suspense>} />
                        <Route path="reservations" element={<Suspense fallback={<div>Loading...</div>}><ReservationsDashboard /></Suspense>} />
                        <Route path="reputation-hub" element={<Suspense fallback={<div>Loading...</div>}><ReputationHubDashboard /></Suspense>} />
                        <Route path="operational-hub" element={<Suspense fallback={<div>Loading...</div>}><OperationalHubDashboard /></Suspense>} />
                        <Route path="portioning" element={<Suspense fallback={<div>Loading...</div>}><PortioningDashboard /></Suspense>} />
                        <Route path="performance" element={<Suspense fallback={<div>Loading...</div>}><PerformanceDashboard /></Suspense>} />
                        <Route path="multi-location" element={<Suspense fallback={<div>Loading...</div>}><RestaurantGroupManager /></Suspense>} />
                        <Route path="multi-location/:groupId/dashboard" element={<Suspense fallback={<div>Loading...</div>}><GroupDashboard /></Suspense>} />
                        <Route path="crm" element={<Suspense fallback={<div>Loading...</div>}><CustomersPage /></Suspense>} />
                        <Route path="loyalty" element={<Suspense fallback={<div>Loading...</div>}><LoyaltyPage /></Suspense>} />
                        <Route path="audit" element={<SystemStatusPage />} />
                        <Route path="evolve" element={<Suspense fallback={<div>Loading Evolve Hub...</div>}><EvolveHub /></Suspense>} />
                        <Route path="coming-soon" element={<ComingSoonPage />} />
                      </Route>
                    </Route>

                    {/* 2. DEDICATED TOOLS (TPV, KDS, Orders) - NO AppLayout / Sidebar */}
                    {/* These run in "Fullscreen" or "App Mode" */}
                    <Route element={<OperationGate />}>
                      <Route path="tpv" element={
                        <GuardTool tool="tpv">
                          <Suspense fallback={<div>Loading TPV...</div>}>
                            <TPV />
                          </Suspense>
                        </GuardTool>
                      } />
                      <Route path="kds" element={
                        <GuardTool tool="kds">
                          <Suspense fallback={<div>Loading KDS...</div>}>
                            <KDS />
                          </Suspense>
                        </GuardTool>
                      } />
                      <Route path="orders" element={
                        <GuardTool tool="orders">
                          <Suspense fallback={<div>Loading Orders...</div>}>
                            <PulseList />
                          </Suspense>
                        </GuardTool>
                      } />
                      <Route path="staff" element={
                        <GuardTool tool="staff">
                          <ErrorBoundary context="AppStaff">
                            <Suspense fallback={<div style={{ padding: 20 }}>📡 Conectando satélite Staff...</div>}>
                              <StaffModule />
                            </Suspense>
                          </ErrorBoundary>
                        </GuardTool>
                      } />
                    </Route>
                  </Route>

                  {/* Legacy redirects: old routes -> new /app/ routes */}
                  <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/tpv" element={<Navigate to="/app/tpv" replace />} />
                  <Route path="/kds" element={<Navigate to="/app/kds" replace />} />
                  <Route path="/menu" element={<Navigate to="/app/menu" replace />} />
                  <Route path="/pulses" element={<Navigate to="/app/orders" replace />} />

                  {/* INTERNAL DEV TOOL ROUTE */}
                  <Route path="/wizard" element={<Navigate to="/dev/wizard" replace />} />
                  <Route path="/dev/wizard" element={<WizardPage />} />
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
              </OnboardingProvider>
            )}
          </ErrorBoundary>
        </SystemGuardianProvider>
      </HelmetProvider>
    </FeatureFlagProvider >
  );
}

export default App;
