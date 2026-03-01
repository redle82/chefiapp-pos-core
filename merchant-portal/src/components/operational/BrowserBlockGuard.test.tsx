/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserBlockGuard } from "./BrowserBlockGuard";

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
});
