/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppOperationalChrome } from "./AppOperationalChrome";

vi.mock("../../core/tasks/EventMonitorBootstrap", () => ({
  EventMonitorBootstrap: () => <div>event-monitor-bootstrap</div>,
}));

vi.mock("../../ui/OfflineIndicator", () => ({
  OfflineIndicator: () => <div>offline-indicator</div>,
}));

vi.mock("../../ui/billing/BillingBanner", () => ({
  BillingBanner: () => <div>billing-banner</div>,
}));

vi.mock("../../ui/billing/BillingBlockedView", () => ({
  BillingBlockedView: () => <div>billing-blocked-view</div>,
}));

vi.mock("../../ui/design-system/CoreUnavailableBanner", () => ({
  CoreUnavailableBanner: () => <div>core-unavailable-banner</div>,
}));

vi.mock("../../ui/design-system/ModeIndicator", () => ({
  ModeIndicator: () => <div>mode-indicator</div>,
}));

vi.mock("../../ui/design-system/components/GlobalBlockedView", () => ({
  GlobalBlockedView: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("../../ui/dev/DevInstallabilityResetButton", () => ({
  DevInstallabilityResetButton: () => (
    <div>dev-installability-reset-button</div>
  ),
}));

type RenderProps = Parameters<typeof AppOperationalChrome>[0];

function renderChrome(overrides: Partial<RenderProps> = {}) {
  const props: RenderProps = {
    pathname: "/app/staff/home/manager",
    billingStatus: null,
    isBillingBlocked: false,
    isTrialExpired: false,
    children: <div>operational-routes</div>,
    ...overrides,
  };

  return render(<AppOperationalChrome {...props} />);
}

describe("AppOperationalChrome", () => {
  it("hides the billing banner and dev button on AppStaff paths", () => {
    renderChrome();

    expect(screen.queryByText("billing-banner")).toBeNull();
    expect(screen.queryByText("dev-installability-reset-button")).toBeNull();
    expect(screen.getByText("operational-routes")).toBeTruthy();
  });

  it("hides the billing banner on dashboard and operational surfaces", () => {
    const { rerender } = renderChrome({ pathname: "/dashboard" });
    expect(screen.queryByText("billing-banner")).toBeNull();

    rerender(
      <AppOperationalChrome
        pathname="/op/tpv/orders"
        billingStatus={null}
        isBillingBlocked={false}
        isTrialExpired={false}
      >
        <div>operational-routes</div>
      </AppOperationalChrome>,
    );

    expect(screen.queryByText("billing-banner")).toBeNull();
  });

  it("shows the expired trial block before rendering operational chrome", () => {
    renderChrome({ isTrialExpired: true, pathname: "/admin/modules" });

    expect(screen.getByText("Período de trial terminado")).toBeTruthy();
    expect(screen.queryByText("operational-routes")).toBeNull();
  });

  it("shows the billing blocked view before rendering operational chrome", () => {
    renderChrome({ isBillingBlocked: true, pathname: "/admin/modules" });

    expect(screen.getByText("billing-blocked-view")).toBeTruthy();
    expect(screen.queryByText("operational-routes")).toBeNull();
  });

  it("shows the past due block on critical operational billing routes", () => {
    renderChrome({ billingStatus: "past_due", pathname: "/op/tpv" });

    expect(screen.getByText("Pagamento pendente")).toBeTruthy();
    expect(screen.queryByText("operational-routes")).toBeNull();
  });

  it("renders the standard chrome widgets around operational content", () => {
    renderChrome({ pathname: "/admin/modules" });

    expect(screen.getByText("event-monitor-bootstrap")).toBeTruthy();
    expect(screen.getByText("offline-indicator")).toBeTruthy();
    expect(screen.getByText("dev-installability-reset-button")).toBeTruthy();
    expect(screen.getByText("mode-indicator")).toBeTruthy();
    expect(screen.getByText("core-unavailable-banner")).toBeTruthy();
  });

  it("hides dev reset button on staff paths but shows on admin paths", () => {
    const { rerender } = renderChrome({ pathname: "/app/staff/home" });
    expect(screen.queryByText("dev-installability-reset-button")).toBeNull();

    rerender(
      <AppOperationalChrome
        pathname="/admin/modules"
        billingStatus={null}
        isBillingBlocked={false}
        isTrialExpired={false}
      >
        <div>operational-routes</div>
      </AppOperationalChrome>,
    );
    expect(screen.getByText("dev-installability-reset-button")).toBeTruthy();
  });
});
