import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TablePanel } from "./TablePanel";

vi.mock("../../core/tenant/TenantContext", () => ({
  useTenant: () => ({ tenantId: "tenant-1" }),
}));

vi.mock("../../hooks/useMenuItems", () => ({
  useMenuItems: () => ({ items: [] }),
}));

vi.mock("../TPV/context/TableContext", () => ({
  useTables: () => ({
    tables: [{ id: "table-1", number: 1, status: "occupied" }],
    loading: false,
  }),
}));

const performOrderAction = vi.fn().mockResolvedValue(undefined);
const getActiveOrders = vi.fn().mockResolvedValue(undefined);

vi.mock("../TPV/context/OrderContextReal", () => ({
  useOrders: () => ({
    orders: [
      {
        id: "order-1",
        tableId: "table-1",
        status: "new",
        total: 1000,
        items: [],
        restaurantId: "rest-1",
      },
    ],
    createOrder: vi.fn(),
    addItemToOrder: vi.fn(),
    performOrderAction,
    getActiveOrders,
  }),
}));

vi.mock("../../core/context", () => ({
  useContextEngine: () => ({
    permissions: { canCloseRegister: true },
    role: "manager",
  }),
}));

vi.mock("../../ui/design-system", () => ({
  useToast: () => ({
    success: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock("../../core/currency/useCurrency", () => ({
  useCurrency: () => ({
    formatAmount: (cents: number) => `$${(cents / 100).toFixed(2)}`,
    getCurrency: () => ({ symbol: "$" }),
  }),
}));

vi.mock("./components/AlertSystem", () => ({
  AlertSystem: () => null,
}));

vi.mock("./components/BottomNavBar", () => ({
  BottomNavBar: () => null,
}));

vi.mock("./components/CategoryStrip", () => ({
  CategoryStrip: () => null,
}));

vi.mock("./components/ExceptionReportModal", () => ({
  ExceptionReportModal: () => null,
}));

vi.mock("./components/MiniMap", () => ({
  MiniMap: () => null,
}));

vi.mock("./components/ProductCard", () => ({
  ProductCard: () => null,
}));

vi.mock("./hooks/useWaiterCalls", () => ({
  useWaiterCalls: () => ({ calls: [] }),
}));

vi.mock("../../core/db", () => ({
  db: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  },
}));

// Mock i18n so tablePanel labels render in Portuguese (e.g. "Fechar")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const k = key.split(".").pop() ?? key;
      const map: Record<string, string> = {
        closeBill: "Fechar",
        requestBill: "Conta",
        chargeButton: "Cobrar",
        sendOrder: "Enviar Pedido",
        processing: "Processando...",
        print: "Imprimir",
      };
      return map[k] ?? key;
    },
    i18n: { language: "pt-PT" },
  }),
}));

describe("TablePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens payment modal when Fechar (close bill) is clicked in standalone mode", () => {
    render(
      <MemoryRouter>
        <TablePanel tableId="table-1" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/💰 Fechar/));

    expect(screen.getByText("Pagamento")).toBeTruthy();
  });
});
