/**
 * Entry point SOMENTE para a área de marketing/vendas do ChefIApp.
 * Landing, blog, pricing, changelog, security, status, legal.
 * SEM app, config, TPV, auth, runtime — para deploy separado na Vercel.
 */
import "@chefiapp/core-design-system/tokens.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { BlogQuandoAbrirFecharCaixaPage } from "./pages/Blog/BlogQuandoAbrirFecharCaixaPage";
import { BlogTPVRestaurantesPage } from "./pages/Blog/BlogTPVRestaurantesPage";
import { BlogTPVVsPOSFiscalPage } from "./pages/Blog/BlogTPVVsPOSFiscalPage";
import { ChangelogPage } from "./pages/Changelog/ChangelogPage";
import { FeaturesPage } from "./pages/Landing/FeaturesPage";
import { PricingPage } from "./pages/Landing/PricingPage";
import { ProductFirstLandingPage } from "./pages/Landing/ProductFirstLandingPage";
import { LandingLocaleProvider } from "./pages/LandingV2/i18n/LandingLocaleContext";
import { LandingV2Page } from "./pages/LandingV2/LandingV2Page";
import { LegalPrivacyPage } from "./pages/Legal/LegalPrivacyPage";
import { LegalTermsPage } from "./pages/Legal/LegalTermsPage";
import { SecurityPage } from "./pages/Security/SecurityPage";
import { StatusPage } from "./pages/Status/StatusPage";
import { ErrorBoundary } from "./ui/design-system/ErrorBoundary";

function MarketingApp() {
  return (
    <Routes>
      <Route path="/" element={<LandingLocaleProvider><LandingV2Page /></LandingLocaleProvider>} />
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
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/trial" element={<Navigate to="/app/trial-tpv" replace />} />
      <Route path="/trial-guide" element={<Navigate to="/app/trial-tpv" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary context="Marketing">
      <BrowserRouter>
        <MarketingApp />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
