/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BrowserBlockGuard,
  emitOperationalGuardTelemetry,
} from "./BrowserBlockGuard";

describe("BrowserBlockGuard", () => {
  const originalMatchMedia = window.matchMedia;
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
    });

    // Ensure React Native WebView marker is absent.
    delete (window as Window & { ReactNativeWebView?: unknown })
      .ReactNativeWebView;
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: originalUserAgent,
    });
  });

  it("blocks plain browser access for TPV routes", () => {
    render(
      <MemoryRouter initialEntries={["/op/tpv"]}>
        <Routes>
          <Route
            element={
              <BrowserBlockGuard requiredPlatform="desktop" moduleLabel="TPV" />
            }
          >
            <Route path="/op/tpv" element={<div>TPV content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("TPV não pode ser aberto no navegador"),
    ).toBeTruthy();
    expect(screen.getByTestId("browser-block-guard")).toBeTruthy();
    expect(screen.queryByText("TPV content")).toBeNull();
  });

  it("allows TPV in browser only when mode=trial query is explicit", () => {
    render(
      <MemoryRouter initialEntries={["/op/tpv?mode=trial"]}>
        <Routes>
          <Route
            element={
              <BrowserBlockGuard requiredPlatform="desktop" moduleLabel="TPV" />
            }
          >
            <Route path="/op/tpv" element={<div>TPV content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("browser-block-guard")).toBeNull();
    expect(screen.getByText("TPV content")).toBeTruthy();
  });

  it("emits Sentry breadcrumb for BLOCK decision when sampled", () => {
    const addBreadcrumb = vi.fn();
    const warn = vi.fn();

    emitOperationalGuardTelemetry(
      {
        pathname: "/op/tpv",
        decision: "BLOCK",
        runtime: "browser",
        guard: "operational",
      },
      {
        isDev: false,
        random: () => 0.05,
        sentryApi: { addBreadcrumb },
        warn,
      },
    );

    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: "op-guard",
      level: "warning",
      message: "operational_guard_decision",
      data: {
        pathname: "/op/tpv",
        decision: "BLOCK",
        runtime: "browser",
        guard: "operational",
      },
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to console.warn JSON payload when Sentry breadcrumb is unavailable", () => {
    const warn = vi.fn();

    emitOperationalGuardTelemetry(
      {
        pathname: "/op/tpv",
        decision: "BLOCK",
        runtime: "browser",
        guard: "operational",
      },
      {
        isDev: false,
        random: () => 0.05,
        sentryApi: {},
        warn,
      },
    );

    expect(warn).toHaveBeenCalledWith(
      '[OP_GUARD] {"pathname":"/op/tpv","decision":"BLOCK","runtime":"browser","guard":"operational"}',
    );
  });
});
