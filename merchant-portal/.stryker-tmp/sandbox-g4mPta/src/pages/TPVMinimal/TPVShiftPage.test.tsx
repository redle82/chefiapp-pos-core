import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TPVShiftPage } from "./TPVShiftPage";

const getOpenCashRegister = vi.fn();
const openCashRegister = vi.fn();
const closeCashRegister = vi.fn();

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

vi.mock("../../core/tpv/CashRegister", () => ({
  CashRegisterEngine: {
    getOpenCashRegister: (...args: unknown[]) => getOpenCashRegister(...args),
    openCashRegister: (...args: unknown[]) => openCashRegister(...args),
    closeCashRegister: (...args: unknown[]) => closeCashRegister(...args),
  },
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
      openedBy: "Operador TPV",
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

  it("opens a shift with the provided initial cash", async () => {
    getOpenCashRegister.mockResolvedValue(null);
    openCashRegister.mockResolvedValue({ id: "reg-2" });

    render(<TPVShiftPage />);

    const input = await screen.findByLabelText(/Saldo inicial/i);
    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /Abrir turno/i }));

    await waitFor(() => {
      expect(openCashRegister).toHaveBeenCalled();
    });

    expect(openCashRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: "rest-1",
        openingBalanceCents: 1000,
        openedBy: "Operador TPV",
        name: "Caixa Principal",
      }),
    );
  });
});
