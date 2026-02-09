import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaymentModal } from "./PaymentModal";

vi.mock("../../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    formatAmount: (cents: number) => `€${(cents / 100).toFixed(2)}`,
  }),
}));

describe("PaymentModal", () => {
  it("shows total and disables confirm until a method is chosen", () => {
    const onPay = vi.fn();
    const onCancel = vi.fn();

    render(
      <PaymentModal
        orderId="order-123456"
        restaurantId="rest-1"
        orderTotal={2500}
        onPay={onPay}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("TOTAL A PAGAR")).toBeTruthy();
    expect(screen.getByText("€25.00")).toBeTruthy();

    const confirm = screen.getByRole("button", {
      name: "Confirmar €25.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it("enables cash confirm when cash tendered covers the total", () => {
    const onPay = vi.fn();

    render(
      <PaymentModal
        orderId="order-123456"
        restaurantId="rest-1"
        orderTotal={2500}
        onPay={onPay}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Dinheiro"));

    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "24.00" } });

    const confirm = screen.getByRole("button", {
      name: "Confirmar €25.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(input, { target: { value: "30.00" } });
    expect(confirm.disabled).toBe(false);

    fireEvent.click(confirm);
    expect(onPay).toHaveBeenCalledWith("cash");
  });

  it("maps MB WAY to card for backend payment", () => {
    const onPay = vi.fn();

    render(
      <PaymentModal
        orderId="order-123456"
        restaurantId="rest-1"
        orderTotal={1200}
        onPay={onPay}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("MB WAY"));

    const phoneInput = screen.getByPlaceholderText("9XX XXX XXX");
    fireEvent.change(phoneInput, { target: { value: "912345678" } });

    const confirm = screen.getByRole("button", {
      name: "Confirmar €12.00",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);

    fireEvent.click(confirm);
    expect(onPay).toHaveBeenCalledWith("card");
  });
});
