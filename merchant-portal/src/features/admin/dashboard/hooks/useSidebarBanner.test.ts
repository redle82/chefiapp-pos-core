/**
 * Unit: useSidebarBanner
 * Contrato: BILLING_SUSPENSION_CONTRACT, SETUP_PROGRESS_CONTRACT
 * Cobre os 4 estados do SystemState → variante correta + keys i18n + params.
 */

import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import type { RestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { RestaurantRuntimeContext } from "../../../../context/RestaurantRuntimeContext";
import { useSidebarBanner } from "./useSidebarBanner";

// ─── Mock helpers ────────────────────────────────────────────────────────────

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
    lifecycle: { configured: false, published: false, operational: false },
    loading: false,
    error: null,
    systemState: "SETUP",
    trial_ends_at: null,
    ...overrides,
  } as RestaurantRuntime);

const makeWrapper =
  (runtime: RestaurantRuntime) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(RestaurantRuntimeContext.Provider, {
      value: {
        runtime,
        refresh: () => Promise.resolve(undefined),
        updateSetupStatus: () => Promise.resolve(undefined),
        publishRestaurant: () => Promise.resolve(undefined),
        installModule: () => Promise.resolve(undefined),
        setProductMode: () => undefined,
      },
      children,
    });

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useSidebarBanner", () => {
  describe("SETUP variant", () => {
    it("returns setup variant with correct progress keys", () => {
      const runtime = createMockRuntime({
        systemState: "SETUP",
        setup_status: {
          identity: true,
          location: false,
          menu: false,
          publish: false,
        },
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.variant).toBe("setup");
      expect(result.current.headlineKey).toBe("banner.setup.headline");
      expect(result.current.bodyKey).toBe("banner.setup.body");
      expect(result.current.ctaKey).toBe("banner.setup.cta");
      expect(result.current.ctaTo).toBe("/admin/config/locations"); // next incomplete step
    });

    it("computes progress fraction from completed setup steps", () => {
      const runtime = createMockRuntime({
        systemState: "SETUP",
        setup_status: {
          identity: true,
          location: true,
          menu: false,
          publish: false,
        },
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.progress).toBeCloseTo(0.5); // 2/4
      expect(result.current.params).toMatchObject({ done: 2, total: 4 });
    });

    it("returns 0 progress when all steps incomplete", () => {
      const runtime = createMockRuntime({
        systemState: "SETUP",
        setup_status: {},
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.progress).toBe(0);
      expect(result.current.params).toMatchObject({ done: 0, total: 4 });
    });

    it("returns ctaTo general config when identity is next step", () => {
      const runtime = createMockRuntime({
        systemState: "SETUP",
        setup_status: {},
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.ctaTo).toBe("/admin/config/general");
    });
  });

  describe("TRIAL variant", () => {
    it("returns trial variant with days remaining and upgrade CTA", () => {
      const futureDate = new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const runtime = createMockRuntime({
        systemState: "TRIAL",
        trial_ends_at: futureDate,
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.variant).toBe("trial");
      expect(result.current.headlineKey).toBe("banner.trial.headline");
      expect(result.current.ctaTo).toBe("/admin/config/subscription");
      expect(result.current.progress).toBeNull();
      expect((result.current.params as { days: number }).days).toBeGreaterThan(
        3,
      );
    });

    it("returns urgent headline when trial ends in ≤3 days", () => {
      const soonDate = new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const runtime = createMockRuntime({
        systemState: "TRIAL",
        trial_ends_at: soonDate,
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.headlineKey).toBe("banner.trial.headlineUrgent");
    });

    it("defaults to 14 days when trial_ends_at is null", () => {
      const runtime = createMockRuntime({
        systemState: "TRIAL",
        trial_ends_at: null,
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect((result.current.params as { days: number }).days).toBe(14);
    });
  });

  describe("ACTIVE variant", () => {
    it("returns active variant with plan name and no CTA", () => {
      const runtime = createMockRuntime({
        systemState: "ACTIVE",
        plan: "premium",
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.variant).toBe("active");
      expect(result.current.headlineKey).toBe("banner.active.headline");
      expect(result.current.ctaKey).toBeNull();
      expect(result.current.ctaTo).toBeNull();
      expect(result.current.progress).toBeNull();
      expect(result.current.params).toMatchObject({ plan: "premium" });
    });
  });

  describe("SUSPENDED variant", () => {
    it("returns suspended variant with payment CTA", () => {
      const runtime = createMockRuntime({
        systemState: "SUSPENDED",
      });

      const { result } = renderHook(() => useSidebarBanner(), {
        wrapper: makeWrapper(runtime),
      });

      expect(result.current.variant).toBe("suspended");
      expect(result.current.headlineKey).toBe("banner.suspended.headline");
      expect(result.current.ctaKey).toBe("banner.suspended.cta");
      expect(result.current.ctaTo).toBe("/admin/config/subscription");
      expect(result.current.progress).toBeNull();
    });
  });
});
