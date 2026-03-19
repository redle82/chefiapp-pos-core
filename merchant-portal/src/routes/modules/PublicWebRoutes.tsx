/**
 * Public Web Routes — rotas públicas que NÃO passam por FlowGate/ShiftGuard.
 *
 * Estas rotas são acessíveis sem autenticação (QR mesa, menu público, KDS público).
 * Registradas no top-level Routes do App.tsx, antes do catch-all operacional.
 */

import { Fragment, lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { LoadingState } from "../../ui/design-system/components";

const PublicWebPage = lazy(() =>
  import("../../pages/PublicWeb/PublicWebPage").then((m) => ({
    default: m.PublicWebPage,
  })),
);
const TablePage = lazy(() =>
  import("../../pages/PublicWeb/TablePage").then((m) => ({
    default: m.TablePage,
  })),
);
const CustomerOrderStatusView = lazy(() =>
  import("../../pages/Public/CustomerOrderStatusView").then((m) => ({
    default: m.CustomerOrderStatusView,
  })),
);
const PublicKDS = lazy(() =>
  import("../../pages/Public/PublicKDS").then((m) => ({
    default: m.PublicKDS,
  })),
);
const TrackOrderPage = lazy(() =>
  import("../../pages/PublicWeb/TrackOrderPage").then((m) => ({
    default: m.TrackOrderPage,
  })),
);
const CustomerMenuPage = lazy(() =>
  import("../../pages/CustomerMenu/CustomerMenuPage").then((m) => ({
    default: m.CustomerMenuPage,
  })),
);

const PublicSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingState variant="minimal" />}>{children}</Suspense>
);

export const PublicWebRoutesFragment = (
  <Fragment>
    <Route
      path="/public/:slug"
      element={<PublicSuspense><PublicWebPage /></PublicSuspense>}
    />
    <Route
      path="/public/:slug/mesa/:number"
      element={<PublicSuspense><TablePage /></PublicSuspense>}
    />
    <Route
      path="/public/:slug/order/:orderId"
      element={<PublicSuspense><CustomerOrderStatusView /></PublicSuspense>}
    />
    <Route
      path="/public/:slug/kds"
      element={<PublicSuspense><PublicKDS /></PublicSuspense>}
    />
    <Route
      path="/order/:restaurantId"
      element={<PublicSuspense><CustomerMenuPage /></PublicSuspense>}
    />
    <Route
      path="/track/:orderId"
      element={<PublicSuspense><TrackOrderPage /></PublicSuspense>}
    />
  </Fragment>
);
