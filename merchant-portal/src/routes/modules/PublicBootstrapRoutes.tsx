import { Fragment } from "react";
import { Navigate, Route } from "react-router-dom";
import { ActivationCenterPage } from "../../pages/Activation/ActivationCenterPage";
import { BootstrapPage } from "../../pages/BootstrapPage";
import { ElectronSetupPage } from "../../pages/ElectronSetup/ElectronSetupPage";
import { OnboardingAssistantPage } from "../../pages/Onboarding/OnboardingAssistantPage";
import { CustomerOrderStatusView } from "../../pages/Public/CustomerOrderStatusView";
import { PublicKDS } from "../../pages/Public/PublicKDS";
import { PublicWebPage } from "../../pages/PublicWeb/PublicWebPage";
import { TablePage } from "../../pages/PublicWeb/TablePage";
import { SelectTenantPage } from "../../pages/SelectTenantPage";
import { WelcomePage } from "../../pages/Welcome/WelcomePage";
import { APP_ROUTES } from "../constants/routeConstants";

export const PublicBootstrapRoutesFragment = (
  <Fragment>
    <Route path="/public/:slug" element={<PublicWebPage />} />
    <Route path="/public/:slug/mesa/:number" element={<TablePage />} />
    <Route
      path="/public/:slug/order/:orderId"
      element={<CustomerOrderStatusView />}
    />
    <Route path="/public/:slug/kds" element={<PublicKDS />} />

    <Route path="/welcome" element={<WelcomePage />} />
    <Route path="/onboarding" element={<OnboardingAssistantPage />} />
    <Route
      path="/app/onboarding"
      element={<Navigate to="/onboarding" replace />}
    />
    <Route path={APP_ROUTES.ACTIVATION} element={<ActivationCenterPage />} />
    <Route path="/bootstrap" element={<BootstrapPage />} />
    <Route path={APP_ROUTES.SELECT_TENANT} element={<SelectTenantPage />} />
    <Route
      path={APP_ROUTES.ROOT}
      element={<Navigate to={APP_ROUTES.STAFF_HOME} replace />}
    />
    <Route
      path="/setup/restaurant-minimal"
      element={<Navigate to={APP_ROUTES.ACTIVATION} replace />}
    />

    <Route path="/electron/setup" element={<ElectronSetupPage />} />
  </Fragment>
);
