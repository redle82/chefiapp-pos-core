import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';

// Pages
import { AuthPage } from './pages/AuthPage';
import OnboardingWizard, { ScreenInviteCode } from './pages/Onboarding/OnboardingWizard';
import { MigrationWizard } from './pages/Onboarding/migration/MigrationWizardContainer';
import { ActivationPage } from './pages/Activation/ActivationPage';
import { WizardPage } from './pages/WizardPage';
import { BootstrapPage } from './pages/BootstrapPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { LandingPage } from './pages/Landing/LandingPage';
import { AdvancedSetupPage } from './pages/Onboarding/AdvancedSetupPage';
import PublicPages from './pages/Public/PublicPages';
import { SelectTenantPage, AccessDeniedPage } from './pages/Tenant';
import { HealthCheckPage } from './pages/HealthCheckPage';
import { SystemStatusPage } from './pages/Audit/SystemStatusPage';

// Content Hub
import { ReaderLayout } from './pages/Read/ReaderLayout';
import { LibraryPage } from './pages/Read/LibraryPage';
import { ArticlePage } from './pages/Read/ArticlePage';

// Subgroup A: TPV & Menu
// Subgroup A: TPV & Menu
const TPV = React.lazy(() => import('./pages/TPV/TPV'));
const KDS = React.lazy(() => import('./pages/TPV/KDS/KitchenDisplay'));
const KDSStandalone = React.lazy(() => import('./pages/TPV/KDS/KDSStandalone'));
const MenuManager = React.lazy(() => import('./pages/Menu').then(m => ({ default: m.MenuManager })));
import { MenuBootstrapPage } from './pages/Menu/Bootstrap/MenuBootstrapPage';
import { OrderProvider } from './pages/TPV/context/OrderContextReal';
import { BetaFeedbackWidget } from './ui/feedback/BetaFeedbackWidget';

// Subgroup B: Dashboard & Reports
const DashboardZero = React.lazy(() => import('./pages/Dashboard/DashboardZero'));
const PulseList = React.lazy(() => import('./pages/AppStaff/PulseList').then(m => ({ default: m.PulseList })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const ConnectorSettings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.ConnectorSettings })));
const DailyClosing = React.lazy(() => import('./pages/Reports/DailyClosing').then(m => ({ default: m.DailyClosing })));
const FinanceDashboard = React.lazy(() => import('./pages/Reports/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const StaffPage = React.lazy(() => import('./pages/Settings/StaffPage'));
const TPVKitsPage = React.lazy(() => import('./pages/Store/TPVKitsPage').then(m => ({ default: m.TPVKitsPage })));
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

// Components
import { FlowGate } from './core/flow/FlowGate';
import { OperationGate } from './core/flow/OperationGate'; // Opus 6.0
import { RequireActivation } from './core/activation';
import { GuardTool } from './core/permissions/GuardTool';
import { AppLayout } from './components/Layout/AppLayout';
import { ThemeEngine } from './components/theme/ThemeEngine';
import { SovereignBoundary } from './ui/components/SovereignBoundary';

// Pages - Operation
import { SystemPausedPage } from './pages/Operation/SystemPausedPage'; // Opus 6.0
import { SystemSuspendedPage } from './pages/Operation/SystemSuspendedPage'; // Opus 6.0
import { OperationStatusPage } from './pages/Operation/OperationStatusPage'; // Opus 6.0

// Providers
import { FeatureFlagProvider } from './core/flags/FeatureFlagContext';
import { SystemGuardianProvider } from './core/guardian/SystemGuardianContext';
import { TenantProvider } from './core/tenant/TenantContext'; // Added Provider
import { OnboardingProvider } from './pages/Onboarding/OnboardingState';
import { OfflineOrderProvider } from './pages/TPV/context/OfflineOrderContext';

// 🛰️ LAZY LOADED SATELLITES
const StaffModule = React.lazy(() => import('./pages/AppStaff/StaffModule'));

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
  return (
    <FeatureFlagProvider>
      <SystemGuardianProvider>
        <ErrorBoundary context="AppRoot">
          <OnboardingProvider>
            <OfflineOrderProvider>
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
                {/* Legacy redirects - manter compatibilidade temporária */}
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/signup" element={<Navigate to="/auth" replace />} />
                <Route path="/join" element={<ScreenInviteCode />} />
                <Route path="/start" element={<Navigate to="/onboarding/start" replace />} />
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

                {/* SATELLITE APPS (Standalone / Kiosk Mode) */}
                <Route path="staff/*" element={
                  <ErrorBoundary context="AppStaff">
                    <Suspense fallback={<div style={{ padding: 20 }}>📡 Conectando satélite Staff...</div>}>
                      <StaffModule />
                    </Suspense>
                  </ErrorBoundary>
                } />

                <Route path="/app" element={
                  <FlowGate>
                    <TenantProvider>
                      <RequireActivation>
                        <OrderProvider>
                          <ThemeEngine />
                          <AppLayout />
                          <BetaFeedbackWidget />
                        </OrderProvider>
                      </RequireActivation>
                    </TenantProvider>
                  </FlowGate>
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

                    {/* Tool Routes (Staff Terminal Style - Open in New Tabs) */}
                    {/* 🔒 ARQUITETURA LOCKED: Cada app abre em sua própria aba */}
                    {/* Ver: E2E_SOVEREIGN_NAVIGATION_VALIDATION.md */}
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
                    <Route path="menu" element={
                      <GuardTool tool="menu">
                        <Suspense fallback={<div>Loading Menu...</div>}>
                          <MenuManager />
                        </Suspense>
                      </GuardTool>
                    } />
                    <Route path="menu/bootstrap" element={<MenuBootstrapPage />} />
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

                    {/* Settings & Reports */}
                    <Route path="settings" element={<Suspense fallback={<div>Loading Settings...</div>}><Settings /></Suspense>} />
                    <Route path="settings/advanced-setup" element={<AdvancedSetupPage />} />
                    <Route path="settings/connectors" element={<Suspense fallback={<div>Loading...</div>}><ConnectorSettings /></Suspense>} />
                    <Route path="reports/daily-closing" element={<Suspense fallback={<div>Loading...</div>}><DailyClosing /></Suspense>} />
                    <Route path="reports/finance" element={<Suspense fallback={<div>Loading...</div>}><FinanceDashboard /></Suspense>} />
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
                    <Route path="multi-location" element={<Suspense fallback={<div>Loading...</div>}><RestaurantGroupManager /></Suspense>} />
                    <Route path="multi-location/:groupId/dashboard" element={<Suspense fallback={<div>Loading...</div>}><GroupDashboard /></Suspense>} />
                    <Route path="audit" element={<SystemStatusPage />} />
                    <Route path="coming-soon" element={<ComingSoonPage />} />
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
            </OfflineOrderProvider>
          </OnboardingProvider>
        </ErrorBoundary>
      </SystemGuardianProvider>
    </FeatureFlagProvider>
  );
}

export default App;
