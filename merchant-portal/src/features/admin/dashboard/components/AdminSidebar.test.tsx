/**
 * @vitest-environment jsdom
 *
 * AdminSidebar — TpvQuickLink unit tests
 * Validates UXG-010: sidebar "Abrir TPV" redirects browser to /admin/devices,
 * desktop app navigates directly to /op/tpv.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock platformDetection
const mockIsDesktopApp = vi.fn(() => false);
vi.mock("../../../../core/operational/platformDetection", () => ({
  isDesktopApp: () => mockIsDesktopApp(),
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
    mockIsDesktopApp.mockReturnValue(false);
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    mockIsDesktopApp.mockReset();
  });

  it("renders 'Abrir TPV' button", () => {
    renderSidebar();
    expect(screen.getByText(/Abrir TPV/)).toBeTruthy();
  });

  it("in browser: shows notice and redirects to /admin/devices", () => {
    mockIsDesktopApp.mockReturnValue(false);
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
    mockIsDesktopApp.mockReturnValue(true);
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
