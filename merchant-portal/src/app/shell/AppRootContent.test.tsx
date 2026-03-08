/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppRootContent } from "./AppRootContent";

vi.mock("./AppEntryGuards", () => ({
  PwaInstallabilityGuard: () => <div>pwa-installability-guard</div>,
  SignupIntentRedirect: () => <div>signup-intent-redirect</div>,
}));

vi.mock("./StandaloneDeprecatedView", () => ({
  StandaloneDeprecatedView: () => <div>standalone-deprecated-view</div>,
}));

vi.mock("../../components/CookieConsentBanner", () => ({
  CookieConsentBanner: () => <div>cookie-consent-banner</div>,
}));

vi.mock("../../routes/MarketingRoutes", () => ({
  MarketingRoutesFragment: <div>marketing-routes-fragment</div>,
}));

vi.mock("./AppOperationalShell", () => ({
  AppOperationalWrapper: () => <div>app-operational-wrapper</div>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    Routes: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Route: ({ element }: { element?: ReactNode }) => <>{element}</>,
  };
});

describe("AppRootContent", () => {
  it("renders the standalone deprecated view when standalone mode is active", () => {
    render(<AppRootContent standalone={true} />);

    expect(screen.getByText("standalone-deprecated-view")).toBeTruthy();
    expect(screen.queryByText("cookie-consent-banner")).toBeNull();
  });

  it("renders guards, marketing routes, and the operational wrapper in normal mode", () => {
    render(<AppRootContent standalone={false} />);

    expect(screen.getByText("pwa-installability-guard")).toBeTruthy();
    expect(screen.getByText("signup-intent-redirect")).toBeTruthy();
    expect(screen.getByText("cookie-consent-banner")).toBeTruthy();
    expect(screen.getByText("marketing-routes-fragment")).toBeTruthy();
    expect(screen.getByText("app-operational-wrapper")).toBeTruthy();
  });
});
