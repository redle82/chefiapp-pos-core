import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SplitBillModalWrapper } from "./SplitBillModalWrapper";

vi.mock("../../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    formatAmount: (cents: number) => `€${(cents / 100).toFixed(2)}`,
  }),
}));

vi.mock("../../../core/tpv/PaymentEngine", () => ({
  PaymentEngine: {
    getPaymentsByOrder: vi.fn().mockResolvedValue([]),
  },
}));

const defaultProps = {
  orderId: "order-123456",
  restaurantId: "rest-1",
  orderTotal: 10000,
  onPayPartial: vi.fn(),
  onCancel: vi.fn(),
};

describe("SplitBillModalWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("splits remaining total equally and registers one share", async () => {
    const onPayPartial = vi.fn();

    render(
      <SplitBillModalWrapper {...defaultProps} onPayPartial={onPayPartial} />,
    );

    expect(screen.getByText("Dividir Conta")).toBeTruthy();
    expect(screen.getAllByText("€100.00").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Cartao"));

    const confirm = screen.getByRole("button", {
      name: "Registar pagamento",
    }) as HTMLButtonElement;
    await waitFor(() => expect(confirm.disabled).toBe(false));

    fireEvent.click(confirm);

    expect(onPayPartial).toHaveBeenCalledWith(5000, "card");
  });

  it("disables manual confirmation when amount exceeds remaining", async () => {
    render(<SplitBillModalWrapper {...defaultProps} orderTotal={4000} />);

    fireEvent.click(screen.getByText("Valor manual"));
    fireEvent.click(screen.getByText("Dinheiro"));

    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "50.00" } });

    const confirm = screen.getByRole("button", {
      name: "Registar pagamento",
    }) as HTMLButtonElement;
    await waitFor(() => expect(confirm.disabled).toBe(true));
  });

  it("adjusts per-person amount when split count changes", async () => {
    render(<SplitBillModalWrapper {...defaultProps} />);

    // Default is 2 people → €50.00 each
    await waitFor(() => {
      expect(screen.getByText("€50.00")).toBeTruthy();
    });

    // Click + to increase to 3
    const plusBtn = screen.getByText("+");
    fireEvent.click(plusBtn);

    // 10000 / 3 = 3333 cents → €33.33
    await waitFor(() => {
      expect(screen.getByText("€33.33")).toBeTruthy();
    });
  });

  it("does not go below 2 people", () => {
    render(<SplitBillModalWrapper {...defaultProps} />);

    const minusBtn = screen.getByText("-");

    // Try to go below 2
    fireEvent.click(minusBtn);
    fireEvent.click(minusBtn);
    fireEvent.click(minusBtn);

    // The count display should still show 2
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();

    render(<SplitBillModalWrapper {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when close button is clicked", () => {
    const onCancel = vi.fn();

    render(<SplitBillModalWrapper {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByLabelText("Fechar"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("shows order ID snippet in header", () => {
    render(<SplitBillModalWrapper {...defaultProps} />);
    expect(screen.getByText("Pedido #123456")).toBeTruthy();
  });

  it("allows manual amount within remaining bounds", async () => {
    const onPayPartial = vi.fn();

    render(
      <SplitBillModalWrapper
        {...defaultProps}
        orderTotal={5000}
        onPayPartial={onPayPartial}
      />,
    );

    fireEvent.click(screen.getByText("Valor manual"));
    fireEvent.click(screen.getByText("Dinheiro"));

    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "30.00" } });

    const confirm = screen.getByRole("button", {
      name: "Registar pagamento",
    }) as HTMLButtonElement;
    await waitFor(() => expect(confirm.disabled).toBe(false));

    fireEvent.click(confirm);

    expect(onPayPartial).toHaveBeenCalledWith(3000, "cash");
  });

  it("shows error message on payment failure", async () => {
    const onPayPartial = vi.fn().mockRejectedValue(new Error("Network error"));

    render(
      <SplitBillModalWrapper {...defaultProps} onPayPartial={onPayPartial} />,
    );

    fireEvent.click(screen.getByText("Dinheiro"));

    const confirm = screen.getByRole("button", {
      name: "Registar pagamento",
    }) as HTMLButtonElement;
    await waitFor(() => expect(confirm.disabled).toBe(false));

    fireEvent.click(confirm);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeTruthy();
    });
  });
});
