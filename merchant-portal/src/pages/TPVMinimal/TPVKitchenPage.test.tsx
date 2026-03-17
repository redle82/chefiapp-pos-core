import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TPVKitchenPage } from "./TPVKitchenPage";

const readActiveOrders = vi.fn();
const readOrderItems = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useOutletContext: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock("../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: { loading: false, coreReachable: true },
  }),
}));

vi.mock("./hooks/useTPVRestaurantId", () => ({
  useTPVRestaurantId: () => "rest-1",
}));

vi.mock("../../infra/readers/OrderReader", () => ({
  readActiveOrders: (...args: unknown[]) => readActiveOrders(...args),
  readOrderItems: (...args: unknown[]) => readOrderItems(...args),
  readPreparedItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../core/infra/CoreOrdersApi", () => ({
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../infra/writers/OrderWriter", () => ({
  markItemReady: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../infra/writers/TableWriter", () => ({
  markTableReadyToServe: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../core/tpv/TPVCentralEvents", () => ({
  TPVCentralEmitters: {
    alertTable: vi.fn(),
    orderReady: vi.fn(),
  },
  tpvEventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
}));

vi.mock("../KDSMinimal/OrderStatusCalculator", () => ({
  calculateOrderStatus: () => ({
    state: "normal" as const,
    delaySeconds: 0,
    maxPrepTime: 300,
    readyRatio: 0,
  }),
}));

vi.mock("../KDSMinimal/OriginBadge", () => ({
  OriginBadge: ({ origin }: { origin?: string }) => (
    <span data-testid="origin-badge">{origin ?? "TPV"}</span>
  ),
}));

vi.mock("../KDSMinimal/ItemTimer", () => ({
  ItemTimer: () => <span>timer</span>,
}));

/** Fixed "now" for deterministic tests — orders created_at use this same time. */
const NOW = new Date("2025-02-16T18:00:00Z");

const baseOrder = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "order-1",
  restaurant_id: "rest-1",
  status: "OPEN",
  payment_status: "UNPAID",
  created_at: NOW.toISOString(),
  number: "1001",
  short_id: "A1",
  table_number: 12,
  origin: "WEB",
  source: "WAITER",
  total_cents: 2400,
  subtotal_cents: 2000,
  tax_cents: 400,
  discount_cents: 0,
  notes: null,
  metadata: null,
  ...overrides,
});

const baseItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "item-1",
  order_id: "order-1",
  name_snapshot: "Pizza",
  price_snapshot: 1200,
  quantity: 1,
  subtotal_cents: 1200,
  created_at: NOW.toISOString(),
  station: "KITCHEN",
  prep_time_seconds: 300,
  ...overrides,
});

describe("TPVKitchenPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Freeze Date.now() so the auto-expire check (>240 min) never triggers.
    // We keep real timers so async/microtask resolution works normally.
    vi.spyOn(Date, "now").mockReturnValue(NOW.getTime());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders three panels and loads orders", async () => {
    readActiveOrders.mockResolvedValue([baseOrder()]);
    readOrderItems.mockResolvedValue([baseItem()]);

    render(<TPVKitchenPage />);

    // English translations from vitest.setup.ts: queue -> "Queue", details -> "Details"
    // "Queue" appears in both a tab button and an h3 heading
    expect((await screen.findAllByText(/Queue/)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Details")).toBeTruthy();
    expect(screen.getByText("Info")).toBeTruthy();
    // orderLabel -> "Order #{{id}}" so #1001 or A1 appears
    await waitFor(() => {
      expect(screen.getAllByText(/#?1001|A1/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("updates details when selecting another order", async () => {
    const order1 = baseOrder({ id: "order-1", number: "1001" });
    const order2 = baseOrder({ id: "order-2", number: "1002", origin: "TPV" });

    readActiveOrders.mockResolvedValue([order1, order2]);
    readOrderItems.mockImplementation((orderId: string) => {
      if (orderId === "order-2") {
        return Promise.resolve([
          baseItem({
            id: "item-2",
            order_id: "order-2",
            name_snapshot: "Pasta",
          }),
        ]);
      }
      return Promise.resolve([baseItem()]);
    });

    render(<TPVKitchenPage />);

    // Wait for first order to appear — English: "Order #1001"
    await waitFor(() => {
      expect(screen.getAllByText(/Order #1001|#1001|A1/).length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByTestId("order-row-order-2"));

    await waitFor(() => {
      expect(screen.getAllByText(/Order #1002|#1002/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
