import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommercialDebugPage } from "./CommercialDebugPage";

const {
  mockIsCommercialTrackingEnabled,
  mockGetLeadScore,
  mockIsLeadHot,
  mockGetBufferedLeads,
  mockDetectDevice,
  mockSubscribe,
  mockGetBuffer,
  mockGetFunnelMetrics,
  mockGetFunnelSegmentation,
  mockGetFunnelSnapshotCsv,
  mockComputeActivationIntelligenceInsights,
  mockComputeActivationRecommendedActions,
} = vi.hoisted(() => ({
  mockIsCommercialTrackingEnabled: vi.fn(),
  mockGetLeadScore: vi.fn(),
  mockIsLeadHot: vi.fn(),
  mockGetBufferedLeads: vi.fn(),
  mockDetectDevice: vi.fn(),
  mockSubscribe: vi.fn(),
  mockGetBuffer: vi.fn(),
  mockGetFunnelMetrics: vi.fn(),
  mockGetFunnelSegmentation: vi.fn(),
  mockGetFunnelSnapshotCsv: vi.fn(),
  mockComputeActivationIntelligenceInsights: vi.fn(),
  mockComputeActivationRecommendedActions: vi.fn(),
}));

vi.mock("../tracking", () => ({
  clearBufferedLeads: vi.fn(),
  detectDevice: () => mockDetectDevice(),
  getBufferedLeads: () => mockGetBufferedLeads(),
  getLeadScore: () => mockGetLeadScore(),
  isCommercialTrackingEnabled: () => mockIsCommercialTrackingEnabled(),
  isLeadHot: () => mockIsLeadHot(),
  resetLeadScore: vi.fn(),
  computeActivationIntelligenceInsights: (...args: unknown[]) =>
    mockComputeActivationIntelligenceInsights(...args),
  computeActivationRecommendedActions: (...args: unknown[]) =>
    mockComputeActivationRecommendedActions(...args),
  commercialTracking: {
    subscribe: (...args: unknown[]) => mockSubscribe(...args),
    getBuffer: () => mockGetBuffer(),
    getFunnelMetrics: () => mockGetFunnelMetrics(),
    getFunnelSegmentation: () => mockGetFunnelSegmentation(),
    getFunnelSnapshotCsv: () => mockGetFunnelSnapshotCsv(),
    track: vi.fn(),
    clearBuffer: vi.fn(),
  },
}));

