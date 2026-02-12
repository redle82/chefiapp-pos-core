import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFrom, mockGetActive } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetActive: vi.fn(),
}));

vi.mock("../../../../core-boundary/docker-core/connection", () => ({
  dockerCoreClient: {
    from: mockFrom,
  },
}));

vi.mock("../../../../core/alerts/AlertEngine", () => ({
  alertEngine: {
    getActive: mockGetActive,
  },
}));

import { getOverview } from "./dashboardService";

describe("dashboardService.getOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips core queries when locationId is empty", async () => {
    const result = await getOverview("");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockGetActive).not.toHaveBeenCalled();
    expect(result.locationId).toBe("");
    expect(result.tables.total).toBe(0);
    expect(result.operation.alertsCount).toBe(0);
  });

  it("skips core queries when locationId is not a UUID", async () => {
    const result = await getOverview("trial-location-sofia-gastrobar");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockGetActive).not.toHaveBeenCalled();
    expect(result.locationId).toBe("trial-location-sofia-gastrobar");
    expect(result.stats.totalBills).toBe(0);
  });
});
