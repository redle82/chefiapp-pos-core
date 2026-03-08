/**
 * @vitest-environment jsdom
 *
 * AdminSidebar — TpvQuickLink unit tests
 * Validates UXG-010: sidebar "Abrir TPV" redirects browser to /admin/devices,
 * desktop app navigates directly to /op/tpv.
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dictionary: Record<string, string> = {
        "quickLink.tpvDesktopRequiredRedirectNotice":
          "El TPV requiere la aplicación de escritorio. Redirigiendo a Dispositivos…",
      };
      return dictionary[key] ?? key;
    },
  }),
}));

// Mock centralized entry helper wrapper
const mockOpenTpvInNewWindow = vi.fn();
vi.mock("../../../../core/operational/openOperationalWindow", () => ({
  openTpvInNewWindow: (...args: unknown[]) => mockOpenTpvInNewWindow(...args),
}));

// Must import AFTER vi.mock
const { AdminSidebar } = await import("./AdminSidebar");

/** Helper that captures current location */
function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderSidebar(initialEntry = "/admin/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <AdminSidebar />
              <LocationSpy />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminSidebar — TpvQuickLink (UXG-010)", () => {
  beforeEach(() => {
    mockOpenTpvInNewWindow.mockImplementation(
      (
        _searchParams: string | undefined,
        options: {
          navigate?: (path: string) => void;
          onBrowserBlocked?: () => void;
          onBrowserFallback?: () => void;
        },
      ) => {
        options.onBrowserBlocked?.();
        setTimeout(() => {
          options.onBrowserFallback?.();
        }, 1800);
      },
    );
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    mockOpenTpvInNewWindow.mockReset();
  });

  it("renders 'Abrir TPV' button", () => {
    renderSidebar();
    expect(screen.getByText(/Abrir TPV/)).toBeTruthy();
  });

  it("in browser: shows notice and redirects to /admin/devices", () => {
    renderSidebar();

    fireEvent.click(screen.getByText(/Abrir TPV/));

    // Notice should appear immediately
    expect(
      screen.getByText(/requiere la aplicación de escritorio/i),
    ).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();

    // Before timeout: still on original page
    expect(screen.getByTestId("location").textContent).toBe("/admin/dashboard");

    // After 1800ms, should redirect
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(screen.getByTestId("location").textContent).toBe("/admin/devices");
  });

  it("in desktop app: navigates directly to /op/tpv without notice", () => {
    mockOpenTpvInNewWindow.mockImplementation(
      (
        _searchParams: string | undefined,
        options: { navigate?: (path: string) => void },
      ) => {
        options.navigate?.("/op/tpv");
      },
    );
    renderSidebar();

    fireEvent.click(screen.getByText(/Abrir TPV/));

    // Should NOT show notice
    expect(
      screen.queryByText(/requiere la aplicación de escritorio/i),
    ).toBeNull();

    // Should navigate to /op/tpv
    expect(screen.getByTestId("location").textContent).toBe("/op/tpv");
  });
});
