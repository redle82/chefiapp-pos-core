import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReceiptShareModal, type ReceiptShareOrder } from "./ReceiptShareModal";

vi.mock("../../core/currency/CurrencyService", () => ({
  currencyService: {
    formatAmount: (cents: number) => `$${(cents / 100).toFixed(2)}`,
  },
}));

// Mock i18n so UI shows Portuguese strings (receipt namespace)
const receiptT = (key: string, opts?: Record<string, unknown>) => {
  const map: Record<string, string> = {
    sendReceipt: "Enviar Recibo",
    orderSummary: `Pedido #${opts?.id ?? ""} — ${opts?.total ?? ""}`,
    emailLabel: "Email do cliente (opcional)",
    sendByEmail: "Enviar por Email",
    share: "Partilhar",
    copyReceipt: "Copiar Recibo",
    print: "Imprimir",
    sent: "✓ Recibo enviado!",
    skip: "Saltar",
    thankYou: "Obrigado pela sua visita!",
    date: "Data:",
    table: "Mesa:",
    order: "Pedido:",
    discount: "Desconto:",
    tip: "Gorjeta:",
    total: "TOTAL:",
    paymentMethod: "Pagamento:",
    defaultRestaurant: "Restaurante",
    emailSubject: "Recibo",
    printTitle: "Recibo",
    shareTitle: "Recibo",
  };
  return map[key] ?? key;
};
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: receiptT,
    i18n: { language: "pt-PT" },
  }),
}));

const sampleOrder: ReceiptShareOrder = {
  id: "abc12345-6789-0000-1111-222233334444",
  tableNumber: 5,
  totalCents: 3500,
  items: [
    { name: "Francesinha", quantity: 1, priceCents: 1500 },
    { name: "Super Bock", quantity: 2, priceCents: 300 },
  ],
  paymentMethod: "cash",
  tipCents: 200,
  discountCents: 100,
  restaurantName: "Tasca do Ouro",
  paidAt: "2026-02-09T12:30:00.000Z",
};

describe("ReceiptShareModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders order ID and total in header", () => {
    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    // Header shows "Pedido #abc12345 — $35.00"
    expect(screen.getByText(/abc12345/)).toBeTruthy();
    expect(screen.getByText(/\$35\.00/)).toBeTruthy();
    expect(screen.getByText("Enviar Recibo")).toBeTruthy();
  });

  it("includes items and restaurant name in receipt text via clipboard", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
      share: undefined,
    });

    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText(/Copiar Recibo/));

    await vi.waitFor(() => {
      const text = writeTextSpy.mock.calls[0][0] as string;
      expect(text).toContain("Tasca do Ouro");
      expect(text).toContain("Francesinha");
      expect(text).toContain("Super Bock");
      expect(text).toContain("$35.00");
    });
  });

  it("includes discount and tip in receipt text via clipboard", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
      share: undefined,
    });

    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText(/Copiar Recibo/));

    await vi.waitFor(() => {
      const text = writeTextSpy.mock.calls[0][0] as string;
      expect(text).toContain("Desconto");
      expect(text).toContain("Gorjeta");
    });
  });

  it("renders action buttons for email, share/copy, and print", () => {
    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    expect(screen.getByText(/Enviar por Email/)).toBeTruthy();
    // navigator.share may or may not exist in test env
    const shareBtn = screen.getByText(/Partilhar|Copiar Recibo/);
    expect(shareBtn).toBeTruthy();
    expect(screen.getByText(/Imprimir/)).toBeTruthy();
  });

  it("opens mailto link when email button is clicked", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText(/Enviar por Email/));

    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining("mailto:"));
    openSpy.mockRestore();
  });

  it("opens mailto with recipient when email is entered", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    const emailInput = screen.getByPlaceholderText(
      /email|cliente/i,
    ) as HTMLInputElement;
    fireEvent.change(emailInput, {
      target: { value: "cliente@test.com" },
    });

    fireEvent.click(screen.getByText(/Enviar por Email/));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("mailto:cliente@test.com"),
    );
    openSpy.mockRestore();
  });

  it("calls onClose when 'Saltar' button is clicked", () => {
    const onClose = vi.fn();

    render(<ReceiptShareModal order={sampleOrder} onClose={onClose} />);

    fireEvent.click(screen.getByText("Saltar"));

    expect(onClose).toHaveBeenCalled();
  });

  it("shows success feedback after share action", async () => {
    // Mock clipboard API for fallback
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
      share: undefined,
    });

    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText(/Copiar Recibo/));

    // Wait for async clipboard write
    await vi.waitFor(() => {
      expect(screen.getByText(/Recibo enviado/)).toBeTruthy();
    });
  });

  it("renders receipt without optional fields (no discount/tip)", async () => {
    const minimalOrder: ReceiptShareOrder = {
      id: "minimal-id-12345",
      totalCents: 1000,
      items: [{ name: "Cafe", quantity: 1, priceCents: 1000 }],
      paymentMethod: "card",
    };

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
      share: undefined,
    });

    render(<ReceiptShareModal order={minimalOrder} onClose={vi.fn()} />);

    // Header shows order info
    expect(screen.getByText(/minimal-/)).toBeTruthy();

    // Copy receipt to validate text
    fireEvent.click(screen.getByText(/Copiar Recibo/));

    await vi.waitFor(() => {
      const text = writeTextSpy.mock.calls[0][0] as string;
      expect(text).toContain("Cafe");
      expect(text).toContain("CARD");
      // Should NOT contain discount or tip
      expect(text).not.toContain("Desconto");
      expect(text).not.toContain("Gorjeta");
    });
  });

  it("includes 'Obrigado pela sua visita!' in receipt text", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
      share: undefined,
    });

    render(<ReceiptShareModal order={sampleOrder} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText(/Copiar Recibo/));

    await vi.waitFor(() => {
      const text = writeTextSpy.mock.calls[0][0] as string;
      expect(text).toContain("Obrigado pela sua visita!");
    });
  });
});
