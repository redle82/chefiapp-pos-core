import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("SplitBillModalWrapper", () => {
  it("splits remaining total equally and registers one share", async () => {
    const onPayPartial = vi.fn();

    render(
      <SplitBillModalWrapper
        orderId="order-123456"
        restaurantId="rest-1"
        orderTotal={10000}
        onPayPartial={onPayPartial}
        onCancel={vi.fn()}
      />,
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
    const onPayPartial = vi.fn();

    render(
      <SplitBillModalWrapper
        orderId="order-123456"
        restaurantId="rest-1"
        orderTotal={4000}
        onPayPartial={onPayPartial}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Valor manual"));
    fireEvent.click(screen.getByText("Dinheiro"));

    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "50.00" } });

    const confirm = screen.getByRole("button", {
      name: "Registar pagamento",
    }) as HTMLButtonElement;
    await waitFor(() => expect(confirm.disabled).toBe(true));
  });
});
