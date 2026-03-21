/**
 * PublicBootstrapRoutes — Public-facing and bootstrap routes.
 *
 * Sprint 2: Legacy onboarding routes now redirect to /setup/*.
 * The canonical setup flow lives in SetupRoutes.tsx.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 2)
 */

import { Fragment } from "react";
import { Navigate, Route } from "react-router-dom";
import { ActivationCenterPage } from "../../pages/Activation/ActivationCenterPage";
import { CustomerOrderStatusView } from "../../pages/Public/CustomerOrderStatusView";
import { PublicKDS } from "../../pages/Public/PublicKDS";
import { PublicWebPage } from "../../pages/PublicWeb/PublicWebPage";
import { TablePage } from "../../pages/PublicWeb/TablePage";
import { TrackOrderPage } from "../../pages/PublicWeb/TrackOrderPage";
import { CustomerMenuPage } from "../../pages/CustomerMenu/CustomerMenuPage";
import { SelectTenantPage } from "../../pages/SelectTenantPage";
import { APP_ROUTES } from "../constants/routeConstants";

export const PublicBootstrapRoutesFragment = (
  <Fragment>
    {/* ── Public customer-facing routes ─────────────────────── */}
    <Route path="/public/:slug" element={<PublicWebPage />} />
    <Route path="/public/:slug/mesa/:number" element={<TablePage />} />
    <Route
      path="/public/:slug/order/:orderId"
      element={<CustomerOrderStatusView />}
    />
    <Route path="/public/:slug/kds" element={<PublicKDS />} />
    <Route path="/order/:restaurantId" element={<CustomerMenuPage />} />
    <Route path="/track/:orderId" element={<TrackOrderPage />} />

    {/* ── Legacy redirects → canonical /setup/* ─────────────── */}
    <Route
      path="/welcome"
      element={<Navigate to="/setup/start" replace />}
    />
    <Route
      path="/onboarding"
      element={<Navigate to="/setup" replace />}
    />
    <Route
      path="/app/onboarding"
      element={<Navigate to="/setup" replace />}
    />
    <Route
      path="/onboarding/intro"
      element={<Navigate to="/setup/start" replace />}
    />
    <Route
      path="/onboarding/identity"
      element={<Navigate to="/setup?section=identity" replace />}
    />
    <Route
      path="/onboarding/location"
      element={<Navigate to="/setup?section=location" replace />}
    />
    <Route
      path="/onboarding/day-profile"
      element={<Navigate to="/setup?section=schedule" replace />}
    />
    <Route
      path="/onboarding/shift-setup"
      element={<Navigate to="/setup?section=schedule" replace />}
    />
    <Route
      path="/onboarding/products"
      element={<Navigate to="/setup?section=menu" replace />}
    />
    <Route
      path="/onboarding/tpv-preview"
      element={<Navigate to="/setup/review" replace />}
    />
    <Route
      path="/onboarding/plan-trial"
      element={<Navigate to="/setup?section=payments" replace />}
    />
    <Route
      path="/onboarding/ritual-open"
      element={<Navigate to="/setup/activate" replace />}
    />
    <Route
      path="/bootstrap"
      element={<Navigate to="/setup?section=identity" replace />}
    />

    {/* ── Activation & tenant ──────────────────────────────── */}
    <Route path={APP_ROUTES.ACTIVATION} element={<ActivationCenterPage />} />
    <Route path={APP_ROUTES.SELECT_TENANT} element={<SelectTenantPage />} />
    <Route
      path={APP_ROUTES.ROOT}
      element={<Navigate to={APP_ROUTES.STAFF_HOME} replace />}
    />
  </Fragment>
);
