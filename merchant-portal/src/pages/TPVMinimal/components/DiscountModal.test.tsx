import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DiscountModal } from "./DiscountModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>) => {
      const map: Record<string, string> = {
        "discount.title": "Aplicar Desconto",
        "discount.percentage": "Percentagem",
        "discount.fixed": "Valor Fixo",
        "discount.custom": "Personalizado",
        "discount.reason": "Motivo (opcional)",
        "discount.reasonPlaceholder": "Ex: Desconto funcionario, Happy Hour...",
        "discount.apply": "Aplicar",
        "discount.remove": "Remover desconto",
        "discount.addDiscount": "Adicionar desconto",
        "discount.maxExceeded": "Desconto nao pode exceder o total",
        "discount.active": "Desconto aplicado",
      };
      if (key === "discount.preview" && typeof fallbackOrOpts === "object") {
        return `Desconto: ${(fallbackOrOpts as Record<string, string>).amount}`;
      }
      if (map[key]) return map[key];
      if (typeof fallbackOrOpts === "string") return fallbackOrOpts;
      if (typeof fallbackOrOpts === "object" && "defaultValue" in fallbackOrOpts)
        return (fallbackOrOpts as Record<string, string>).defaultValue;
      return key;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    currency: "EUR",
    setCurrency: vi.fn(),
    symbol: "\u20AC",
    formatAmount: (cents: number) => `\u20AC${(cents / 100).toFixed(2)}`,
    convertAmount: vi.fn(),
    getCurrency: vi.fn(),
    supportedCurrencies: [],
  }),
}));

const defaultProps = {
  subtotalCents: 10000, // 100.00
  currentDiscountCents: 0,
  onApply: vi.fn(),
  onRemove: vi.fn(),
  onClose: vi.fn(),
};

function renderModal(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<DiscountModal {...props} />);
}

describe("DiscountModal", () => {
  it("renders percentage presets (5%, 10%, 15%, 20%)", () => {
    renderModal();

    expect(screen.getByTestId("preset-5")).toBeTruthy();
    expect(screen.getByTestId("preset-10")).toBeTruthy();
    expect(screen.getByTestId("preset-15")).toBeTruthy();
    expect(screen.getByTestId("preset-20")).toBeTruthy();

    expect(screen.getByTestId("preset-5").textContent).toContain("5%");
    expect(screen.getByTestId("preset-10").textContent).toContain("10%");
    expect(screen.getByTestId("preset-15").textContent).toContain("15%");
    expect(screen.getByTestId("preset-20").textContent).toContain("20%");
  });

  it("switching to fixed mode shows amount input", () => {
    renderModal();

    // Initially no fixed input
    expect(screen.queryByTestId("fixed-amount-input")).toBeNull();

    // Click fixed mode
    fireEvent.click(screen.getByTestId("mode-fixed"));

    expect(screen.getByTestId("fixed-amount-input")).toBeTruthy();
  });

  it("applying percentage calculates correct cents", () => {
    const onApply = vi.fn();
    renderModal({ onApply });

    // Click 10% preset
    fireEvent.click(screen.getByTestId("preset-10"));

    // Preview should show
    expect(screen.getByTestId("discount-preview")).toBeTruthy();

    // Apply
    fireEvent.click(screen.getByTestId("apply-discount-btn"));

    // 10% of 10000 = 1000
    expect(onApply).toHaveBeenCalledWith(1000, undefined);
  });

  it("max validation prevents over-100% discount", () => {
    renderModal();

    const customInput = screen.getByTestId("custom-pct-input");
    fireEvent.change(customInput, { target: { value: "150" } });

    expect(screen.getByTestId("validation-error")).toBeTruthy();
    expect(screen.getByTestId("validation-error").textContent).toContain(
      "Desconto nao pode exceder o total",
    );

    // Apply button should be disabled
    const applyBtn = screen.getByTestId("apply-discount-btn");
    expect(applyBtn.hasAttribute("disabled")).toBe(true);
  });

  it("remove button calls onRemove when discount exists", () => {
    const onRemove = vi.fn();
    renderModal({ currentDiscountCents: 500, onRemove });

    const removeBtn = screen.getByTestId("remove-discount-btn");
    expect(removeBtn).toBeTruthy();

    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not show remove button when no current discount", () => {
    renderModal({ currentDiscountCents: 0 });

    expect(screen.queryByTestId("remove-discount-btn")).toBeNull();
  });

  it("reason field is optional", () => {
    const onApply = vi.fn();
    renderModal({ onApply });

    // Select a preset
    fireEvent.click(screen.getByTestId("preset-5"));

    // Apply without filling reason
    fireEvent.click(screen.getByTestId("apply-discount-btn"));

    expect(onApply).toHaveBeenCalledWith(500, undefined);
  });

  it("reason field value is passed to onApply", () => {
    const onApply = vi.fn();
    renderModal({ onApply });

    fireEvent.click(screen.getByTestId("preset-5"));

    const reasonInput = screen.getByTestId("reason-input");
    fireEvent.change(reasonInput, { target: { value: "Employee discount" } });

    fireEvent.click(screen.getByTestId("apply-discount-btn"));

    expect(onApply).toHaveBeenCalledWith(500, "Employee discount");
  });

  it("close button calls onClose", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByTestId("close-discount-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("overlay click calls onClose", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByTestId("discount-modal-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fixed amount mode validates against subtotal", () => {
    renderModal({ subtotalCents: 5000 }); // 50.00

    fireEvent.click(screen.getByTestId("mode-fixed"));

    const input = screen.getByTestId("fixed-amount-input");
    fireEvent.change(input, { target: { value: "60" } }); // 60.00 > 50.00

    expect(screen.getByTestId("validation-error")).toBeTruthy();
  });
});
