import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EnterpriseDashboardPage } from "./EnterpriseDashboardPage";

const mockOrgId = "org-123";

const mockConfig = vi.hoisted(() => ({ ENTERPRISE_DASHBOARD_ENABLED: true }));
vi.mock("../../../../config", () => ({
  CONFIG: mockConfig,
}));

const mockUseTenant = vi.fn();
vi.mock("../../../../core/tenant/TenantContext", () => ({
  useTenant: () => mockUseTenant(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseOrgConsolidation = vi.fn();
vi.mock("../useOrgConsolidation", () => ({
  useOrgConsolidation: (...args: unknown[]) =>
    mockUseOrgConsolidation(...args),
}));

const mockTrack = vi.fn();
vi.mock("../../../../commercial/tracking", () => ({
  commercialTracking: { track: (...args: unknown[]) => mockTrack(...args) },
  detectDevice: () => "desktop",
  isCommercialTrackingEnabled: () => true,
}));

const mockIsLeadHot = vi.fn();
vi.mock("../../../../commercial/tracking/leadScoring", () => ({
  isLeadHot: () => mockIsLeadHot(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EnterpriseDashboardPage />
    </MemoryRouter>
  );
}

const baseMockReturn = {
  date: "2026-02-25",
  setDate: vi.fn(),
  refetch: vi.fn(),
  weekDataPerLocation: [] as { restaurant_id: string; restaurant_name: string; days: { date: string; discrepancyCents: number }[] }[],
  weekRevenueByDate: [] as { date: string; revenueCents: number }[],
  loadingWeek: false,
  fetchWeek: vi.fn(),
};

const greenData = {
  total_locations: 3,
  total_revenue_cents: 150000,
  total_discrepancy_cents: 0,
  overall_status: "green" as const,
  locations: [
    {
      restaurant_id: "r1",
      restaurant_name: "Restaurante A",
      revenue_cents: 50000,
      discrepancy_cents: 0,
      status: "green" as const,
    },
    {
      restaurant_id: "r2",
      restaurant_name: "Restaurante B",
      revenue_cents: 50000,
      discrepancy_cents: 0,
      status: "green" as const,
    },
  ],
};

const redData = {
  ...greenData,
  total_discrepancy_cents: 5000,
  overall_status: "red" as const,
  locations: [
    {
      restaurant_id: "r1",
      restaurant_name: "Restaurante A",
      revenue_cents: 50000,
      discrepancy_cents: 2500,
      status: "red" as const,
    },
  ],
};

describe("EnterpriseDashboardPage", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.ENTERPRISE_DASHBOARD_ENABLED = true;
    mockIsLeadHot.mockReturnValue(false);
    mockUseTenant.mockReturnValue({
      organization: { id: mockOrgId },
    });

    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
  });

  it("renders loading state", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: null,
      loading: true,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/Carregando dados/)).toBeTruthy();
  });

  it("renders empty when no orgId with CTA to modules", () => {
    mockUseTenant.mockReturnValue({ organization: null });
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: null,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/No organization linked/)).toBeTruthy();
    const cta = screen.getByRole("button", { name: /Configurar módulos/ });
    expect(cta).toBeTruthy();
  });

  it("renders empty state when no data with date picker", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: {
        total_locations: 0,
        total_revenue_cents: 0,
        total_discrepancy_cents: 0,
        overall_status: "green",
        locations: [],
      },
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/No consolidation data for this date/)).toBeTruthy();
    expect(document.querySelector('input[type="date"]')).toBeTruthy();
  });

  it("RPC 404 shows backend-not-installed state, upsell CTA, and tracks enterprise_backend_missing + enterprise_upsell_view", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: null,
      loading: false,
      error: "Function not available",
      errorKind: "backend_missing" as const,
    });
    renderPage();
    expect(screen.getByText(/Enterprise backend not installed yet/)).toBeTruthy();
    expect(screen.getByText(/Core migration required/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /How to enable/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Enable Enterprise Financial Control/ })).toBeTruthy();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_backend_missing" })
    );
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_upsell_view" })
    );
  });

  it("feature flag off shows disabled screen", () => {
    mockConfig.ENTERPRISE_DASHBOARD_ENABLED = false;
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/Dashboard Enterprise desativado/)).toBeTruthy();
    mockConfig.ENTERPRISE_DASHBOARD_ENABLED = true;
  });

  it("date change triggers setDate and tracks enterprise_date_change", () => {
    const setDate = vi.fn();
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
      setDate,
    });
    renderPage();
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    fireEvent.change(dateInput, { target: { value: "2026-03-01" } });
    expect(setDate).toHaveBeenCalledWith("2026-03-01");
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_date_change", date: "2026-03-01" })
    );
  });

  it("heatmap toggle tracks enterprise_heatmap_toggle", async () => {
    const user = userEvent.setup();
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /Ver heatmap semanal/ });
    await user.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_heatmap_toggle", enabled: true })
    );
  });

  it("heatmap day click tracks enterprise_heatmap_day_click", async () => {
    const user = userEvent.setup();
    const setDate = vi.fn();
    const weekData = [
      {
        restaurant_id: "r1",
        restaurant_name: "Restaurante A",
        days: [
          { date: "2026-02-24", discrepancyCents: 0 },
          { date: "2026-02-25", discrepancyCents: 100 },
        ],
      },
    ];
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
      setDate,
      weekDataPerLocation: weekData,
    });
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /Ver heatmap semanal/ });
    await user.click(checkbox);
    const dayButton = screen.getByRole("button", { name: /24/ });
    await user.click(dayButton);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_heatmap_day_click", date: "2026-02-24" })
    );
  });

  it("renders green org with OrgStatusHeader and OrgLocationsTable", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText("Enterprise")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Restaurante A")).toBeTruthy();
  });

  it("renders Financial Risk Score card when data exists", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText("Financial Risk Score")).toBeTruthy();
  });

  it("renders high risk banner when risk level is high_risk", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: redData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/Alto Risco Financeiro/)).toBeTruthy();
  });

  it("tracks enterprise_risk_view when risk card is shown", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_risk_view" })
    );
  });

  it("tracks enterprise_risk_high when high_risk", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: redData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_risk_high" })
    );
  });

  it("tracks enterprise_trend_detected when heatmap has trend or escalation", () => {
    const weekData = [
      {
        restaurant_id: "r1",
        restaurant_name: "Rest A",
        days: [
          { date: "2026-02-24", discrepancyCents: 500 },
          { date: "2026-02-25", discrepancyCents: 500 },
          { date: "2026-02-26", discrepancyCents: 500 },
        ],
      },
    ];
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
      weekDataPerLocation: weekData,
    });
    renderPage();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_trend_detected" })
    );
  });

  it("renders red banner when overall_status is red", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: redData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/Alerta:/)).toBeTruthy();
    expect(screen.getByText(/discrepância crítica/)).toBeTruthy();
  });

  it("export produces CSV blob and tracks enterprise_export_click", async () => {
    const user = userEvent.setup();
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();

    const exportBtn = screen.getByRole("button", {
      name: /Export Consolidated CSV/,
    });
    await user.click(exportBtn);

    expect(createObjectURL).toHaveBeenCalled();
    const blobArg = createObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe("text/csv;charset=utf-8;");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_export_click" })
    );
  });

  it("tracks enterprise_health_banner_view when data with green status", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_health_banner_view" })
    );
  });

  it("renders health banner green: All locations financially reconciled", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/All locations financially reconciled/)).toBeTruthy();
  });

  it("renders health banner yellow with discrepancy %", () => {
    const yellowData = {
      ...greenData,
      total_discrepancy_cents: 1500,
      total_revenue_cents: 150000,
      overall_status: "yellow" as const,
    };
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: yellowData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/Warning/)).toBeTruthy();
    expect(screen.getByText(/1\.00% of revenue/)).toBeTruthy();
  });

  it("renders health banner red with Review discrepancies CTA", () => {
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: redData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/Critical/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Review discrepancies/ })).toBeTruthy();
  });

  it("renders RevenueTrendMiniChart when heatmap enabled and weekRevenueByDate has data", async () => {
    const user = userEvent.setup();
    const weekRevenue = [
      { date: "2026-02-24", revenueCents: 50000 },
      { date: "2026-02-25", revenueCents: 60000 },
    ];
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
      weekRevenueByDate: weekRevenue,
      fetchWeek: vi.fn().mockResolvedValue(undefined),
    });
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /Ver heatmap semanal/ });
    await user.click(checkbox);
    expect(screen.getByText(/Revenue trend \(7 days\)/)).toBeTruthy();
  });

  it("tracks enterprise_trend_view when weekRevenueByDate has data", async () => {
    const user = userEvent.setup();
    const weekRevenue = [
      { date: "2026-02-24", revenueCents: 50000 },
      { date: "2026-02-25", revenueCents: 60000 },
    ];
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
      weekRevenueByDate: weekRevenue,
      fetchWeek: vi.fn().mockResolvedValue(undefined),
    });
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /Ver heatmap semanal/ });
    await user.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_trend_view" })
    );
  });

  it("renders enterprise upsell CTA when feature disabled and tracks enterprise_upsell_view", () => {
    mockConfig.ENTERPRISE_DASHBOARD_ENABLED = false;
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByRole("button", { name: /Enable Enterprise Financial Control/ })).toBeTruthy();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_upsell_view" })
    );
    mockConfig.ENTERPRISE_DASHBOARD_ENABLED = true;
  });

  it("tracks enterprise_upsell_click when upsell CTA clicked", async () => {
    const user = userEvent.setup();
    mockConfig.ENTERPRISE_DASHBOARD_ENABLED = false;
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    const cta = screen.getByRole("button", { name: /Enable Enterprise Financial Control/ });
    await user.click(cta);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "enterprise_upsell_click" })
    );
    mockConfig.ENTERPRISE_DASHBOARD_ENABLED = true;
  });

  it("renders High Intent Organization badge when isLeadHot", () => {
    mockIsLeadHot.mockReturnValue(true);
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
    });
    renderPage();
    expect(screen.getByText(/High Intent Organization/)).toBeTruthy();
  });

  it("export with heatmap enabled creates CSV blob", async () => {
    const user = userEvent.setup();
    const weekData = [
      {
        restaurant_id: "r1",
        restaurant_name: "Restaurante A",
        days: [
          { date: "2026-02-24", discrepancyCents: 0 },
          { date: "2026-02-25", discrepancyCents: 100 },
        ],
      },
    ];
    mockUseOrgConsolidation.mockReturnValue({
      ...baseMockReturn,
      data: greenData,
      loading: false,
      error: null,
      errorKind: null,
      weekDataPerLocation: weekData,
    });
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /Ver heatmap semanal/ });
    await user.click(checkbox);
    const exportBtn = screen.getByRole("button", {
      name: /Export Consolidated CSV/,
    });
    await user.click(exportBtn);
    expect(createObjectURL).toHaveBeenCalled();
    const blobArg = createObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe("text/csv;charset=utf-8;");
  });
});
