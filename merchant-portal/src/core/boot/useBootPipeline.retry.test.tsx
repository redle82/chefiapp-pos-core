import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BootStep } from "./BootState";
import { useBootPipeline } from "./useBootPipeline";

const mockGetTableClient = vi.fn();
const mockGetRestaurantStatus = vi.fn();
const mockGetBackendType = vi.fn();
const mockUseAuth = vi.fn();
const mockResolveBootDestination = vi.fn();
const mockSetLifecycleState = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => ({
    pathname: "/app/dashboard",
    search: "",
  }),
}));

vi.mock("../../config", () => ({
  CONFIG: {
    UI_MODE: "OPERATIONAL_OS",
  },
}));

vi.mock("../auth/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../context/LifecycleStateContext", () => ({
  useLifecycleStateContext: () => ({
    lifecycleState: null,
    setLifecycleState: mockSetLifecycleState,
  }),
}));

vi.mock("../infra/backendAdapter", () => ({
  BackendType: {
    docker: "docker",
    none: "none",
  },
  getBackendType: () => mockGetBackendType(),
}));

vi.mock("../infra/coreRpc", () => ({
  getTableClient: () => mockGetTableClient(),
}));

vi.mock("../billing/coreBillingApi", () => ({
  getRestaurantStatus: (...args: unknown[]) => mockGetRestaurantStatus(...args),
}));

vi.mock("./resolveBootDestination", () => ({
  resolveBootDestination: (...args: unknown[]) =>
    mockResolveBootDestination(...args),
}));

vi.mock("../storage/TabIsolatedStorage", () => ({
  getTabIsolated: () => null,
  setTabIsolated: () => undefined,
}));

vi.mock("../tenant/TenantResolver", () => ({
  clearActiveTenant: () => undefined,
  getActiveTenant: () => null,
  isTenantSealed: () => false,
  readTenantIdWithLegacyFallback: () => null,
  setActiveTenant: () => undefined,
}));

vi.mock("../runtime", () => ({
  isTrial: false,
}));

vi.mock("../readiness/operationalRestaurant", () => ({
  INVALID_OR_SEED_RESTAURANT_IDS: new Set<string>(),
  SOFIA_RESTAURANT_ID: "100",
  TRIAL_RESTAURANT_ID: "099",
  hasOperationalRestaurant: () => false,
}));

function flushPromises(times = 5): Promise<void> {
  return new Promise((resolve) => {
    const run = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      Promise.resolve().then(() => run(left - 1));
    };
    run(times);
  });
}

describe("useBootPipeline retry resilience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockGetBackendType.mockReturnValue("none");
    mockUseAuth.mockReturnValue({
      session: { user: { id: "user-1" } },
      loading: false,
    });

    mockResolveBootDestination.mockReturnValue({
      type: "ALLOW",
      reasonCode: "ROUTE_ALLOW",
      reason: "test-allow",
    });

    mockGetRestaurantStatus.mockResolvedValue({
      id: "rest-1",
      status: "active",
      onboarding_completed_at: new Date().toISOString(),
      billing_status: "active",
      trial_ends_at: null,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("transitions TENANT_TIMEOUT then reset resolves to BOOT_DONE", async () => {
    const never = new Promise<never>(() => {});

    mockGetTableClient.mockImplementationOnce(async () => {
      await never;
      return never;
    });

    const { result } = renderHook(() => useBootPipeline());

    await act(async () => {
      vi.advanceTimersByTime(6100);
      await flushPromises();
    });

    expect(result.current.snapshot.step).toBe(BootStep.TENANT_TIMEOUT);
    expect(result.current.isError).toBe(true);

    const client = {
      from: () => ({
        select: () => ({
          eq: async () => ({
            data: [{ restaurant_id: "rest-1", role: "owner" }],
            error: null,
          }),
        }),
      }),
    };

    mockGetTableClient.mockResolvedValue(client);

    await act(async () => {
      result.current.reset();
      await flushPromises(8);
    });

    expect(result.current.snapshot.step).toBe(BootStep.BOOT_DONE);
    expect(result.current.isError).toBe(false);
    expect(result.current.snapshot.decision?.type).toBe("ALLOW");
  });
});
