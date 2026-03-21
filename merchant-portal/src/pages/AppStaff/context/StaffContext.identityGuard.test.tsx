import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { StaffProvider, useStaff } from "./StaffContext";

vi.mock("../../../core/runtime/RuntimeContext", () => ({
  RUNTIME: { isTrial: false },
}));

vi.mock("../../../features/auth/connectByCode", () => ({
  connectByCode: vi.fn(async () => ({ success: false })),
}));

vi.mock("../../../features/admin/locations/store/locationsStore", () => ({
  locationsStore: {
    getLocations: () => [],
  },
}));

vi.mock("../../../hooks/useOperationalMetrics", () => ({
  useOperationalMetrics: () => ({ data: null }),
}));

vi.mock("../../../intelligence/education/TrainingContext", () => ({
  TrainingProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useTraining: () => ({
    triggerLesson: vi.fn(),
    learnedSkills: [],
  }),
}));

vi.mock("../hooks/useAppStaffOrders", () => ({
  useAppStaffOrders: () => ({
    orders: [],
    refetch: vi.fn(async () => undefined),
  }),
}));

vi.mock("../core/ReflexEngine", () => ({
  useReflexEngine: () => undefined,
}));

vi.mock("../../../core/db", () => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: null, error: null })),
    then: vi.fn(async (resolve: (value: { data: []; error: null }) => void) =>
      resolve({ data: [], error: null }),
    ),
  };

  return {
    db: {
      from: vi.fn(() => chain),
    },
  };
});

function Probe() {
  const { activeWorkerId, activeRole, shiftState, checkIn, devQuickCheckIn } =
    useStaff();

  return (
    <div>
      <div data-testid="worker">{activeWorkerId ?? "none"}</div>
      <div data-testid="role">{activeRole}</div>
      <div data-testid="shift">{shiftState}</div>
      <button
        onClick={() => {
          void checkIn("Manual User", "employee-123");
        }}
      >
        checkin
      </button>
      <button
        onClick={() => {
          devQuickCheckIn("manager");
        }}
      >
        quickcheckin
      </button>
    </div>
  );
}

describe("StaffContext identity guard", () => {
  it("preserves login-bound user identity on checkIn and devQuickCheckIn", async () => {
    render(
      <StaffProvider restaurantId="restaurant-1" userId="auth-user-1">
        <Probe />
      </StaffProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("worker").textContent).toBe("auth-user-1");
      expect(screen.getByTestId("role").textContent).toBe("owner");
      expect(screen.getByTestId("shift").textContent).toBe("active");
    });

    fireEvent.click(screen.getByText("checkin"));

    await waitFor(() => {
      expect(screen.getByTestId("worker").textContent).toBe("auth-user-1");
      expect(screen.getByTestId("role").textContent).toBe("owner");
      expect(screen.getByTestId("shift").textContent).toBe("active");
    });

    fireEvent.click(screen.getByText("quickcheckin"));

    await waitFor(() => {
      expect(screen.getByTestId("worker").textContent).toBe("auth-user-1");
      expect(screen.getByTestId("role").textContent).toBe("owner");
      expect(screen.getByTestId("shift").textContent).toBe("active");
    });
  });
});
