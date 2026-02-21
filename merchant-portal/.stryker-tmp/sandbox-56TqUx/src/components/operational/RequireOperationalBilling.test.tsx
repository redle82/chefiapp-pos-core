/**
 * Unit: RequireOperational + billing
 * Contrato: BILLING_SUSPENSION_CONTRACT, OPERATIONAL_GATES_CONTRACT
 * RequireOperational bloqueia TPV/KDS quando billing_status é past_due ou suspended/canceled.
 */
// @ts-nocheck


import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import { RequireOperational } from "./RequireOperational";

const createMockRuntime = (
  overrides: Partial<RestaurantRuntime> = {},
): RestaurantRuntime =>
  ({
    restaurant_id: "r1",
    mode: "onboarding",
    productMode: "trial",
    installed_modules: [],
    active_modules: [],
    plan: "basic",
    capabilities: {},
    setup_status: {},
    isPublished: false,
    lifecycle: { configured: true, published: false, operational: false },
    loading: false,
    error: null,
    ...overrides,
  } as RestaurantRuntime);

const mockContextValue = (runtime: RestaurantRuntime) => ({
  runtime,
  refresh: vi.fn().mockResolvedValue(undefined),
  updateSetupStatus: vi.fn().mockResolvedValue(undefined),
  publishRestaurant: vi.fn().mockResolvedValue(undefined),
  installModule: vi.fn().mockResolvedValue(undefined),
  setProductMode: vi.fn(),
});

describe("RequireOperational (e billing TDD)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) =>
    render(<MemoryRouter>{ui}</MemoryRouter>);

  it("shows loading when runtime.loading is true", () => {
    const runtime = createMockRuntime({ loading: true });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>,
    );
    expect(screen.getByText(/Verificando estado operacional/)).toBeTruthy();
    expect(screen.queryByText("TPV Content")).toBeNull();
  });

  it('blocks and shows "Sistema não operacional" when isPublished is false', () => {
    const runtime = createMockRuntime({ isPublished: false });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>,
    );
    expect(screen.getByText("Sistema não operacional")).toBeTruthy();
    expect(screen.getByText(/Ir para o Portal de Gestão/)).toBeTruthy();
    expect(screen.queryByText("TPV Content")).toBeNull();
  });

  it("allows children when isPublished is true", () => {
    const runtime = createMockRuntime({
      isPublished: true,
      lifecycle: { configured: true, published: true, operational: false },
    });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>,
    );
    expect(screen.getByText("TPV Content")).toBeTruthy();
    expect(screen.queryByText("Sistema não operacional")).toBeNull();
  });

  it("blocks when isPublished true but billingStatus is past_due (BILLING_SUSPENSION_CONTRACT)", () => {
    const runtime = createMockRuntime({
      isPublished: true,
      billing_status: "past_due" as RestaurantRuntime["billing_status"],
    });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>,
    );
    expect(screen.getByText("Assinatura em atraso")).toBeTruthy();
    expect(screen.getByText(/Ir para Faturação/)).toBeTruthy();
    expect(screen.queryByText("TPV Content")).toBeNull();
  });

  it("blocks when isPublished true but billingStatus is suspended (BILLING_SUSPENSION_CONTRACT)", () => {
    const runtime = createMockRuntime({
      isPublished: true,
      billing_status: "suspended" as RestaurantRuntime["billing_status"],
    });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>,
    );
    expect(screen.getByText("Assinatura suspensa")).toBeTruthy();
    expect(screen.getByText(/Ir para Faturação/)).toBeTruthy();
    expect(screen.queryByText("TPV Content")).toBeNull();
  });
});
