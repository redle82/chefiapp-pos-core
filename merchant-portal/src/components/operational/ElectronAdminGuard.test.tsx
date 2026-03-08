/**
 * @vitest-environment jsdom
 *
 * Surface Isolation Tests — ElectronAdminGuard
 *
 * Verifies that admin routes are blocked inside desktop operational windows
 * and allowed in browser context.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElectronAdminGuard } from "./ElectronAdminGuard";

describe("ElectronAdminGuard", () => {
  beforeEach(() => {
    delete window.electronBridge;
    // Ensure no Tauri marker
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
  });

  afterEach(() => {
    cleanup();
    delete window.electronBridge;
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
  });

  it("allows admin routes in browser context", () => {
    render(
      <MemoryRouter initialEntries={["/admin/modules"]}>
        <Routes>
          <Route element={<ElectronAdminGuard />}>
            <Route path="/admin/modules" element={<div>Admin Modules</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin Modules")).toBeTruthy();
    expect(screen.queryByTestId("electron-admin-guard")).toBeNull();
  });

  it("blocks admin routes in Electron context", () => {
    window.electronBridge = {
      getTerminalConfig: vi.fn(),
      setTerminalConfig: vi.fn(),
      clearTerminalConfig: vi.fn(),
      getAppInfo: vi.fn(),
      getPrinters: vi.fn(),
      navigateToApp: vi.fn(),
      closeApp: vi.fn(),
      printLabel: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={["/admin/modules"]}>
        <Routes>
          <Route element={<ElectronAdminGuard />}>
            <Route path="/admin/modules" element={<div>Admin Modules</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Admin Modules")).toBeNull();
    expect(screen.getByTestId("electron-admin-guard")).toBeTruthy();
    expect(screen.getByText("Área de administração")).toBeTruthy();
  });

  it("blocks admin routes in Tauri context", () => {
    (window as Window & { __TAURI__?: unknown }).__TAURI__ = {};

    render(
      <MemoryRouter initialEntries={["/admin/home"]}>
        <Routes>
          <Route element={<ElectronAdminGuard />}>
            <Route path="/admin/home" element={<div>Admin Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Admin Home")).toBeNull();
    expect(screen.getByTestId("electron-admin-guard")).toBeTruthy();
  });
});
