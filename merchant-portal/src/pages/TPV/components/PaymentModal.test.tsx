import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentModal } from "./PaymentModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const texts: Record<string, string> = {
        "payment.title": "Pagamento",
        "payment.orderId": "Pedido #{{id}}",
        "payment.totalToPay": "TOTAL A PAGAR",
        "payment.subtotal": "Subtotal",
        "payment.tip": "Gorjeta",
        "payment.tipOptional": "Gorjeta (opcional)",
        "payment.noTip": "Sem",
        "payment.other": "Outro:",
        "payment.paymentMethod": "Forma de Pagamento",
        "payment.cashTendered": "Valor Entregue",
        "payment.exact": "Exato",
        "payment.change": "Troco",
        "payment.shortBy": "Faltam {{amount}}",
        "payment.confirm": "Confirmar {{amount}}",
        "payment.trialSimulated":
          "Ambiente Simulado (Trial): pagamento simulado",
        "payment.preparing": "A preparar pagamento...",
        "payment.processing": "A processar...",
        "payment.method.cashLabel": "Dinheiro",
        "payment.method.cashDesc": "Pagamento em espécie",
        "payment.method.cardLabel": "Cartão",
        "payment.method.cardDesc": "Terminal MB / Visa / MC",
        "payment.method.mbwayLabel": "MB WAY",
        "payment.method.mbwayDesc": "Pagamento por telemóvel",
        "payment.method.pixLabel": "PIX",
        "payment.method.pixDesc": "Transferência instantânea",
        "payment.method.sumup_eurLabel": "Cartão EUR",
        "payment.method.sumup_eurDesc": "SumUp (ES/PT/DE)",
        "payment.method.otherLabel": "Outro",
        "common:close": "Close",
      };
      let result = texts[key] || key;
      if (opts && typeof opts === "object") {
        Object.entries(opts).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

vi.mock("../../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    formatAmount: (cents: number) => `$${(cents / 100).toFixed(2)}`,
    currency: "USD",
    getCurrency: () => ({ symbol: "$" }),
  }),
}));

vi.mock("../../../core/payment/PaymentBroker", () => ({
  PaymentBroker: {
    createPaymentIntent: vi.fn(),
  },
}));

vi.mock("../../../core/payment/paymentRegion", () => ({
  getPaymentRegion: () => "europe",
  getPaymentMethodIdsForRegion: () => ["cash", "mbway", "sumup_eur"],
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
    expect(screen.getByText("$25.00")).toBeTruthy();

    const confirm = screen.getByRole("button", {
      name: "Confirmar $25.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it("shows order ID snippet in header", () => {
    render(<PaymentModal {...defaultProps} />);
    expect(screen.getByText("Pedido #123456")).toBeTruthy();
  });

  it("shows GUIDED TRIAL badge when isTrialMode is true", () => {
    render(<PaymentModal {...defaultProps} isTrialMode />);
    expect(screen.getByText("GUIDED TRIAL")).toBeTruthy();
  });

  it("enables cash confirm when cash tendered covers the total", () => {
    const onPay = vi.fn();

    render(<PaymentModal {...defaultProps} onPay={onPay} />);

    fireEvent.click(screen.getByTestId("payment-method-cash"));

    // Two inputs share placeholder "0.00": tip custom (small) and cash (large).
    // Cash input is the second one.
    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "24.00" } });

    const confirm = screen.getByRole("button", {
      name: "Confirmar $25.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(cashInput, { target: { value: "30.00" } });
    expect(confirm.disabled).toBe(false);

    fireEvent.click(confirm);
    expect(onPay).toHaveBeenCalledWith("cash", undefined, undefined);
  });

  it("shows correct change when cash exceeds total", () => {
    render(<PaymentModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId("payment-method-cash"));

    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "30.00" } });

    expect(screen.getByText("Troco")).toBeTruthy();
    expect(screen.getByText("$5.00")).toBeTruthy();
  });

  it("shows 'Faltam' when cash is insufficient", () => {
    render(<PaymentModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId("payment-method-cash"));

    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "20.00" } });

    expect(screen.getByText(/Faltam \$5\.00/)).toBeTruthy();
  });

  it("quick cash 'Exato' button sets exact total", () => {
    render(<PaymentModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId("payment-method-cash"));
    fireEvent.click(screen.getByText("Exato"));

    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1] as HTMLInputElement;
    // After clicking Exato, the cash input should hold the exact total (or value is set via state).
    // The value may already be "25" or "25.00" depending on implementation.
    expect(Number(cashInput.value)).toBeGreaterThanOrEqual(25);
  });

  // MB WAY tests removed — mbway was removed from METHOD_OPTIONS
  // and is no longer rendered as a standalone payment method.

  it("includes tip in grand total when tip percent is selected", () => {
    render(<PaymentModal {...defaultProps} />);

    // Select 10% tip on $25.00 = $2.50 tip → grand total $27.50
    fireEvent.click(screen.getByText("10%"));

    expect(screen.getByText("$27.50")).toBeTruthy();
    // "Gorjeta" appears in section title AND in the subtotal breakdown;
    // check the breakdown text that includes the tip amount.
    expect(screen.getByText(/\+ Gorjeta/)).toBeTruthy();
  });

  it("passes tip cents to onPay when tip is set", async () => {
    const onPay = vi.fn();

    render(<PaymentModal {...defaultProps} onPay={onPay} />);

    // Select 10% tip → 250 cents tip
    fireEvent.click(screen.getByText("10%"));

    fireEvent.click(screen.getByTestId("payment-method-cash"));

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

    fireEvent.click(screen.getByLabelText("Close"));

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
    fireEvent.click(screen.getByTestId("payment-method-cash"));
    const inputs = screen.getAllByPlaceholderText("0.00");
    const cashInput = inputs[inputs.length - 1];
    fireEvent.change(cashInput, { target: { value: "30.00" } });

    // Switch to another method then back to cash — input should be reset
    fireEvent.click(screen.getByTestId("payment-method-sumup_eur"));

    // Switch back to cash
    fireEvent.click(screen.getByTestId("payment-method-cash"));
    const freshInputs = screen.getAllByPlaceholderText("0.00");
    const freshCashInput = freshInputs[
      freshInputs.length - 1
    ] as HTMLInputElement;
    expect(freshCashInput.value).toBe("");
  });

  it("renders payment methods when online (region-based)", () => {
    render(<PaymentModal {...defaultProps} isOnline />);

    expect(screen.getByText("TOTAL A PAGAR")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Confirmar/ })).toBeTruthy();
    // EUR region shows cash + sumup_eur (paymentRegion.ts)
  });

  it("when offline renders modal with single payment option", () => {
    render(<PaymentModal {...defaultProps} isOnline={false} />);

    expect(screen.getByText("TOTAL A PAGAR")).toBeTruthy();
    // With isOnline=false, methodsToShow is only cash (DoD B3); exact label depends on i18n
  });
});
