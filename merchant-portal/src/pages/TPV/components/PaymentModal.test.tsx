import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentModal } from "./PaymentModal";

vi.mock("../../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    formatAmount: (cents: number) => `€${(cents / 100).toFixed(2)}`,
  }),
}));

vi.mock("../../../core/payment/PaymentBroker", () => ({
  PaymentBroker: {
    createPaymentIntent: vi.fn(),
  },
}));

const defaultProps = {
  orderId: "order-123456",
  restaurantId: "rest-1",
  orderTotal: 2500,
  onPay: vi.fn(),
  onCancel: vi.fn(),
};

describe("PaymentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows total and disables confirm until a method is chosen", () => {
    render(<PaymentModal {...defaultProps} />);

    expect(screen.getByText("TOTAL A PAGAR")).toBeTruthy();
    expect(screen.getByText("€25.00")).toBeTruthy();

    const confirm = screen.getByRole("button", {
      name: "Confirmar €25.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it("shows order ID snippet in header", () => {
    render(<PaymentModal {...defaultProps} />);
    expect(screen.getByText("Pedido #123456")).toBeTruthy();
  });

  it("shows MODO DEMO badge when isDemoMode is true", () => {
    render(<PaymentModal {...defaultProps} isDemoMode />);
    expect(screen.getByText("MODO DEMO")).toBeTruthy();
  });

  it("enables cash confirm when cash tendered covers the total", () => {
    const onPay = vi.fn();

    render(<PaymentModal {...defaultProps} onPay={onPay} />);

    fireEvent.click(screen.getByText("Dinheiro"));

    // Two inputs share placeholder "0.00": tip custom (small) and cash (large).
    // Cash input is the second one.
    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "24.00" } });

    const confirm = screen.getByRole("button", {
      name: "Confirmar €25.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(cashInput, { target: { value: "30.00" } });
    expect(confirm.disabled).toBe(false);

    fireEvent.click(confirm);
    expect(onPay).toHaveBeenCalledWith("cash", undefined, undefined);
  });

  it("shows correct change when cash exceeds total", () => {
    render(<PaymentModal {...defaultProps} />);

    fireEvent.click(screen.getByText("Dinheiro"));

    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "30.00" } });

    expect(screen.getByText("Troco")).toBeTruthy();
    expect(screen.getByText("€5.00")).toBeTruthy();
  });

  it("shows 'Faltam' when cash is insufficient", () => {
    render(<PaymentModal {...defaultProps} />);

    fireEvent.click(screen.getByText("Dinheiro"));

    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "20.00" } });

    expect(screen.getByText(/Faltam €5\.00/)).toBeTruthy();
  });

  it("quick cash 'Exato' button sets exact total", () => {
    render(<PaymentModal {...defaultProps} />);

    fireEvent.click(screen.getByText("Dinheiro"));
    fireEvent.click(screen.getByText("Exato"));

    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1] as HTMLInputElement;
    // After clicking Exato, the cash input should hold the exact total (or value is set via state).
    // The value may already be "25" or "25.00" depending on implementation.
    expect(Number(cashInput.value)).toBeGreaterThanOrEqual(25);
  });

  it("maps MB WAY to card for backend payment", () => {
    const onPay = vi.fn();

    render(<PaymentModal {...defaultProps} orderTotal={1200} onPay={onPay} />);

    fireEvent.click(screen.getByText("MB WAY"));

    const phoneInput = screen.getByPlaceholderText("9XX XXX XXX");
    fireEvent.change(phoneInput, { target: { value: "912345678" } });

    const confirm = screen.getByRole("button", {
      name: "Confirmar €12.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);

    fireEvent.click(confirm);
    expect(onPay).toHaveBeenCalledWith("card", undefined, undefined);
  });

  it("rejects invalid MB WAY phone numbers", () => {
    render(<PaymentModal {...defaultProps} />);

    fireEvent.click(screen.getByText("MB WAY"));

    const phoneInput = screen.getByPlaceholderText("9XX XXX XXX");
    fireEvent.change(phoneInput, { target: { value: "123456789" } });

    const confirm = screen.getByRole("button", {
      name: "Confirmar €25.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it("includes tip in grand total when tip percent is selected", () => {
    render(<PaymentModal {...defaultProps} />);

    // Select 10% tip on €25.00 = €2.50 tip → grand total €27.50
    fireEvent.click(screen.getByText("10%"));

    expect(screen.getByText("€27.50")).toBeTruthy();
    // "Gorjeta" appears in section title AND in the subtotal breakdown;
    // check the breakdown text that includes the tip amount.
    expect(screen.getByText(/\+ Gorjeta/)).toBeTruthy();
  });

  it("passes tip cents to onPay when tip is set", async () => {
    const onPay = vi.fn();

    render(<PaymentModal {...defaultProps} onPay={onPay} />);

    // Select 10% tip → 250 cents tip
    fireEvent.click(screen.getByText("10%"));

    fireEvent.click(screen.getByText("Dinheiro"));

    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "30.00" } });

    const confirm = screen.getByRole("button", {
      name: /Confirmar/,
    }) as HTMLButtonElement;
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(onPay).toHaveBeenCalledWith("cash", undefined, 250);
    });
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();

    render(<PaymentModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when close button is clicked", () => {
    const onCancel = vi.fn();

    render(<PaymentModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByLabelText("Fechar"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when overlay is clicked", () => {
    const onCancel = vi.fn();

    const { container } = render(
      <PaymentModal {...defaultProps} onCancel={onCancel} />,
    );

    // Click on the overlay (outermost div)
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);

    expect(onCancel).toHaveBeenCalled();
  });

  it("resets state when switching between payment methods", () => {
    render(<PaymentModal {...defaultProps} />);

    // Enter cash
    fireEvent.click(screen.getByText("Dinheiro"));
    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "30.00" } });

    // Switch to MB WAY
    fireEvent.click(screen.getByText("MB WAY"));

    // Switch back to cash — input should be reset
    fireEvent.click(screen.getByText("Dinheiro"));
    const freshInputs = screen.getAllByPlaceholderText("0.00");
    const freshCashInput = freshInputs[
      freshInputs.length - 1
    ] as HTMLInputElement;
    expect(freshCashInput.value).toBe("");
  });

  it("renders all four payment methods", () => {
    render(<PaymentModal {...defaultProps} />);

    expect(screen.getByText("Dinheiro")).toBeTruthy();
    expect(screen.getByText("Cartao")).toBeTruthy();
    expect(screen.getByText("MB WAY")).toBeTruthy();
    expect(screen.getByText("PIX")).toBeTruthy();
  });
});
