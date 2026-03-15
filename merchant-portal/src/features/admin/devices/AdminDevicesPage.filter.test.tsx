/**
 * @vitest-environment jsdom
 *
 * Verifica comportamento contextual de /admin/devices com ?type=
 * e redirect para /admin/devices/tpv quando type=TPV (fluxo único TPV).
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Terminal } from "./api/devicesApi";
import { AdminDevicesPage } from "./AdminDevicesPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-ctx-1",
    },
  }),
}));

const fetchTerminalsMock = vi.fn<[], Promise<Terminal[]>>();

vi.mock("./api/devicesApi", () => ({
  fetchTerminals: () => fetchTerminalsMock(),
  revokeTerminal: vi.fn().mockResolvedValue(undefined),
  createInstallToken: vi.fn().mockResolvedValue({
    token: "TKN_TEST",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }),
}));

vi.mock("../dashboard/components/AdminPageHeader", () => ({
  AdminPageHeader: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle: string;
  }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
}));

describe("AdminDevicesPage contextual filtering", () => {
  it("quando type=TPV, redireciona para /admin/devices/tpv (fluxo único TPV)", () => {
    render(
      <MemoryRouter initialEntries={["/admin/devices?type=TPV"]}>
        <Routes>
          <Route path="/admin/devices" element={<AdminDevicesPage />} />
          <Route
            path="/admin/devices/tpv"
            element={<div data-testid="tpv-terminals-page">TPV page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("tpv-terminals-page")).toBeTruthy();
    expect(screen.getByText("TPV page")).toBeTruthy();
  });

  it("quando type=KDS ou module=kds, redireciona para /admin/devices/tpv (KDS nasce do TPV)", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/devices?type=KDS"]}>
        <Routes>
          <Route path="/admin/devices" element={<AdminDevicesPage />} />
          <Route
            path="/admin/devices/tpv"
            element={<div data-testid="tpv-terminals-page">TPV page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("tpv-terminals-page")).toBeTruthy();
    expect(screen.getByText("TPV page")).toBeTruthy();
  });
});

