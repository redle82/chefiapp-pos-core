/**
 * Entry point SOMENTE para a área de marketing/vendas do ChefIApp.
 * Landing, blog, pricing, changelog, security, status, legal.
 * SEM app, config, TPV, auth, runtime — para deploy separado na Vercel.
 */
import "@chefiapp/core-design-system/tokens.css";
import * as Sentry from "@sentry/react";
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

Sentry.init({
  dsn: "https://c507891630be22946aae6f4dc35daa2b@o4509651128942592.ingest.us.sentry.io/4510930062475264",
  environment:
    import.meta.env.MODE === "production" ? "production" : "development",
  release:
    import.meta.env.VITE_SENTRY_RELEASE ||
    `merchant-portal@${import.meta.env.MODE}`,
  sendDefaultPii: true,
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});

// Boot metric for marketing entry
Sentry.metrics.increment("app.boot", 1, { tags: { entry: "marketing" } });

// Track page load for marketing
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (nav) {
        Sentry.metrics.distribution(
          "page.load_time",
          nav.loadEventEnd - nav.startTime,
          {
            unit: "millisecond",
            tags: { route: window.location.pathname, entry: "marketing" },
          },
        );
      }
    }, 0);
  });
}

function MarketingApp() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingLocaleProvider>
            <LandingV2Page />
          </LandingLocaleProvider>
        }
      />
      <Route
        path="/v2"
        element={
          <LandingLocaleProvider>
            <LandingV2Page />
          </LandingLocaleProvider>
        }
      />
      <Route
        path="/landing-v2"
        element={
          <LandingLocaleProvider>
            <LandingV2Page />
          </LandingLocaleProvider>
        }
      />
      <Route path="/app/trial-tpv" element={<ProductFirstLandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
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
      <Route path="/status" element={<StatusPage />} />
      <Route path="/legal/terms" element={<LegalTermsPage />} />
      <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/trial" element={<Navigate to="/app/trial-tpv" replace />} />
      <Route
        path="/trial-guide"
        element={<Navigate to="/app/trial-tpv" replace />}
      />
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
