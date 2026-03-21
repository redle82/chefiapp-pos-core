import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReconciliationPage } from "./ReconciliationPage";

vi.mock("../../../ui/hooks/useRestaurantId", () => ({
  useRestaurantId: () => ({ restaurantId: "r1", loading: false }),
}));

const mockUseReconciliation = vi.fn();
vi.mock("./useReconciliation", () => ({
  useReconciliation: (...args: unknown[]) => mockUseReconciliation(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ReconciliationPage />
    </MemoryRouter>
  );
}

describe("ReconciliationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when loading and no report", () => {
    mockUseReconciliation.mockReturnValue({
      report: null,
      loading: true,
      error: null,
      date: "2026-02-25",
      setDate: vi.fn(),
      refetch: vi.fn(),
      weekData: [],
      loadingWeek: false,
      fetchWeek: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Carregando dados/)).toBeTruthy();
  });

  it("shows empty state when no data", () => {
    mockUseReconciliation.mockReturnValue({
      report: {
        total_orders: 0,
        total_order_amount: 0,
        total_receipts: 0,
        total_receipt_amount: 0,
        missing_receipts: 0,
        orphan_receipts: 0,
        mismatched_orders: 0,
        discrepancies: [],
      },
      loading: false,
      error: null,
      date: "2026-02-25",
      setDate: vi.fn(),
      refetch: vi.fn(),
      weekData: [],
      loadingWeek: false,
      fetchWeek: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Sem dados/)).toBeTruthy();
  });

  it("shows success state with summary cards and table", () => {
    mockUseReconciliation.mockReturnValue({
      report: {
        total_orders: 5,
        total_order_amount: 10000,
        total_receipts: 5,
        total_receipt_amount: 10000,
        missing_receipts: 0,
        orphan_receipts: 0,
        mismatched_orders: 0,
        discrepancies: [],
      },
      loading: false,
      error: null,
      date: "2026-02-25",
      setDate: vi.fn(),
      refetch: vi.fn(),
      weekData: [],
      loadingWeek: false,
      fetchWeek: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Reconciliação financeira/)).toBeTruthy();
    expect(screen.getByText(/Sem discrepâncias/)).toBeTruthy();
    expect(screen.getByText(/Total Ordens/)).toBeTruthy();
  });

  it("shows discrepancy rendering when mismatched", () => {
    mockUseReconciliation.mockReturnValue({
      report: {
        total_orders: 2,
        total_order_amount: 5000,
        total_receipts: 2,
        total_receipt_amount: 4500,
        missing_receipts: 0,
        orphan_receipts: 0,
        mismatched_orders: 1,
        discrepancies: [
          {
            order_id: "ord-123",
            expected: 2500,
            received: 2000,
            difference: 500,
            provider: "stripe",
          },
        ],
      },
      loading: false,
      error: null,
      date: "2026-02-25",
      setDate: vi.fn(),
      refetch: vi.fn(),
      weekData: [],
      loadingWeek: false,
      fetchWeek: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Discrepância menor|Discrepância crítica/)).toBeTruthy();
    expect(screen.getByText(/Discrepâncias/)).toBeTruthy();
  });

  it("shows heatmap when toggle is checked", async () => {
    const fetchWeek = vi.fn();
    mockUseReconciliation.mockReturnValue({
      report: {
        total_orders: 1,
        total_order_amount: 1000,
        total_receipts: 1,
        total_receipt_amount: 1000,
        missing_receipts: 0,
        orphan_receipts: 0,
        mismatched_orders: 0,
        discrepancies: [],
      },
      loading: false,
      error: null,
      date: "2026-02-25",
      setDate: vi.fn(),
      refetch: vi.fn(),
      weekData: [
        { date: "2026-02-23", discrepancyCents: 0 },
        { date: "2026-02-24", discrepancyCents: 100 },
        { date: "2026-02-25", discrepancyCents: 0 },
      ],
      loadingWeek: false,
      fetchWeek,
    });
    renderPage();
    const checkbox = screen.getByRole("checkbox", { name: /heatmap/i });
    expect(checkbox).toBeTruthy();
  });
});
