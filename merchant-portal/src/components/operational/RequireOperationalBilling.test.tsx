/**
 * Unit: RequireOperational + billing (TDD)
 * Contrato: BILLING_SUSPENSION_CONTRACT, OPERATIONAL_GATES_CONTRACT
 * Estado atual: RequireOperational usa apenas isPublished; billingStatus não implementado.
 * Os cenários com billingStatus (past_due/suspended) estão em it.skip até implementação.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequireOperational } from './RequireOperational';
import { RestaurantRuntimeContext } from '../../context/RestaurantRuntimeContext';
import type { RestaurantRuntime } from '../../context/RestaurantRuntimeContext';

const createMockRuntime = (overrides: Partial<RestaurantRuntime> = {}): RestaurantRuntime =>
  ({
    restaurant_id: 'r1',
    mode: 'onboarding',
    productMode: 'demo',
    installed_modules: [],
    active_modules: [],
    plan: 'basic',
    capabilities: {},
    setup_status: {},
    isPublished: false,
    lifecycle: { configured: true, published: false, operational: false },
    loading: false,
    error: null,
    ...overrides,
  }) as RestaurantRuntime;

const mockContextValue = (runtime: RestaurantRuntime) => ({
  runtime,
  refresh: vi.fn().mockResolvedValue(undefined),
  updateSetupStatus: vi.fn().mockResolvedValue(undefined),
  publishRestaurant: vi.fn().mockResolvedValue(undefined),
  installModule: vi.fn().mockResolvedValue(undefined),
  setProductMode: vi.fn(),
});

describe('RequireOperational (e billing TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) =>
    render(<MemoryRouter>{ui}</MemoryRouter>);

  it('shows loading when runtime.loading is true', () => {
    const runtime = createMockRuntime({ loading: true });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>
    );
    expect(screen.getByText(/Verificando estado operacional/)).toBeTruthy();
    expect(screen.queryByText('TPV Content')).toBeNull();
  });

  it('blocks and shows "Sistema não operacional" when isPublished is false', () => {
    const runtime = createMockRuntime({ isPublished: false });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>
    );
    expect(screen.getByText('Sistema não operacional')).toBeTruthy();
    expect(screen.getByText(/Ir para o Portal de Gestão/)).toBeTruthy();
    expect(screen.queryByText('TPV Content')).toBeNull();
  });

  it('allows children when isPublished is true', () => {
    const runtime = createMockRuntime({
      isPublished: true,
      lifecycle: { configured: true, published: true, operational: false },
    });
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>
    );
    expect(screen.getByText('TPV Content')).toBeTruthy();
    expect(screen.queryByText('Sistema não operacional')).toBeNull();
  });

  // TDD: RequireOperational ainda não lê billingStatus. Quando implementar,
  // descomentar e o teste deve passar (bloquear quando billingStatus === 'past_due' ou 'suspended').
  it.skip('blocks when isPublished true but billingStatus is past_due (TDD: implementar billing no gate)', () => {
    const runtime = createMockRuntime({ isPublished: true });
    (runtime as RestaurantRuntime & { billingStatus?: string }).billingStatus = 'past_due';
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>
    );
    expect(screen.queryByText('TPV Content')).toBeNull();
  });

  it.skip('blocks when isPublished true but billingStatus is suspended (TDD: implementar billing no gate)', () => {
    const runtime = createMockRuntime({ isPublished: true });
    (runtime as RestaurantRuntime & { billingStatus?: string }).billingStatus = 'suspended';
    renderWithRouter(
      <RestaurantRuntimeContext.Provider value={mockContextValue(runtime)}>
        <RequireOperational>
          <div>TPV Content</div>
        </RequireOperational>
      </RestaurantRuntimeContext.Provider>
    );
    expect(screen.queryByText('TPV Content')).toBeNull();
  });
});
