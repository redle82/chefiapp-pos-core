/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { APP_ROUTES } from "../constants/routeConstants";
import { PublicBootstrapRoutesFragment } from "./PublicBootstrapRoutes";

vi.mock("../../pages/PublicWeb/PublicWebPage", () => ({
  PublicWebPage: () => <div>public-web-page</div>,
}));

vi.mock("../../pages/PublicWeb/TablePage", () => ({
  TablePage: () => <div>table-page</div>,
}));

vi.mock("../../pages/Public/CustomerOrderStatusView", () => ({
  CustomerOrderStatusView: () => <div>customer-order-status</div>,
}));

vi.mock("../../pages/Public/PublicKDS", () => ({
  PublicKDS: () => <div>public-kds</div>,
}));

vi.mock("../../pages/Welcome/WelcomePage", () => ({
  WelcomePage: () => <div>welcome-page</div>,
}));

vi.mock("../../pages/Onboarding/OnboardingAssistantPage", () => ({
  OnboardingAssistantPage: () => <div>onboarding-assistant</div>,
}));

vi.mock("../../pages/Activation/ActivationCenterPage", () => ({
  ActivationCenterPage: () => <div>activation-center</div>,
}));

vi.mock("../../pages/BootstrapPage", () => ({
  BootstrapPage: () => <div>bootstrap-page</div>,
}));

vi.mock("../../pages/SelectTenantPage", () => ({
  SelectTenantPage: () => <div>select-tenant-page</div>,
}));

vi.mock("../../pages/ElectronSetup/ElectronSetupPage", () => ({
  ElectronSetupPage: () => <div>electron-setup-page</div>,
}));

describe("PublicBootstrapRoutesFragment", () => {
  it("renders the public storefront route", () => {
    render(
      <MemoryRouter initialEntries={["/public/demo"]}>
        <Routes>
          {PublicBootstrapRoutesFragment}
          <Route path="*" element={<div>no-match</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("public-web-page")).toBeTruthy();
  });

  it("redirects /app to the staff home target", () => {
    render(
      <MemoryRouter initialEntries={[APP_ROUTES.ROOT]}>
        <Routes>
          {PublicBootstrapRoutesFragment}
          <Route
            path={APP_ROUTES.STAFF_HOME}
            element={<div>staff-home-target</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("staff-home-target")).toBeTruthy();
  });

  it("redirects setup legacy path to activation center", () => {
    render(
      <MemoryRouter initialEntries={["/setup/restaurant-minimal"]}>
        <Routes>{PublicBootstrapRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("activation-center")).toBeTruthy();
  });
});
