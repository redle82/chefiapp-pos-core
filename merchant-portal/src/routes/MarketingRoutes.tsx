/**
 * Rotas públicas / marketing (Landing, blog, pricing, auth, menu, mentor).
 * Desfragmentação: extraídas de App.tsx para fronteira explícita.
 * Uso: <Routes><MarketingRoutes /><Route path="/*" element={<AppOperationalWrapper />} /></Routes>
 */

import { Navigate, Route } from "react-router-dom";
import { LandingLocaleProvider } from "../pages/LandingV2/i18n/LandingLocaleContext";
import { LandingV2Page } from "../pages/LandingV2/LandingV2Page";
import { ProductFirstLandingPage } from "../pages/Landing/ProductFirstLandingPage";
import { PricingPage } from "../pages/Landing/PricingPage";
import { FeaturesPage } from "../pages/Landing/FeaturesPage";
import { BlogTPVRestaurantesPage } from "../pages/Blog/BlogTPVRestaurantesPage";
import { BlogTPVVsPOSFiscalPage } from "../pages/Blog/BlogTPVVsPOSFiscalPage";
import { BlogQuandoAbrirFecharCaixaPage } from "../pages/Blog/BlogQuandoAbrirFecharCaixaPage";
import { ChangelogPage } from "../pages/Changelog/ChangelogPage";
import { SecurityPage } from "../pages/Security/SecurityPage";
import { StatusPage } from "../pages/Status/StatusPage";
import { LegalTermsPage } from "../pages/Legal/LegalTermsPage";
import { LegalPrivacyPage } from "../pages/Legal/LegalPrivacyPage";
import { PhoneLoginPage } from "../pages/AuthPhone/PhoneLoginPage";
import { VerifyCodePage } from "../pages/AuthPhone/VerifyCodePage";
import { AuthPage } from "../pages/AuthPage";
import { BootstrapPage } from "../pages/BootstrapPage";
import { RestaurantMinimalSetupPage } from "../pages/Setup/RestaurantMinimalSetupPage";
import { BillingSuccessPage } from "../pages/Billing/BillingSuccessPage";
import { HelpStartLocalPage } from "../pages/HelpStartLocalPage";
import { MenuCatalogPage } from "../pages/MenuCatalog/MenuCatalogPage";
import { MenuCatalogPageV2 } from "../pages/MenuCatalog/MenuCatalogPageV2";
import { MentorPage } from "../features/mentorship";

export function MarketingRoutes() {
  return (
    <>
      {/* Public / Marketing — /, /v2, /landing-v2 = LandingV2; /landing → auth */}
      <Route path="/" element={<LandingLocaleProvider><LandingV2Page /></LandingLocaleProvider>} />
      <Route path="/landing" element={<Navigate to="/auth/phone" replace />} />
      <Route path="/v2" element={<LandingLocaleProvider><LandingV2Page /></LandingLocaleProvider>} />
      <Route path="/landing-v2" element={<LandingLocaleProvider><LandingV2Page /></LandingLocaleProvider>} />
      <Route path="/app/trial-tpv" element={<ProductFirstLandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/blog" element={<BlogTPVRestaurantesPage />} />
      <Route path="/blog/tpv-restaurantes" element={<BlogTPVRestaurantesPage />} />
      <Route path="/blog/tpv-vs-pos-fiscal" element={<BlogTPVVsPOSFiscalPage />} />
      <Route path="/blog/quando-abrir-fechar-caixa" element={<BlogQuandoAbrirFecharCaixaPage />} />
      <Route path="/changelog" element={<ChangelogPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/status" element={<StatusPage />} />
      <Route path="/legal/terms" element={<LegalTermsPage />} />
      <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
      {/* Demo Guide: entrada pública para o TPV em modo Free Trial */}
      <Route path="/trial" element={<Navigate to="/op/tpv?mode=trial" replace />} />
      <Route path="/trial-guide" element={<Navigate to="/op/tpv?mode=trial" replace />} />
      {/* Auth / Onboarding Redirects */}
      <Route path="/login" element={<Navigate to="/auth/phone" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/phone" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/auth/email" replace />} />
      <Route path="/auth" element={<Navigate to="/auth/phone" replace />} />
      <Route path="/auth/phone" element={<PhoneLoginPage />} />
      <Route path="/auth/verify" element={<VerifyCodePage />} />
      <Route path="/auth/email" element={<AuthPage />} />
      <Route path="/bootstrap" element={<BootstrapPage />} />
      <Route path="/setup/restaurant-minimal" element={<RestaurantMinimalSetupPage />} />
      {/* Core Operations */}
      <Route path="/billing/success" element={<BillingSuccessPage />} />
      <Route path="/help/start-local" element={<HelpStartLocalPage />} />
      {/* Menu: catálogo visual de decisão (spec MENU_CATALOG_VISUAL_SPEC) */}
      <Route path="/menu" element={<MenuCatalogPage />} />
      <Route path="/menu-v2" element={<MenuCatalogPageV2 />} />
      {/* Mentoria — acessível sem auth para dev/teste */}
      <Route path="/mentor" element={<MentorPage />} />
    </>
  );
}
