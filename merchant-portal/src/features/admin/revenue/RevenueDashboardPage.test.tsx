import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RevenueDashboardPage } from "./RevenueDashboardPage";

const mockUseRevenueDashboard = vi.fn();
vi.mock("./useRevenueDashboard", () => ({
  useRevenueDashboard: () => mockUseRevenueDashboard(),
}));

const mockTrack = vi.fn();
vi.mock("../../../commercial/tracking", () => ({
  commercialTracking: { track: (...args: unknown[]) => mockTrack(...args) },
  detectDevice: () => "desktop",
  isCommercialTrackingEnabled: () => true,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <RevenueDashboardPage />
    </MemoryRouter>
  );
}

const baseData = {
  totalMrrCents: 247500,
  totalArrCents: 2970000,
  activeOrgs: 42,
  graceOrgs: 2,
  suspendedOrgs: 1,
  revenueByCountry: [
    { country: "PT", mrrCents: 148500, orgCount: 18 },
    { country: "ES", mrrCents: 66000, orgCount: 12 },
  ],
  churnRatePct: 2.4,
  mrrGrowthMonthOverMonthPct: null,
  arpuCents: 5893,
  ltvCents: 245500,
  nrrPct: 102.5,
  arrGrowthYoYPct: 18.2,
};

describe("RevenueDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRevenueDashboard.mockReturnValue({
      data: baseData,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it("renders values", () => {
    renderPage();
    expect(screen.getByText(/€2,475/)).toBeTruthy();
    expect(screen.getByText(/€29,700/)).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("renders breakdown table", () => {
    renderPage();
    expect(screen.getByText("Revenue by country")).toBeTruthy();
    expect(screen.getByText("PT")).toBeTruthy();
    expect(screen.getByText("ES")).toBeTruthy();
    expect(screen.getByText(/€1,485/)).toBeTruthy();
    expect(screen.getByText(/€660/)).toBeTruthy();
    expect(screen.getByText("18")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("shows churn rate", () => {
    renderPage();
    expect(screen.getByText("2.4%")).toBeTruthy();
  });

  it("shows badge when MRR growth > 15% and churn < 3%", () => {
    mockUseRevenueDashboard.mockReturnValue({
      data: {
        ...baseData,
        mrrGrowthMonthOverMonthPct: 18,
        churnRatePct: 2,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Enterprise growth accelerating/)).toBeTruthy();
  });

  it("does not show badge when MRR growth <= 15%", () => {
    mockUseRevenueDashboard.mockReturnValue({
      data: { ...baseData, mrrGrowthMonthOverMonthPct: 14 },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    renderPage();
    expect(screen.queryByText(/Enterprise growth accelerating/)).toBeNull();
  });

  it("does not show badge when churn >= 3%", () => {
    mockUseRevenueDashboard.mockReturnValue({
      data: {
        ...baseData,
        mrrGrowthMonthOverMonthPct: 20,
        churnRatePct: 3.5,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    renderPage();
    expect(screen.queryByText(/Enterprise growth accelerating/)).toBeNull();
  });

  it("does not show badge when mrrGrowthMonthOverMonthPct is null", () => {
    renderPage();
    expect(screen.queryByText(/Enterprise growth accelerating/)).toBeNull();
  });

  it("renders new cards ARPU, LTV, NRR, ARR Growth YoY", () => {
    renderPage();
    expect(screen.getByText("ARPU")).toBeTruthy();
    expect(screen.getByText("LTV")).toBeTruthy();
    expect(screen.getByText("Net Revenue Retention %")).toBeTruthy();
    expect(screen.getByText("ARR Growth YoY %")).toBeTruthy();
    expect(screen.getByText(/€59/)).toBeTruthy();
    expect(screen.getByText(/€2,455/)).toBeTruthy();
    expect(screen.getByText("102.5%")).toBeTruthy();
    expect(screen.getByText("18.2%")).toBeTruthy();
  });

  it("renders em dash when ARPU/LTV/NRR/ARR Growth are null", () => {
    mockUseRevenueDashboard.mockReturnValue({
      data: {
        ...baseData,
        arpuCents: null,
        ltvCents: null,
        nrrPct: null,
        arrGrowthYoYPct: null,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    renderPage();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("tracks admin_revenue_metric_view on card hover", () => {
    renderPage();
    const mrrCard = screen.getByText("Total MRR").closest("[role='group']");
    expect(mrrCard).toBeTruthy();
    if (mrrCard) fireEvent.mouseEnter(mrrCard);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "admin_revenue_metric_view",
        metric: "total_mrr",
      })
    );
  });

  it("tracks admin_revenue_growth_flag when badge appears", () => {
    mockUseRevenueDashboard.mockReturnValue({
      data: {
        ...baseData,
        mrrGrowthMonthOverMonthPct: 18,
        churnRatePct: 2,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Enterprise growth accelerating/)).toBeTruthy();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "admin_revenue_growth_flag",
        growthPct: 18,
      })
    );
  });

  it("tracks admin_revenue_dashboard_view when data loads", () => {
    renderPage();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "admin_revenue_dashboard_view" })
    );
  });

  it("calls refresh when Refresh button clicked", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    mockUseRevenueDashboard.mockReturnValue({
      data: baseData,
      loading: false,
      error: null,
      refresh,
    });
    renderPage();
    await user.click(screen.getByRole("button", { name: /Refresh/ }));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders loading state", () => {
    mockUseRevenueDashboard.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refresh: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Carregando métricas/)).toBeTruthy();
  });

  it("renders error state with retry", () => {
    mockUseRevenueDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: "Failed to load",
      refresh: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Erro ao carregar/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeTruthy();
  });
});
