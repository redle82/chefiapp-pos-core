/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AdminDevicesPage } from "./AdminDevicesPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "00000000-0000-0000-0000-000000000100",
    },
  }),
}));

vi.mock("./api/devicesApi", () => ({
  fetchTerminals: vi.fn().mockResolvedValue([]),
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

vi.mock("./PrinterAssignmentWizard", () => ({
  PrinterAssignmentWizard: () => <div>printer-assignment-wizard</div>,
}));

describe("AdminDevicesPage - desktop separation", () => {
  it("keeps install/diagnostics out of /admin/devices and links to TPV page", async () => {
    render(
      <MemoryRouter>
        <AdminDevicesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("devices.appstaffTitle")).toBeTruthy();
    expect(screen.queryByText("downloadTitle")).toBeNull();
    expect(screen.queryByText("Verificar TPV")).toBeNull();
    expect(screen.queryByText("Verificar KDS")).toBeNull();

    // Hub: link discreto TPV leva para tela oficial
    const tpvLink = screen.getByRole("link", { name: /devices.tpvLinkLabel/i });
    expect(tpvLink.getAttribute("href")).toBe("/admin/devices/tpv");
  });
});
