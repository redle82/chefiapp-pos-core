/**
 * Rotas públicas / marketing (Landing, blog, pricing, auth, menu, mentor).
 * Desfragmentação: extraídas de App.tsx para fronteira explícita.
 * Exporta Fragment para usar como filho direto de <Routes> (React Router v6 exige Route ou Fragment).
 * Uso: <Routes>{MarketingRoutesFragment}<Route path="/*" element={...} /></Routes>
 *
 * LoginPage e AuthPage em lazy para evitar 500 no carregamento inicial do bundle (chunk separado).
 */

import { Fragment, lazy, Suspense } from "react";
import { Navigate, Route } from "react-router-dom";
import { PWAOpenToTPVRedirect } from "../core/operational/PWAOpenToTPVRedirect";
import { MentorPage } from "../features/mentorship";
import { AboutPage } from "../pages/About/AboutPage";
import { PhoneLoginPage } from "../pages/AuthPhone/PhoneLoginPage";
import { VerifyCodePage } from "../pages/AuthPhone/VerifyCodePage";
import { AuthCallbackPage } from "../pages/AuthPhone/AuthCallbackPage";
import { EmailOTPLoginPage } from "../pages/Auth/EmailOTPLoginPage";
import { BillingSuccessPage } from "../pages/Billing/BillingSuccessPage";
import { BlogIndexPage } from "../pages/Blog/BlogIndexPage";
import { BlogQuandoAbrirFecharCaixaPage } from "../pages/Blog/BlogQuandoAbrirFecharCaixaPage";
import { BlogTPVRestaurantesPage } from "../pages/Blog/BlogTPVRestaurantesPage";
import { BlogTPVVsPOSFiscalPage } from "../pages/Blog/BlogTPVVsPOSFiscalPage";
import { BlogComparacaoPage } from "../pages/Blog/BlogComparacaoPage";
import { BootstrapPage } from "../pages/BootstrapPage";
import { ChangelogPage } from "../pages/Changelog/ChangelogPage";
import { HelpStartLocalPage } from "../pages/HelpStartLocalPage";
import { FeaturesPage } from "../pages/Landing/FeaturesPage";
import { MarketComparisonPage } from "../pages/Landing/MarketComparisonPage";
import { PricingPage } from "../pages/Landing/PricingPage";
import { ProductFirstLandingPage } from "../pages/Landing/ProductFirstLandingPage";
import { GastroLandingPage } from "../pages/LandingGastro/GastroLandingPage";
import { LandingLocaleProvider } from "../pages/LandingV2/i18n/LandingLocaleContext";
import { OfficialLandingPage } from "../pages/LandingV2/LandingV2Page";
import { LegalDPAPage } from "../pages/Legal/LegalDPAPage";
import { LegalPrivacyPage } from "../pages/Legal/LegalPrivacyPage";
import { LegalTermsPage } from "../pages/Legal/LegalTermsPage";
import { PrivacyPolicyPage } from "../pages/Legal/PrivacyPolicyPage";
import { ReservationPortal } from "../pages/CustomerMenu/ReservationPortal";
import { MenuCatalogPage } from "../pages/MenuCatalog/MenuCatalogPage";
import { MenuCatalogPageV2 } from "../pages/MenuCatalog/MenuCatalogPageV2";
import { SecurityPage } from "../pages/Security/SecurityPage";
import { StatusPage } from "../pages/Status/StatusPage";

const LoginPage = lazy(() => import("../pages/LoginPage/LoginPage").then((m) => ({ default: m.LoginPage })));
const AuthPage = lazy(() => import("../pages/AuthPage").then((m) => ({ default: m.AuthPage })));

const AuthFallback = () => <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#a3a3a3" }}>A carregar...</div>;

