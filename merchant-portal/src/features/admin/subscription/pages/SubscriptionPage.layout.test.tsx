/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubscriptionPage } from "./SubscriptionPage";

vi.mock("../../../../config", () => ({
  CONFIG: {
    canSellPlatform: true,
    STRIPE_IS_TEST: false,
  },
}));

vi.mock("../../dashboard/components/AdminPageHeader", () => ({
  AdminPageHeader: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}));

vi.mock("../useSubscriptionPage", () => ({
  useSubscriptionPage: () => ({
    plans: [{ id: "starter", stripePriceId: "price_123" }],
    usage: [{ id: "meter_1" }],
    billingSummary: { nextChargeDate: null },
    paymentMethod: { brand: "visa", last4: "4242" },
    billingEmail: "billing@example.com",
    invoices: [{ id: "inv_1" }],
    subscription: { status: "active" },
    loading: false,
    error: null,
  }),
}));

vi.mock("../components/PlanCard", () => ({
  PlanCard: () => <div>plan-card</div>,
}));

vi.mock("../components/UsageMeterRow", () => ({
  UsageMeterRow: () => <div>usage-meter-row</div>,
}));

vi.mock("../components/BillingSummaryCard", () => ({
  BillingSummaryCard: () => <div>billing-summary-card</div>,
}));

vi.mock("../components/PaymentMethodCard", () => ({
  PaymentMethodCard: () => <div>payment-method-card</div>,
}));

vi.mock("../components/BillingEmailCard", () => ({
  BillingEmailCard: () => <div>billing-email-card</div>,
}));

vi.mock("../components/InvoicesTable", () => ({
  InvoicesTable: () => <div>invoices-table</div>,
}));

vi.mock("../../../../core/billing/BillingBroker", () => ({
  BillingBroker: {
    startSubscription: vi.fn(),
    openCustomerPortal: vi.fn(),
  },
}));

describe("SubscriptionPage layout", () => {
  it("renders plans, billing controls and invoices sections", () => {
    render(<SubscriptionPage />);

    expect(screen.getAllByText("plan-card").length).toBeGreaterThan(0);
    expect(screen.getByText("invoices-table")).toBeTruthy();
    expect(screen.getByText("billing-summary-card")).toBeTruthy();
    expect(screen.getByText("payment-method-card")).toBeTruthy();
    expect(screen.getByText("billing-email-card")).toBeTruthy();
  });
});
