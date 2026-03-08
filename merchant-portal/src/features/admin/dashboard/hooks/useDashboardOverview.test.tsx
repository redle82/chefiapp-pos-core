import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardOverview } from "../types";

const { mockGetOverview } = vi.hoisted(() => ({
  mockGetOverview: vi.fn(),
}));

vi.mock("../services/dashboardService", () => ({
  getOverviewSafe: mockGetOverview,
}));

import { useDashboardOverview } from "./useDashboardOverview";

function buildOverview(locationId: string): DashboardOverview {
  return {
    locationId,
    tables: { total: 0, occupied: 0 },
    seats: { total: 0, occupied: 0 },
    revenueByHour: [],
    general: {
      deletedProducts: 0,
      deletedPayments: 0,
      discounts: 0,
      pendingAmount: 0,
    },
    stats: {
      totalBills: 0,
      totalSeats: 0,
      avgSeatsPerBill: 0,
      avgAmountPerBill: 0,
      avgAmountPerSeat: 0,
    },
    operation: {
      activeStaffCount: 0,
      criticalTasksCount: 0,
      alertsCount: 0,
    },
  };
}

describe("useDashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call service while locationId is missing", async () => {
    const { result } = renderHook(() => useDashboardOverview(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetOverview).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("calls service when locationId is available", async () => {
    const locationId = "0d77adae-8571-412d-bef8-5d033cf0d471";
    mockGetOverview.mockResolvedValue(buildOverview(locationId));

    const { result } = renderHook(() => useDashboardOverview(locationId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetOverview).toHaveBeenCalledWith(locationId);
    expect(result.current.data?.locationId).toBe(locationId);
  });
});
