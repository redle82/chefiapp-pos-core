import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShiftReport, type ShiftReportProps } from "./ShiftReport";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      if (typeof fallback === "string") return fallback;
      if (typeof fallback === "object" && fallback !== null) {
        // Handle interpolation like {{count}}
        let text = key;
        for (const [k, v] of Object.entries(fallback)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
        return text;
      }
      return key;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    formatAmount: (cents: number) => `€${(cents / 100).toFixed(2)}`,
    currency: "EUR",
  }),
}));

const baseRegister: ShiftReportProps["register"] = {
  id: "reg-1",
  name: "Main Register",
  openedBy: "Alice",
  closedBy: "Bob",
  openingBalanceCents: 10000,
  closingBalanceCents: 35000,
  totalSalesCents: 25000,
  openedAt: "2026-03-17T08:00:00Z",
  closedAt: "2026-03-17T22:00:00Z",
};

const basePayments: ShiftReportProps["payments"] = {
  cash: { count: 15, totalCents: 12000 },
  card: { count: 30, totalCents: 10000 },
  pix: { count: 5, totalCents: 3000 },
};

const baseOrderStats: ShiftReportProps["orderStats"] = {
  totalOrders: 50,
  averageOrderCents: 500,
  largestOrderCents: 4500,
  cancelledOrders: 3,
  cancelledValueCents: 1500,
};

function renderReport(overrides: Partial<ShiftReportProps> = {}) {
  const defaultProps: ShiftReportProps = {
    register: baseRegister,
    payments: basePayments,
    orderStats: baseOrderStats,
    onPrint: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...render(<ShiftReport {...defaultProps} />), props: defaultProps };
}

describe("ShiftReport", () => {
  it("renders register name and operator", () => {
    renderReport();
    expect(screen.getByTestId("register-name").textContent).toBe(
      "Main Register",
    );
    expect(screen.getByTestId("opened-by").textContent).toBe("Alice");
  });

  it("shows financial KPIs", () => {
    renderReport();
    // Opening balance: 10000 cents = €100.00
    expect(screen.getByTestId("opening-balance").textContent).toBe("€100.00");
    // Total sales: 25000 cents = €250.00
    expect(screen.getByTestId("total-sales").textContent).toBe("€250.00");
    // Expected closing: 10000 + 25000 = 35000 cents = €350.00
    expect(screen.getByTestId("expected-closing").textContent).toBe("€350.00");
    // Actual closing: 35000 cents = €350.00
    expect(screen.getByTestId("actual-closing").textContent).toBe("€350.00");
  });

  it("shows correct difference when balance matches (green)", () => {
    renderReport();
    const diff = screen.getByTestId("difference");
    // 35000 - 35000 = 0 → +€0.00
    expect(diff.textContent).toBe("+€0.00");
    expect(diff.style.color).toBe("rgb(34, 197, 94)"); // #22c55e
  });

  it("shows yellow difference when over", () => {
    renderReport({
      register: { ...baseRegister, closingBalanceCents: 36000 },
    });
    const diff = screen.getByTestId("difference");
    // 36000 - 35000 = +1000 → +€10.00
    expect(diff.textContent).toBe("+€10.00");
    expect(diff.style.color).toBe("rgb(234, 179, 8)"); // #eab308
  });

  it("shows red difference when under", () => {
    renderReport({
      register: { ...baseRegister, closingBalanceCents: 33000 },
    });
    const diff = screen.getByTestId("difference");
    // 33000 - 35000 = -2000 → €-20.00 (formatAmount handles negatives)
    expect(diff.textContent).toContain("€");
    expect(diff.style.color).toBe("rgb(239, 68, 68)"); // #ef4444
  });

  it("shows difference label text", () => {
    // Match
    const { unmount } = renderReport();
    expect(screen.getByTestId("difference-label").textContent).toBe(
      "Correct balance",
    );
    unmount();

    // Over
    const { unmount: u2 } = renderReport({
      register: { ...baseRegister, closingBalanceCents: 36000 },
    });
    expect(screen.getByTestId("difference-label").textContent).toBe("Over");
    u2();

    // Under
    renderReport({
      register: { ...baseRegister, closingBalanceCents: 30000 },
    });
    expect(screen.getByTestId("difference-label").textContent).toBe("Under");
  });

  it("shows payment breakdown with bars", () => {
    renderReport();
    expect(screen.getByTestId("payment-cash")).toBeTruthy();
    expect(screen.getByTestId("payment-card")).toBeTruthy();
    expect(screen.getByTestId("payment-pix")).toBeTruthy();
    // Check bar widths are set
    const cashBar = screen.getByTestId("payment-bar-cash");
    expect(cashBar.style.width).toBeTruthy();
  });

  it("print button calls onPrint", () => {
    const onPrint = vi.fn();
    renderReport({ onPrint });
    fireEvent.click(screen.getByTestId("report-print-btn"));
    expect(onPrint).toHaveBeenCalledOnce();
  });

  it("close button calls onClose", () => {
    const onClose = vi.fn();
    renderReport({ onClose });
    fireEvent.click(screen.getByTestId("report-close-btn"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("handles missing payment data gracefully", () => {
    renderReport({ payments: undefined });
    // Should show no-data message instead of crashing
    expect(screen.queryByTestId("payment-cash")).toBeNull();
    expect(screen.getByText("No payment data available")).toBeTruthy();
  });

  it("handles missing order stats gracefully", () => {
    renderReport({ orderStats: undefined });
    // Should not render operations section
    expect(screen.queryByTestId("total-orders")).toBeNull();
  });

  it("handles missing closingBalanceCents gracefully", () => {
    renderReport({
      register: { ...baseRegister, closingBalanceCents: undefined },
    });
    // actual = 0, expected = 35000, diff = -35000
    const diff = screen.getByTestId("difference");
    expect(diff.style.color).toBe("rgb(239, 68, 68)"); // red — under
  });
});
