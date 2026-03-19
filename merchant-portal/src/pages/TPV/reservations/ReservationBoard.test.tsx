import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ReservationBoard from "./ReservationBoard";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | Record<string, unknown>) => {
      if (typeof opts === "string") return opts;
      return key;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../../../core/i18n/regionLocaleConfig", () => ({
  getFormatLocale: () => "pt-BR",
}));

vi.mock("../../../ui/design-system/tokens/colors", () => ({
  colors: {
    surface: {
      base: "#0a0a0a",
      layer1: "#0f0f0f",
      layer2: "#141414",
      layer3: "#1e1e1e",
    },
    text: {
      primary: "#fafafa",
      secondary: "#9ca3af",
    },
    border: {
      subtle: "rgba(255,255,255,0.08)",
      strong: "rgba(255,255,255,0.2)",
    },
    action: {
      base: "#3b82f6",
    },
  },
}));

vi.mock("../../../ui/design-system/tokens/spacing", () => ({
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
  },
}));

// Build a chainable mock that supports the Supabase query patterns used:
// Day: .from().select().eq().eq().order()
// Week: .from().select().eq().gte().lte().order()
// Insert: .from().insert()
// Update: .from().update().eq()

function buildQueryMock(data: unknown[] = []) {
  const orderFn = vi.fn().mockResolvedValue({ data, error: null });
  const lteFn = vi.fn().mockReturnValue({ order: orderFn });
  const gteFn = vi.fn().mockReturnValue({ lte: lteFn, order: orderFn });
  const eqFn: ReturnType<typeof vi.fn> = vi.fn().mockImplementation(() => ({
    eq: eqFn,
    gte: gteFn,
    lte: lteFn,
    order: orderFn,
  }));
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
  const insertFn = vi
    .fn()
    .mockResolvedValue({ data: { id: "test" }, error: null });
  const updateEqFn = vi.fn().mockResolvedValue({ data: null, error: null });
  const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn });

  return {
    from: vi.fn().mockReturnValue({
      select: selectFn,
      insert: insertFn,
      update: updateFn,
    }),
    _internals: { orderFn, eqFn, selectFn, insertFn, updateFn, updateEqFn },
  };
}

let mockClient: ReturnType<typeof buildQueryMock>;

vi.mock("../../../infra/docker-core/connection", () => ({
  get dockerCoreClient() {
    return mockClient;
  },
}));

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const MOCK_RESERVATION = {
  id: "res-1",
  restaurant_id: "rest-1",
  customer_name: "Maria Silva",
  customer_phone: "+351 912345678",
  customer_email: "maria@test.com",
  party_size: 4,
  reservation_date: new Date().toISOString().slice(0, 10),
  reservation_time: "19:00:00",
  duration_minutes: 90,
  status: "CONFIRMED" as const,
  special_requests: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReservationBoard", () => {
  beforeEach(() => {
    mockClient = buildQueryMock([]);
  });

  it("renders day/week toggle buttons", async () => {
    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("view-day")).toBeTruthy();
      expect(screen.getByTestId("view-week")).toBeTruthy();
    });
  });

  it("defaults to day view", async () => {
    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("day-view")).toBeTruthy();
    });

    expect(screen.queryByTestId("week-view")).toBeNull();
  });

  it("switches to week view when clicking week toggle", async () => {
    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("view-week")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("view-week"));

    await waitFor(() => {
      expect(screen.getByTestId("week-view")).toBeTruthy();
    });

    expect(screen.queryByTestId("day-view")).toBeNull();
  });

  it("shows 7 day columns in weekly view", async () => {
    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("view-week")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("view-week"));

    await waitFor(() => {
      expect(screen.getByTestId("week-view")).toBeTruthy();
    });

    // Each day column has a data-testid="week-day-YYYY-MM-DD"
    const dayColumns = screen
      .getByTestId("week-view")
      .querySelectorAll('[data-testid^="week-day-"]');
    expect(dayColumns.length).toBe(7);
  });

  it("renders status badges with correct dark-theme colors", async () => {
    mockClient = buildQueryMock([MOCK_RESERVATION]);

    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(
        screen.getByTestId("status-badge-CONFIRMED"),
      ).toBeTruthy();
    });

    const badge = screen.getByTestId("status-badge-CONFIRMED");
    expect(badge.style.backgroundColor).toBe("rgba(59, 130, 246, 0.15)");
    expect(badge.style.color).toBe("rgb(96, 165, 250)");
  });

  it("shows confirmation dialog when clicking cancel action", async () => {
    mockClient = buildQueryMock([MOCK_RESERVATION]);

    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(
        screen.getByTestId(`action-cancel-${MOCK_RESERVATION.id}`),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByTestId(`action-cancel-${MOCK_RESERVATION.id}`),
    );

    await waitFor(() => {
      expect(screen.getByTestId("confirm-dialog")).toBeTruthy();
    });

    // Should show the cancel title
    expect(
      screen.getByText("reservations.confirmCancelTitle"),
    ).toBeTruthy();
  });

  it("shows confirmation dialog when clicking no-show action", async () => {
    mockClient = buildQueryMock([MOCK_RESERVATION]);

    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(
        screen.getByTestId(`action-noshow-${MOCK_RESERVATION.id}`),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByTestId(`action-noshow-${MOCK_RESERVATION.id}`),
    );

    await waitFor(() => {
      expect(screen.getByTestId("confirm-dialog")).toBeTruthy();
    });

    expect(
      screen.getByText("reservations.confirmNoShowTitle"),
    ).toBeTruthy();
  });

  it("closes confirmation dialog when clicking cancel button without changing status", async () => {
    mockClient = buildQueryMock([MOCK_RESERVATION]);

    render(<ReservationBoard restaurantId="rest-1" />);

    await waitFor(() => {
      expect(
        screen.getByTestId(`action-cancel-${MOCK_RESERVATION.id}`),
      ).toBeTruthy();
    });

    // Open dialog
    fireEvent.click(
      screen.getByTestId(`action-cancel-${MOCK_RESERVATION.id}`),
    );

    await waitFor(() => {
      expect(screen.getByTestId("confirm-dialog")).toBeTruthy();
    });

    // Click the cancel button in the dialog
    fireEvent.click(screen.getByTestId("confirm-dialog-cancel"));

    // Dialog should be gone
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-dialog")).toBeNull();
    });

    // Update should NOT have been called
    expect(mockClient.from("gm_reservations").update).not.toHaveBeenCalled();
  });
});
