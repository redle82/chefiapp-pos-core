import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TPVShiftPage } from "./TPVShiftPage";

const getOpenCashRegister = vi.fn();
const openCashRegister = vi.fn();
const closeCashRegister = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const texts: Record<string, string> = {
        "page.title": "Turno e Caixa",
        "page.subtitle": "Abertura e fecho de caixa do turno actual.",
        "page.registerOpen": "Caixa aberto",
        "page.registerClosed": "Caixa fechado",
        "page.expectedBalance": "Saldo esperado",
        "page.closeButton": "Fechar turno",
        "page.initialBalance": "Saldo inicial",
        "page.openButton": "Abrir turno",
        "page.openTitle": "Abrir Caixa",
        "page.openDescription": "Preencha o valor inicial.",
        "page.operatorLabel": "Caixa",
        "page.closingBalanceLabel": "Saldo final (contagem)",
        "page.closingNameLabel": "Caixa de fecho",
        "page.sales": "Vendas",
        "page.defaultOperator": "Caixa TPV",
        "page.defaultRegisterName": "Caixa Principal",
        "page.loadingCash": "A carregar estado do caixa...",
      };
      return texts[key] || (typeof fallback === "string" ? fallback : key);
    },
    i18n: { changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

vi.mock("./hooks/useTPVRestaurantId", () => ({
  useTPVRestaurantId: () => "rest-1",
}));

vi.mock("../../core/shift/ShiftContext", () => ({
  useShift: () => ({
    isShiftOpen: false,
    isChecking: false,
    lastCheckedAt: null,
    refreshShiftStatus: vi.fn().mockResolvedValue(undefined),
    markShiftOpen: vi.fn(),
  }),
}));

vi.mock("../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    formatAmount: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
    currency: "BRL",
    symbol: "R$",
  }),
}));

vi.mock("../../core/tpv/CashRegister", () => ({
  CashRegisterEngine: {
    getOpenCashRegister: (...args: unknown[]) => getOpenCashRegister(...args),
    openCashRegister: (...args: unknown[]) => openCashRegister(...args),
    closeCashRegister: (...args: unknown[]) => closeCashRegister(...args),
  },
}));

// Mock design system components to avoid CSS import issues
vi.mock("../../ui/design-system/Card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock("../../ui/design-system/KpiCard", () => ({
  KpiCard: ({ label, value }: { label: string; value: string }) => <div data-testid="kpi">{label}: {value}</div>,
}));

vi.mock("../../ui/design-system/Skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("../../ui/design-system/InlineAlert", () => ({
  InlineAlert: ({ message }: { message: string }) => <div role="alert">{message}</div>,
}));

vi.mock("../../ui/design-system/Button", () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

describe("TPVShiftPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows open register summary when shift is open", async () => {
    getOpenCashRegister.mockResolvedValue({
      id: "reg-1",
      restaurantId: "rest-1",
      name: "Caixa Principal",
      status: "open",
      openedAt: new Date("2026-02-16T10:00:00Z"),
      openedBy: "Caixa TPV",
      openingBalanceCents: 5000,
      totalSalesCents: 25000,
      createdAt: new Date("2026-02-16T10:00:00Z"),
      updatedAt: new Date("2026-02-16T10:00:00Z"),
    });

    render(<TPVShiftPage />);

    expect(await screen.findByText(/Caixa aberto/i)).toBeTruthy();
    expect(screen.getByText(/Saldo esperado/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Fechar turno/i })).toBeTruthy();
  });

  it("shows open form when register is closed", async () => {
    getOpenCashRegister.mockResolvedValue(null);

    render(<TPVShiftPage />);

    // Wait for the form to appear
    expect(await screen.findByRole("button", { name: /Abrir turno/i })).toBeTruthy();
    expect(screen.getByText(/Caixa fechado/i)).toBeTruthy();
    // Should have inputs for cash and operator
    expect(screen.getAllByRole("textbox").length).toBeGreaterThanOrEqual(2);
  });
});
