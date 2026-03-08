import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRestaurantIdentity } from "./useRestaurantIdentity";

const mockFetchRestaurantForIdentity = vi.fn();
const mockGetOrCreateRestaurantId = vi.fn();
const mockGetTabIsolated = vi.fn();

vi.mock("../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-1",
      productMode: null,
    },
  }),
}));

vi.mock("../../infra/readers/RuntimeReader", () => ({
  fetchRestaurantForIdentity: (...args: unknown[]) =>
    mockFetchRestaurantForIdentity(...args),
  getOrCreateRestaurantId: (...args: unknown[]) =>
    mockGetOrCreateRestaurantId(...args),
}));

vi.mock("../infra/backendAdapter", () => ({
  isDockerBackend: () => true,
}));

vi.mock("../kernel/RuntimeContext", () => ({
  RUNTIME_MODE: "app",
}));

vi.mock("../logger/Logger", () => ({
  configureSentryScope: () => undefined,
}));

vi.mock("../readiness/operationalRestaurant", () => ({
  TRIAL_RESTAURANT_ID: "trial-rest-id",
}));

vi.mock("../storage/TabIsolatedStorage", () => ({
  getTabIsolated: (...args: unknown[]) => mockGetTabIsolated(...args),
}));

describe("useRestaurantIdentity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTabIsolated.mockReturnValue(null);
    mockGetOrCreateRestaurantId.mockResolvedValue("rest-1");
  });

  it("marks the restaurant as TEST when the Core row is in trial mode", async () => {
    mockFetchRestaurantForIdentity.mockResolvedValue({
      id: "rest-1",
      name: "Sofia Gastrobar",
      slug: "sofia-gastrobar",
      status: "active",
      tenant_id: null,
      product_mode: "trial",
      type: "Restaurante",
      city: "Ibiza",
      logo_url: null,
    });

    const { result } = renderHook(() => useRestaurantIdentity());

    await waitFor(() => expect(result.current.identity.loading).toBe(false));

    expect(result.current.identity.name).toBe("Sofia Gastrobar");
    expect(result.current.identity.environmentLabel).toBe("TEST");
    expect(result.current.identity.isTestLike).toBe(true);
  });
});
