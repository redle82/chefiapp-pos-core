/**
 * SetupRoutes — Route registration for /setup/* (restaurant implantation).
 *
 * Mounts the unified setup experience:
 * - /setup/start → Welcome + journey overview
 * - /setup       → OnboardingLayout shell (sidebar + sections)
 * - /setup/review → Configuration summary before activation
 * - /setup/activate → Ritual Open (shift opening + activation)
 *
 * Legacy redirects:
 * - /welcome → /setup/start
 * - /onboarding → /setup
 * - /bootstrap → /setup
 * - /setup/restaurant-minimal → /setup
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 1)
 */

import { Fragment } from "react";
import { Navigate, Route } from "react-router-dom";
import { MarketGuard } from "../../core/market/MarketGuard";
import { SetupShell } from "../../pages/Setup/SetupShell";
import { SetupStartPage } from "../../pages/Setup/SetupStartPage";
import { SetupReviewPage } from "../../pages/Setup/SetupReviewPage";
import { OnboardingRitualPage } from "../../pages/Onboarding/OnboardingRitualPage";

export const SetupRoutesFragment = (
  <Fragment>
    {/* ── Setup flow (guarded by market onboarding capability) ── */}
    <Route path="/setup/start" element={<MarketGuard requires="onboarding"><SetupStartPage /></MarketGuard>} />
    <Route path="/setup" element={<MarketGuard requires="onboarding"><SetupShell /></MarketGuard>} />
    <Route path="/setup/review" element={<MarketGuard requires="onboarding"><SetupReviewPage /></MarketGuard>} />
    <Route path="/setup/activate" element={<MarketGuard requires="onboarding"><OnboardingRitualPage /></MarketGuard>} />

    {/* ── Section deep-links (redirect to shell with ?section=) ── */}
    <Route
      path="/setup/identity"
      element={<Navigate to="/setup?section=identity" replace />}
    />
    <Route
      path="/setup/location"
      element={<Navigate to="/setup?section=location" replace />}
    />
    <Route
      path="/setup/hours"
      element={<Navigate to="/setup?section=schedule" replace />}
    />
    <Route
      path="/setup/catalog"
      element={<Navigate to="/setup?section=menu" replace />}
    />
    <Route
      path="/setup/inventory"
      element={<Navigate to="/setup?section=inventory" replace />}
    />
    <Route
      path="/setup/staff"
      element={<Navigate to="/setup?section=people" replace />}
    />
    <Route
      path="/setup/payments"
      element={<Navigate to="/setup?section=payments" replace />}
    />
    <Route
      path="/setup/integrations"
      element={<Navigate to="/setup?section=integrations" replace />}
    />
    <Route
      path="/setup/publish"
      element={<Navigate to="/setup?section=publish" replace />}
    />
  </Fragment>
);
