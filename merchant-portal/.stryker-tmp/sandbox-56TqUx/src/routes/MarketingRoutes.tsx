/**
 * Rotas públicas / marketing (Landing, blog, pricing, auth, menu, mentor).
 * Desfragmentação: extraídas de App.tsx para fronteira explícita.
 * Exporta Fragment para usar como filho direto de <Routes> (React Router v6 exige Route ou Fragment).
 * Uso: <Routes>{MarketingRoutesFragment}<Route path="/*" element={...} /></Routes>
 */
// @ts-nocheck


import { Fragment } from "react";
import { Navigate, Route } from "react-router-dom";
import { PWAOpenToTPVRedirect } from "../core/operational/PWAOpenToTPVRedirect";
import { MentorPage } from "../features/mentorship";
import { AboutPage } from "../pages/About/AboutPage";
import { AuthPage } from "../pages/AuthPage";
import { PhoneLoginPage } from "../pages/AuthPhone/PhoneLoginPage";
import { VerifyCodePage } from "../pages/AuthPhone/VerifyCodePage";
import { BillingSuccessPage } from "../pages/Billing/BillingSuccessPage";
import { BlogQuandoAbrirFecharCaixaPage } from "../pages/Blog/BlogQuandoAbrirFecharCaixaPage";
import { BlogTPVRestaurantesPage } from "../pages/Blog/BlogTPVRestaurantesPage";
import { BlogTPVVsPOSFiscalPage } from "../pages/Blog/BlogTPVVsPOSFiscalPage";
import { BootstrapPage } from "../pages/BootstrapPage";
import { ChangelogPage } from "../pages/Changelog/ChangelogPage";
import { HelpStartLocalPage } from "../pages/HelpStartLocalPage";
import { FeaturesPage } from "../pages/Landing/FeaturesPage";
import { MarketComparisonPage } from "../pages/Landing/MarketComparisonPage";
import { PricingPage } from "../pages/Landing/PricingPage";
import { ProductFirstLandingPage } from "../pages/Landing/ProductFirstLandingPage";
import { LandingLocaleProvider } from "../pages/LandingV2/i18n/LandingLocaleContext";
import { OfficialLandingPage } from "../pages/LandingV2/LandingV2Page";
import { LegalDPAPage } from "../pages/Legal/LegalDPAPage";
import { LegalPrivacyPage } from "../pages/Legal/LegalPrivacyPage";
import { LegalTermsPage } from "../pages/Legal/LegalTermsPage";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { MenuCatalogPage } from "../pages/MenuCatalog/MenuCatalogPage";
import { MenuCatalogPageV2 } from "../pages/MenuCatalog/MenuCatalogPageV2";
import { SecurityPage } from "../pages/Security/SecurityPage";
import { StatusPage } from "../pages/Status/StatusPage";

/** Fragment com todas as rotas de marketing — usar como filho direto de <Routes>. */
export const MarketingRoutesFragment = (
  <Fragment>
    {/* Public / Marketing — rota canónica da landing: /landing. Aliases legados: /v2, /landing-v2. */}
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
    <Route path="/blog" element={<BlogTPVRestaurantesPage />} />
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
    <Route path="/changelog" element={<ChangelogPage />} />
    <Route path="/security" element={<SecurityPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/status" element={<StatusPage />} />
    <Route path="/legal/terms" element={<LegalTermsPage />} />
    <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
    <Route path="/legal/dpa" element={<LegalDPAPage />} />
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
    <Route path="/login" element={<Navigate to="/auth/login" replace />} />
    <Route path="/register" element={<Navigate to="/auth/phone" replace />} />
    <Route path="/signup" element={<Navigate to="/auth/phone" replace />} />
    <Route
      path="/forgot"
      element={<Navigate to="/forgot-password" replace />}
    />
    <Route
      path="/forgot-password"
      element={<Navigate to="/auth/email" replace />}
    />
    <Route path="/auth" element={<Navigate to="/auth/phone" replace />} />
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/auth/phone" element={<PhoneLoginPage />} />
    <Route path="/auth/verify" element={<VerifyCodePage />} />
    <Route path="/auth/email" element={<AuthPage />} />
    <Route path="/bootstrap" element={<BootstrapPage />} />
    {/* NAVIGATION_CONTRACT: /setup/restaurant-minimal only in app tree → redirect to /app/activation */}
    {/* Core Operations */}
    <Route path="/billing/success" element={<BillingSuccessPage />} />
    <Route path="/help/start-local" element={<HelpStartLocalPage />} />
    {/* Menu: catálogo visual de decisão (spec MENU_CATALOG_VISUAL_SPEC) */}
    <Route path="/menu" element={<MenuCatalogPage />} />
    <Route path="/menu-v2" element={<MenuCatalogPageV2 />} />
    {/* Mentoria — acessível sem auth para dev/teste */}
    <Route path="/mentor" element={<MentorPage />} />
  </Fragment>
);