/** Fragment com todas as rotas de marketing — usar como filho direto de <Routes>. */
export const MarketingRoutesFragment = (
  <Fragment>
    {/* Public / Marketing — OfficialLandingPage (com logo proeminente) na raiz */}
    <Route
      path="/"
      element={
        <PWAOpenToTPVRedirect>
          <LandingLocaleProvider>
            <OfficialLandingPage />
          </LandingLocaleProvider>
        </PWAOpenToTPVRedirect>
      }
    />
    <Route
      path="/landing"
      element={
        <LandingLocaleProvider>
          <OfficialLandingPage />
        </LandingLocaleProvider>
      }
    />
    <Route
      path="/v2"
      element={
        <LandingLocaleProvider>
          <OfficialLandingPage />
        </LandingLocaleProvider>
      }
    />
    <Route
      path="/landing-v2"
      element={
        <LandingLocaleProvider>
          <OfficialLandingPage />
        </LandingLocaleProvider>
      }
    />
    <Route path="/app/trial-tpv" element={<ProductFirstLandingPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/compare" element={<MarketComparisonPage />} />
    <Route path="/comparativo" element={<MarketComparisonPage />} />
    <Route path="/features" element={<FeaturesPage />} />
    <Route path="/blog" element={<BlogIndexPage />} />
    <Route
      path="/blog/tpv-restaurantes"
      element={<BlogTPVRestaurantesPage />}
    />
    <Route
      path="/blog/tpv-vs-pos-fiscal"
      element={<BlogTPVVsPOSFiscalPage />}
    />
    <Route
      path="/blog/quando-abrir-fechar-caixa"
      element={<BlogQuandoAbrirFecharCaixaPage />}
    />
    <Route
      path="/blog/chefiapp-vs-concorrencia"
      element={<BlogComparacaoPage />}
    />
    <Route path="/changelog" element={<ChangelogPage />} />
    <Route path="/security" element={<SecurityPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/status" element={<StatusPage />} />
    <Route path="/legal/terms" element={<LegalTermsPage />} />
    <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
    <Route path="/legal/dpa" element={<LegalDPAPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    {/* Demo Guide: entrada pública para o TPV em modo Free Trial */}
    <Route
      path="/trial"
      element={<Navigate to="/op/tpv?mode=trial" replace />}
    />
    <Route
      path="/trial-guide"
      element={<Navigate to="/op/tpv?mode=trial" replace />}
    />
    {/* Auth / Onboarding Redirects */}
    <Route path="/login" element={<Navigate to="/auth/email" replace />} />
    <Route path="/register" element={<Navigate to="/auth/email" replace />} />
    <Route path="/signup" element={<Navigate to="/auth/email" replace />} />
    <Route
      path="/forgot"
      element={<Navigate to="/forgot-password" replace />}
    />
    <Route
      path="/forgot-password"
      element={<Navigate to="/auth/email" replace />}
    />
    <Route path="/auth" element={<Navigate to="/auth/email" replace />} />
    <Route path="/auth/login" element={<Navigate to="/auth/email" replace />} />
    <Route path="/auth/phone" element={<Navigate to="/auth/email" replace />} />
    <Route path="/auth/email" element={<EmailOTPLoginPage />} />
    <Route path="/auth/verify" element={<VerifyCodePage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/auth/legacy" element={<Suspense fallback={<AuthFallback />}><AuthPage /></Suspense>} />
    <Route path="/bootstrap" element={<BootstrapPage />} />
    {/* NAVIGATION_CONTRACT: /setup/restaurant-minimal only in app tree → redirect to /app/activation */}
    {/* Core Operations */}
    <Route path="/billing/success" element={<BillingSuccessPage />} />
    <Route path="/help/start-local" element={<HelpStartLocalPage />} />
    {/* Menu: catálogo visual de decisão (spec MENU_CATALOG_VISUAL_SPEC) */}
    <Route path="/menu" element={<MenuCatalogPage />} />
    <Route path="/menu-v2" element={<MenuCatalogPageV2 />} />
    {/* Online Reservation Portal — public, no auth */}
    <Route path="/reserve/:restaurantId" element={<ReservationPortal />} />
    {/* Mentoria — acessível sem auth para dev/teste */}
    <Route path="/mentor" element={<MentorPage />} />
  </Fragment>
);