function renderPage(path = "/debug/commercial") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/debug/commercial" element={<CommercialDebugPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CommercialDebugPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockIsCommercialTrackingEnabled.mockReturnValue(true);
    mockGetLeadScore.mockReturnValue(42);
    mockIsLeadHot.mockReturnValue(true);
    mockGetBufferedLeads.mockReturnValue([]);
    mockDetectDevice.mockReturnValue("desktop");
    mockGetBuffer.mockReturnValue([]);
    mockSubscribe.mockReturnValue(() => undefined);
    mockGetFunnelSnapshotCsv.mockReturnValue("dimension,key\nglobal,all");
    mockComputeActivationIntelligenceInsights.mockReturnValue({
      worstDropoffStep: "shift_opened",
      activationVelocityScore: 58,
      orgClassification: "Slow activators",
      alerts: [
        "Activation slowing 32% MoM",
        "Dropoff increased at shift_opened step",
      ],
    });
    mockComputeActivationRecommendedActions.mockReturnValue([
      {
        title: "Auto-open first shift after onboarding",
        reason:
          "Activation drops between first order and operational shift setup",
        automation: "Enable one-click auto-open shift suggestion",
      },
      {
        title: "Add shift-start checklist prompt",
        reason: "Users need explicit guidance to open first operational shift",
        automation: "Send in-app shift checklist reminder",
      },
      {
        title: "Send onboarding email sequence",
        reason: "Accounts are progressing but too slowly",
        automation: "Enroll account in activation drip campaign",
      },
    ]);
    mockGetFunnelMetrics.mockReturnValue({
      totalEvents: 10,
      pageViews: 5,
      pricingViews: 3,
      ctaClicks: 2,
      leadSubmits: 1,
      trialStarts: 4,
      firstOrders: 2,
      firstMenus: 2,
      firstLogins: 3,
      firstShifts: 2,
      firstPayments: 1,
      rates: {
        pricingFromPage: 0.6,
        ctaFromPricing: 2 / 3,
        leadFromCta: 0.5,
        leadFromPage: 0.2,
        activationRate: 0.5,
      },
      activation: {
        activationRate: 0.5,
        trialConversionRate: 0.25,
        timeToFirstOrderHoursAvg: 3.25,
        timeToFirstOrderHoursMedian: 3,
        revenuePerActivatedTrialCents: 1599,
        dropoffStep: {
          onboarding: 1,
          firstOrder: 1,
          paidConversion: 1,
          activated: 2,
        },
      },
    });
    mockGetFunnelSegmentation.mockReturnValue({
      global: {
        totalEvents: 10,
        pageViews: 5,
        pricingViews: 3,
        ctaClicks: 2,
        leadSubmits: 1,
        trialStarts: 4,
        firstOrders: 2,
        firstMenus: 2,
        firstLogins: 3,
        firstShifts: 2,
        firstPayments: 1,
        rates: {
          pricingFromPage: 0.6,
          ctaFromPricing: 2 / 3,
          leadFromCta: 0.5,
          leadFromPage: 0.2,
          activationRate: 0.5,
        },
        activation: {
          activationRate: 0.5,
          trialConversionRate: 0.25,
          timeToFirstOrderHoursAvg: 3.25,
          timeToFirstOrderHoursMedian: 3,
          revenuePerActivatedTrialCents: 1599,
          dropoffStep: {
            onboarding: 1,
            firstOrder: 1,
            paidConversion: 1,
            activated: 2,
          },
        },
      },
      byCountry: {
        gb: {
          totalEvents: 8,
          pageViews: 4,
          pricingViews: 2,
          ctaClicks: 2,
          leadSubmits: 1,
          trialStarts: 3,
          firstOrders: 2,
          firstMenus: 2,
          firstLogins: 3,
          firstShifts: 2,
          firstPayments: 1,
          rates: {
            pricingFromPage: 0.5,
            ctaFromPricing: 1,
            leadFromCta: 0.5,
            leadFromPage: 0.25,
            activationRate: 2 / 3,
          },
          activation: {
            activationRate: 2 / 3,
            trialConversionRate: 1 / 3,
            timeToFirstOrderHoursAvg: 3,
            timeToFirstOrderHoursMedian: 3,
            revenuePerActivatedTrialCents: 1599,
            dropoffStep: {
              onboarding: 0,
              firstOrder: 1,
              paidConversion: 1,
              activated: 2,
            },
          },
        },
      },
      bySegment: {
        small: {
          totalEvents: 10,
          pageViews: 5,
          pricingViews: 3,
          ctaClicks: 2,
          leadSubmits: 1,
          trialStarts: 4,
          firstOrders: 2,
          firstMenus: 2,
          firstLogins: 3,
          firstShifts: 2,
          firstPayments: 1,
          rates: {
            pricingFromPage: 0.6,
            ctaFromPricing: 2 / 3,
            leadFromCta: 0.5,
            leadFromPage: 0.2,
            activationRate: 0.5,
          },
          activation: {
            activationRate: 0.5,
            trialConversionRate: 0.25,
            timeToFirstOrderHoursAvg: 3.25,
            timeToFirstOrderHoursMedian: 3,
            revenuePerActivatedTrialCents: 1599,
            dropoffStep: {
              onboarding: 1,
              firstOrder: 1,
              paidConversion: 1,
              activated: 2,
            },
          },
        },
      },
      byDevice: {},
      bySource: {},
      byCampaign: {},
    });
  });

  it("renders disabled state when tracking is off", () => {
    mockIsCommercialTrackingEnabled.mockReturnValue(false);

    renderPage();

    expect(screen.getByText(/Commercial Tracking Disabled/i)).toBeTruthy();
  });

  it("renders sales funnel baseline metrics and rates", () => {
    renderPage();

    expect(screen.getByText("Sales Funnel Baseline")).toBeTruthy();
    expect(screen.getByText("Page Views")).toBeTruthy();
    expect(screen.getByText("Pricing Views")).toBeTruthy();
    expect(screen.getByText("CTA Clicks")).toBeTruthy();
    expect(screen.getByText("Lead Submits")).toBeTruthy();
    expect(screen.getByText("Trial Starts")).toBeTruthy();
    expect(screen.getByText("First Orders")).toBeTruthy();
    expect(screen.getByText("First Payments")).toBeTruthy();
    expect(screen.getByText("Buffered Events")).toBeTruthy();

    expect(screen.getByText("60.0%")).toBeTruthy();
    expect(screen.getByText("66.7%")).toBeTruthy();
    expect(screen.getAllByText("50.0%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("20.0%").length).toBeGreaterThan(0);

    expect(screen.getByText("By Country")).toBeTruthy();
    expect(screen.getByText("By Segment")).toBeTruthy();
    expect(screen.getByText("Activation Intelligence")).toBeTruthy();
    expect(screen.getByText("Activation Intelligence Layer v2")).toBeTruthy();
    expect(screen.getByText("Worst Dropoff Step")).toBeTruthy();
    expect(screen.getByText("Activation Velocity Score")).toBeTruthy();
    expect(screen.getByText("Org Class")).toBeTruthy();
    expect(screen.getByText("Slow activators")).toBeTruthy();
    expect(screen.getByText("Activation slowing 32% MoM")).toBeTruthy();
    expect(
      screen.getByText("Dropoff increased at shift_opened step"),
    ).toBeTruthy();
    expect(screen.getByText("Top 3 Recommended Actions")).toBeTruthy();
    expect(
      screen.getByText("Auto-open first shift after onboarding"),
    ).toBeTruthy();
    expect(screen.getByText("Add shift-start checklist prompt")).toBeTruthy();
    expect(screen.getByText("Send onboarding email sequence")).toBeTruthy();
    expect(screen.getAllByText("25.0%").length).toBeGreaterThan(0);
    expect(screen.getByText("3.25")).toBeTruthy();
    expect(screen.getByText("1599")).toBeTruthy();
    expect(screen.getByText("Export Funnel Snapshot CSV")).toBeTruthy();
  });
});
